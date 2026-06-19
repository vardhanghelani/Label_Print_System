import type { Template, Layout, LayoutConfig, PageConfig } from '../types';
import { getEffectivePageConfig } from '../types';
import {
  JEWELLERY_SHEET_NAME,
  buildJewellerySheetPageConfig,
  JEWELLERY_PAGE,
  JEWELLERY_INTERLOCK_GEOMETRY,
} from './jewelleryGeometry';

export { JEWELLERY_SHEET_NAME, JEWELLERY_PAGE, JEWELLERY_INTERLOCK_GEOMETRY };

export const JEWELLERY_SHEET_CONFIG: PageConfig = buildJewellerySheetPageConfig();

/** Category-driven — no hardcoded jewellery fields */
export const JEWELLERY_LAYOUT_CONFIG: LayoutConfig = {
  fields: [],
};

/** Built-in fallback when API has not loaded yet */
export const JEWELLERY_TEMPLATE: Template = {
  _id: 'builtin-jewellery-sheet',
  name: JEWELLERY_SHEET_NAME,
  description: '110×197 mm interlocking jewellery sheet — 22 stickers',
  config: JEWELLERY_SHEET_CONFIG,
  createdAt: '',
  updatedAt: '',
};

export const JEWELLERY_LAYOUT: Layout = {
  _id: 'builtin-jewellery-layout',
  name: 'Default Jewellery Label',
  templateId: JEWELLERY_TEMPLATE._id,
  config: JEWELLERY_LAYOUT_CONFIG,
  createdAt: '',
  updatedAt: '',
};

function isCanonicalJewelleryConfig(config: PageConfig): boolean {
  return (
    config.pageWidth === JEWELLERY_PAGE.pageWidth &&
    config.pageHeight === JEWELLERY_PAGE.pageHeight &&
    (config.stickerCount ?? config.geometry?.stickerCount) === JEWELLERY_INTERLOCK_GEOMETRY.stickerCount
  );
}

export function isJewellerySheetTemplate(template: Template): boolean {
  return (
    template.config.layoutType === 'jewellery-interlock' ||
    template.name === JEWELLERY_SHEET_NAME
  );
}

/** Single source of truth — always returns validated 22-sticker config */
export function resolveJewelleryTemplate(apiTemplates?: Template[]): Template {
  const canonical = {
    ...JEWELLERY_TEMPLATE,
    config: getEffectivePageConfig(JEWELLERY_SHEET_CONFIG),
  };

  if (!apiTemplates?.length) return canonical;

  const match =
    apiTemplates.find((t) => t.name === JEWELLERY_SHEET_NAME) ??
    apiTemplates.find((t) => isJewellerySheetTemplate(t)) ??
    apiTemplates[0];

  const effective = getEffectivePageConfig(match.config);
  if (!isCanonicalJewelleryConfig(effective)) {
    return { ...match, name: JEWELLERY_SHEET_NAME, config: canonical.config };
  }

  return { ...match, config: effective };
}

export function resolveJewelleryLayout(apiLayouts?: Layout[], template?: Template): Layout {
  if (!apiLayouts?.length) return JEWELLERY_LAYOUT;
  const forTemplate = template
    ? apiLayouts.filter((l) => l.templateId === template._id)
    : apiLayouts;
  const list = forTemplate.length ? forTemplate : apiLayouts;
  return list.find((l) => l.name.includes('Jewellery') || l.name.includes('Default')) ?? list[0];
}

export function effectiveJewelleryPageConfig(): PageConfig {
  return getEffectivePageConfig(JEWELLERY_SHEET_CONFIG);
}
