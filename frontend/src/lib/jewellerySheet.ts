import type { Template, Layout, LayoutConfig, PageConfig } from '../types';
import { getEffectivePageConfig } from '../types';
import { buildInterlockPageConfig } from './geometryBuilder';

/** Your predefined jewellery sticker sheet — 137×172 mm, 14 interlocking stickers */
export const JEWELLERY_SHEET_NAME = 'Jewellery Tag Sheet 14';

export const JEWELLERY_SHEET_CONFIG: PageConfig = buildInterlockPageConfig(137, 172, {
  stickerCount: 14,
  topMargin: 13,
  bottomMargin: 13,
  leftMargin: 5,
  rightMargin: 5,
  broadWidth: 62,
  broadHeight: 9,
  tailWidth: 61,
  tailHeight: 5,
  sectionA: { x: 0, y: 0, width: 31.1, height: 9 },
  sectionB: { x: 31.1, y: 0, width: 30.9, height: 9 },
  verticalPitch: 9,
});

export const JEWELLERY_LAYOUT_CONFIG: LayoutConfig = {
  fields: [
    {
      id: 'f1',
      type: 'categoryField',
      fieldKey: 'design_number',
      label: 'Design Number',
      section: 'A',
      x: 0.5,
      y: 0.3,
      width: 30,
      height: 4,
      fontSize: 7,
      bold: true,
      italic: false,
      alignment: 'left',
    },
    {
      id: 'f2',
      type: 'categoryField',
      fieldKey: 'weight',
      label: 'Weight',
      section: 'A',
      x: 0.5,
      y: 5,
      width: 30,
      height: 3.5,
      fontSize: 6,
      bold: false,
      italic: false,
      alignment: 'left',
    },
    {
      id: 'f3',
      type: 'categoryField',
      fieldKey: 'price',
      label: 'Price',
      section: 'B',
      x: 0.5,
      y: 0.3,
      width: 29.5,
      height: 4,
      fontSize: 7,
      bold: true,
      italic: false,
      alignment: 'center',
    },
    {
      id: 'f4',
      type: 'categoryField',
      fieldKey: 'purity',
      label: 'Purity',
      section: 'B',
      x: 0.5,
      y: 5,
      width: 29.5,
      height: 3.5,
      fontSize: 6,
      bold: false,
      italic: false,
      alignment: 'right',
    },
  ],
};

/** Built-in fallback when API has not loaded yet */
export const JEWELLERY_TEMPLATE: Template = {
  _id: 'builtin-jewellery-sheet',
  name: JEWELLERY_SHEET_NAME,
  description: '137×172 mm interlocking jewellery sheet — 14 stickers',
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

export function isJewellerySheetTemplate(template: Template): boolean {
  return (
    template.name === JEWELLERY_SHEET_NAME ||
    template.config.layoutType === 'jewellery-interlock' ||
    template.config.stickerCount === 14
  );
}

/** Always use your predefined sheet — pick matching API record or built-in */
export function resolveJewelleryTemplate(apiTemplates?: Template[]): Template {
  if (!apiTemplates?.length) {
    return { ...JEWELLERY_TEMPLATE, config: getEffectivePageConfig(JEWELLERY_SHEET_CONFIG) };
  }
  const match =
    apiTemplates.find((t) => t.name === JEWELLERY_SHEET_NAME) ??
    apiTemplates.find((t) => isJewellerySheetTemplate(t)) ??
    apiTemplates[0];
  return { ...match, config: getEffectivePageConfig(match.config) };
}

export function resolveJewelleryLayout(apiLayouts?: Layout[], template?: Template): Layout {
  if (!apiLayouts?.length) return JEWELLERY_LAYOUT;
  const forTemplate = template
    ? apiLayouts.filter((l) => l.templateId === template._id)
    : apiLayouts;
  const list = forTemplate.length ? forTemplate : apiLayouts;
  return list.find((l) => l.name.includes('Jewellery') || l.name.includes('Ring')) ?? list[0];
}

export function effectiveJewelleryPageConfig(): PageConfig {
  return getEffectivePageConfig(JEWELLERY_SHEET_CONFIG);
}
