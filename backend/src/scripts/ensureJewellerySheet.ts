import { Template } from '../models/Template.js';
import { Layout } from '../models/Layout.js';
import { Settings } from '../models/Settings.js';
import { buildInterlockPageConfig } from '../types/index.js';
import { validateInterlockGeometry } from '../types/geometryValidator.js';
import { debugLogBackend } from '../utils/debugLog.js';

export const JEWELLERY_SHEET_NAME = 'Jewellery Tag Sheet 22';
export const JEWELLERY_LAYOUT_NAME = 'Default Jewellery Label';

export const LEGACY_SHEET_NAMES = ['Jewellery Tag Sheet 14', JEWELLERY_SHEET_NAME];

const SHEET_DESCRIPTION = '110×197 mm interlocking jewellery sheet — 22 stickers';

const TARGET_PAGE = { pageWidth: 110, pageHeight: 197 };
const TARGET_STICKER_COUNT = 22;

export function buildJewellerySheetConfig() {
  return buildInterlockPageConfig(TARGET_PAGE.pageWidth, TARGET_PAGE.pageHeight, {
    stickerCount: TARGET_STICKER_COUNT,
    topMargin: 4,
    bottomMargin: 10.7,
    leftMargin: 5,
    rightMargin: 5,
    broadWidth: 50,
    broadHeight: 14,
    tailWidth: 49,
    tailHeight: 2.5,
    sectionA: { x: 0, y: 0, width: 25, height: 14 },
    sectionB: { x: 25, y: 0, width: 25, height: 14 },
  });
}

function geometryDiffersFromCanonical(config: {
  pageWidth?: number;
  pageHeight?: number;
  stickerCount?: number;
  geometry?: ReturnType<typeof buildJewellerySheetConfig>['geometry'];
}): boolean {
  const canonical = buildJewellerySheetConfig();
  return (
    config.pageWidth !== TARGET_PAGE.pageWidth ||
    config.pageHeight !== TARGET_PAGE.pageHeight ||
    config.stickerCount !== TARGET_STICKER_COUNT ||
    JSON.stringify(config.geometry) !== JSON.stringify(canonical.geometry)
  );
}

function isLegacyTemplateConfig(config: {
  pageWidth?: number;
  pageHeight?: number;
  stickerCount?: number;
  geometry?: ReturnType<typeof buildJewellerySheetConfig>['geometry'];
}): boolean {
  return (
    config.pageWidth === 137 ||
    config.pageHeight === 172 ||
    config.stickerCount === 14 ||
    geometryDiffersFromCanonical(config)
  );
}

async function findJewelleryTemplate() {
  return Template.findOne({
    $or: [
      { name: { $in: LEGACY_SHEET_NAMES } },
      { 'config.pageWidth': 137, 'config.pageHeight': 172 },
      { 'config.stickerCount': 14 },
      { 'config.layoutType': 'jewellery-interlock' },
    ],
  }).sort({ updatedAt: -1 });
}

export interface EnsureJewellerySheetResult {
  templateId: string;
  layoutId: string;
  migrated: boolean;
  previousName?: string;
  previousPageSize?: { width: number; height: number };
  previousStickerCount?: number;
  validation: { valid: boolean; issueCount: number };
}

/** Idempotent: ensures 22-sticker template exists, migrates legacy 14-sticker records */
export async function ensureJewellerySheet(): Promise<EnsureJewellerySheetResult> {
  const config = buildJewellerySheetConfig();
  const validation = validateInterlockGeometry(
    TARGET_PAGE.pageWidth,
    TARGET_PAGE.pageHeight,
    config.geometry!
  );

  let template = await findJewelleryTemplate();
  let migrated = false;
  let previousName: string | undefined;
  let previousPageSize: { width: number; height: number } | undefined;
  let previousStickerCount: number | undefined;

  if (!template) {
    template = await Template.create({
      name: JEWELLERY_SHEET_NAME,
      description: SHEET_DESCRIPTION,
      config,
    });
    migrated = true;
  } else {
    previousName = template.name;
    previousPageSize = {
      width: template.config?.pageWidth ?? 0,
      height: template.config?.pageHeight ?? 0,
    };
    previousStickerCount = template.config?.stickerCount;

    const needsUpdate =
      template.name !== JEWELLERY_SHEET_NAME ||
      isLegacyTemplateConfig(template.config ?? {});

    if (needsUpdate) {
      migrated = true;
      template.name = JEWELLERY_SHEET_NAME;
      template.config = config;
      template.description = SHEET_DESCRIPTION;
      await template.save();
    }
  }

  let layout = await Layout.findOne({ name: JEWELLERY_LAYOUT_NAME, templateId: template._id });
  if (!layout) {
    layout = await Layout.create({
      name: JEWELLERY_LAYOUT_NAME,
      templateId: template._id,
      config: { fields: [] },
    });
  }

  await Settings.findOneAndUpdate(
    { key: 'global' },
    {
      $set: {
        'shop.defaultTemplateId': template._id,
        'shop.defaultLayoutId': layout._id,
      },
    },
    { upsert: true }
  );

  const result: EnsureJewellerySheetResult = {
    templateId: String(template._id),
    layoutId: String(layout._id),
    migrated,
    previousName,
    previousPageSize,
    previousStickerCount,
    validation: { valid: validation.valid, issueCount: validation.issues.length },
  };

  // #region agent log
  debugLogBackend(
    'ensureJewellerySheet.ts:complete',
    'Jewellery sheet migration complete',
    {
      ...result,
      templateName: JEWELLERY_SHEET_NAME,
      pageWidth: config.pageWidth,
      pageHeight: config.pageHeight,
      stickerCount: config.stickerCount,
      validationIssues: validation.issues.map((i) => i.message),
      sticker22: validation.stickers.find((s) => s.stickerNumber === 22),
    },
    'H-A'
  );
  // #endregion

  return result;
}
