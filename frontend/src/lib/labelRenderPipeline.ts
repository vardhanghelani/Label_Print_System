import type {
  PageConfig,
  LayoutField,
  LabelData,
  CalibrationSettings,
  Category,
  Layout,
  StickerDefinition,
} from '../types';
import {
  getEffectivePageConfig,
  getFieldAbsoluteRect,
  resolveProductFieldValue,
  formatPrintFieldLine,
} from '../types';
import { resolveLayoutFieldsForCategory } from './categoryPrintLayout';
import { resolveStickers } from './geometryBuilder';
import { calibrateMm, LABEL_FONT_MM_SCALE } from './units';
import { isPrintDebugEnabled, logPrintDebug } from './printDebug';

export interface PrintTextItem {
  stickerNumber: number;
  fieldId: string;
  section: string | undefined;
  text: string;
  rect: { x: number; y: number; width: number; height: number };
  calibratedRect: { x: number; y: number; width: number; height: number };
  field: LayoutField;
}

export interface BuildPrintItemsInput {
  pageConfig: PageConfig;
  calibration: CalibrationSettings;
  printPositions: number[];
  positionLabelMap: Array<{
    position: number;
    label: LabelData | null;
    categoryId?: string;
  }>;
  categoriesById?: Map<string, Category>;
  layouts?: Layout[];
  templateId?: string;
  brandName?: string;
}

export interface PrintPipelineDiagnostics {
  stickerCount: number;
  labelsSelected: number;
  printPositions: number[];
  fieldsResolved: number;
  textItems: number;
  skippedEmptyLabels: number;
  skippedEmptyValues: number;
  pageWidth: number;
  pageHeight: number;
  errors: string[];
  warnings: string[];
}

export interface BuildPrintItemsResult {
  items: PrintTextItem[];
  diagnostics: PrintPipelineDiagnostics;
}

function calX(mm: number, calibration: CalibrationSettings): number {
  return calibrateMm(mm, calibration.horizontalOffset, calibration.scaleX);
}

function calY(mm: number, calibration: CalibrationSettings): number {
  return calibrateMm(mm, calibration.verticalOffset, calibration.scaleY);
}

function getCalibratedRect(
  rect: { x: number; y: number; width: number; height: number },
  calibration: CalibrationSettings
) {
  const x0 = calX(rect.x, calibration);
  const y0 = calY(rect.y, calibration);
  const x1 = calX(rect.x + rect.width, calibration);
  const y1 = calY(rect.y + rect.height, calibration);
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

function resolveDisplayValue(
  field: LayoutField,
  values: LabelData,
  category: Category | undefined,
  brandName?: string
): string {
  const raw = resolveProductFieldValue(field, values, category, brandName);
  return formatPrintFieldLine(field, raw, category);
}

function isValidCoord(x: number, y: number, pageW: number, pageH: number): boolean {
  return Number.isFinite(x) && Number.isFinite(y) && x >= -5 && y >= -5 && x <= pageW + 5 && y <= pageH + 5;
}

/** Shared pipeline: product → fields → geometry → absolute coordinates (preview + PDF) */
export function buildPrintTextItems(input: BuildPrintItemsInput): BuildPrintItemsResult {
  const pageConfig = getEffectivePageConfig(input.pageConfig);
  const pageWidth = Number(pageConfig.pageWidth) || 110;
  const pageHeight = Number(pageConfig.pageHeight) || 197;
  const stickers = resolveStickers(pageConfig);
  const printSet = new Set(input.printPositions);
  const labelMap = new Map(
    input.positionLabelMap.map((p) => [p.position, { values: p.label, categoryId: p.categoryId }])
  );

  const items: PrintTextItem[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  let fieldsResolved = 0;
  let skippedEmptyLabels = 0;
  let skippedEmptyValues = 0;

  if (stickers.length === 0) {
    errors.push('No stickers defined in template geometry.');
  }
  if (input.printPositions.length === 0) {
    errors.push('No print positions selected.');
  }

  for (const sticker of stickers) {
    if (!printSet.has(sticker.stickerNumber)) continue;

    const entry = labelMap.get(sticker.stickerNumber);
    const label = entry?.values ?? null;
    const category = entry?.categoryId
      ? input.categoriesById?.get(entry.categoryId)
      : undefined;

    if (!label) {
      skippedEmptyLabels++;
      continue;
    }

    const fields = resolveLayoutFieldsForCategory(
      category,
      input.layouts,
      input.templateId,
      pageConfig
    );
    fieldsResolved += fields.length;

    if (!fields.length) {
      warnings.push(`Sticker ${sticker.stickerNumber}: no layout fields resolved for category.`);
    }

    for (const field of fields) {
      if (field.type === 'logo') continue;

      const value = resolveDisplayValue(field, label, category, input.brandName);
      if (!value.trim()) {
        skippedEmptyValues++;
        continue;
      }

      const rect = getFieldAbsoluteRect(field, sticker);
      const calibratedRect = getCalibratedRect(rect, input.calibration);

      if (!isValidCoord(calibratedRect.x, calibratedRect.y, pageWidth, pageHeight)) {
        warnings.push(
          `Sticker ${sticker.stickerNumber} field "${field.label}" has invalid coordinates.`
        );
        continue;
      }

      items.push({
        stickerNumber: sticker.stickerNumber,
        fieldId: field.id,
        section: field.section,
        text: value,
        rect,
        calibratedRect,
        field,
      });
    }
  }

  if (fieldsResolved === 0 && input.printPositions.length > 0) {
    errors.push('No printable fields resolved.');
  }
  if (items.length === 0 && input.printPositions.length > 0) {
    errors.push('No printable text items generated.');
  }

  const diagnostics: PrintPipelineDiagnostics = {
    stickerCount: stickers.length,
    labelsSelected: input.printPositions.length,
    printPositions: input.printPositions,
    fieldsResolved,
    textItems: items.length,
    skippedEmptyLabels,
    skippedEmptyValues,
    pageWidth,
    pageHeight,
    errors,
    warnings,
  };

  if (isPrintDebugEnabled()) {
    logPrintDebug('buildPrintTextItems', pageWidth, pageHeight, items);
  }

  return {
    items,
    diagnostics,
  };
}

export function fieldFontSizeMm(field: LayoutField, calibration: CalibrationSettings): number {
  const raw = Number(field.fontSize);
  const base = Number.isFinite(raw) && raw > 0 ? Math.max(2, raw * LABEL_FONT_MM_SCALE) : 2.5;
  const scaleY = Number(calibration.scaleY);
  return base * ((Number.isFinite(scaleY) && scaleY > 0 ? scaleY : 100) / 100);
}

export function fontStyle(field: LayoutField): string {
  if (field.bold && field.italic) return 'bolditalic';
  if (field.bold) return 'bold';
  if (field.italic) return 'italic';
  return 'normal';
}

export class PrintPipelineError extends Error {
  constructor(
    message: string,
    readonly diagnostics: PrintPipelineDiagnostics
  ) {
    super(message);
    this.name = 'PrintPipelineError';
  }
}

export function assertPrintReady(result: BuildPrintItemsResult): PrintTextItem[] {
  if (result.diagnostics.errors.length) {
    throw new PrintPipelineError(result.diagnostics.errors.join(' '), result.diagnostics);
  }
  return result.items;
}

export function getStickerForPosition(pageConfig: PageConfig, position: number): StickerDefinition | undefined {
  return resolveStickers(getEffectivePageConfig(pageConfig)).find((s) => s.stickerNumber === position);
}
