export type LayoutType = 'grid' | 'jewellery-interlock';

export type StickerOrientation = 'broad-left' | 'broad-right';

export interface RectMm {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SectionGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface InterlockSheetGeometry {
  stickerCount: number;
  topMargin: number;
  bottomMargin: number;
  leftMargin: number;
  rightMargin: number;
  broadWidth: number;
  broadHeight: number;
  tailWidth: number;
  tailHeight: number;
  sectionA: SectionGeometry;
  sectionB: SectionGeometry;
  verticalPitch?: number;
}

export interface StickerDefinition {
  stickerNumber: number;
  orientation: StickerOrientation;
  x: number;
  y: number;
  width: number;
  height: number;
  broadArea: RectMm;
  tailArea: RectMm;
  sectionA: RectMm;
  sectionB: RectMm;
  printableArea: RectMm;
}

export interface PageConfig {
  layoutType?: LayoutType;
  pageWidth: number;
  pageHeight: number;
  rows: number;
  columns: number;
  stickerWidth: number;
  stickerHeight: number;
  horizontalGap: number;
  verticalGap: number;
  topMargin: number;
  bottomMargin: number;
  leftMargin: number;
  rightMargin: number;
  printableAreaWidth: number;
  printableAreaHeight: number;
  stickerCount?: number;
  verticalPitch?: number;
  geometry?: InterlockSheetGeometry;
  stickers?: StickerDefinition[];
}

export type LayoutFieldType = 'categoryField' | 'text' | 'staticBranding' | 'logo';

export type TextAlignment = 'left' | 'center' | 'right';

export type LayoutSection = 'A' | 'B' | 'full';

export interface LayoutField {
  id: string;
  type: LayoutFieldType;
  label: string;
  fieldKey?: string;
  categoryId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  alignment: TextAlignment;
  section?: LayoutSection;
  rotation?: number;
  lineSpacing?: number;
  staticText?: string;
  logoUrl?: string;
}

export interface LayoutConfig {
  fields: LayoutField[];
  categoryId?: string;
}

export type { ProductValues, Category, CategoryFieldDefinition, FieldDatatype } from '../lib/category';
export {
  slugifyFieldKey,
  formatFieldValue,
  buildSearchHaystack,
  productSummaryLine,
  DATATYPE_LABELS,
} from '../lib/category';
import type { ProductValues } from '../lib/category';
import { buildSearchHaystack } from '../lib/category';

/** Print payload — dynamic field values */
export type LabelData = ProductValues;

export type PrintMode = 'single' | 'selected' | 'startFrom';

export interface CalibrationSettings {
  horizontalOffset: number;
  verticalOffset: number;
  scaleX: number;
  scaleY: number;
}

export interface ShopSettings {
  brandName: string;
  logoUrl?: string;
  defaultTemplateId?: string;
  defaultLayoutId?: string;
  defaultSheetBehavior?: 'newSheet' | 'continueSheet';
}

export interface Template {
  _id: string;
  name: string;
  description?: string;
  config: PageConfig;
  createdAt: string;
  updatedAt: string;
}

export interface Layout {
  _id: string;
  name: string;
  templateId: string;
  config: LayoutConfig;
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  _id: string;
  name: string;
  categoryId: string;
  values: ProductValues;
  createdAt: string;
  updatedAt: string;
}

export interface PrintJob {
  _id: string;
  templateId: string;
  layoutId: string;
  labelIds: string[];
  mode: PrintMode;
  selectedPositions: number[];
  startFromPosition?: number;
  usedPositions: number[];
  printPositions: number[];
  status: 'draft' | 'previewed' | 'printed' | 'exported';
  createdAt: string;
  updatedAt: string;
}

export interface PreviewData {
  template: Template;
  layout: Layout;
  calibration: CalibrationSettings;
  printPositions: number[];
  positionLabelMap: Array<{ position: number; label: Label | null }>;
  usedPositions: number[];
  mode: PrintMode;
}

export const FIELD_TYPE_LABELS: Record<LayoutFieldType, string> = {
  categoryField: 'Category Field',
  text: 'Text',
  staticBranding: 'Static Branding',
  logo: 'Logo',
};

export const DEFAULT_CALIBRATION: CalibrationSettings = {
  horizontalOffset: 0,
  verticalOffset: 0,
  scaleX: 100,
  scaleY: 100,
};

export {
  buildInterlockStickers,
  buildInterlockPageConfig,
  regenerateInterlockConfig,
  isInterlockTemplate,
  isJewelleryTemplate,
  getStickerDefinition,
  resolveStickers,
  getEffectivePageConfig,
  buildJewelleryPageConfig,
  DEFAULT_INTERLOCK_GEOMETRY,
  DEFAULT_INTERLOCK_PAGE,
  JEWELLERY_SPEC,
} from '../lib/geometryBuilder';

import {
  isInterlockTemplate,
  getStickerDefinition,
  resolveStickers,
} from '../lib/geometryBuilder';

export const DEFAULT_PAGE_CONFIG: PageConfig = {
  pageWidth: 210,
  pageHeight: 297,
  rows: 6,
  columns: 4,
  stickerWidth: 45,
  stickerHeight: 25,
  horizontalGap: 3,
  verticalGap: 2,
  topMargin: 10,
  bottomMargin: 10,
  leftMargin: 8,
  rightMargin: 8,
  printableAreaWidth: 194,
  printableAreaHeight: 277,
};

export function getTotalPositions(config: PageConfig): number {
  if (isInterlockTemplate(config)) {
    return resolveStickers(config).length || config.stickerCount || 0;
  }
  return config.rows * config.columns;
}

export function getPositionCoordinates(
  position: number,
  config: PageConfig
): { x: number; y: number } {
  const sticker = getStickerDefinition(config, position);
  if (sticker) {
    return { x: sticker.printableArea.x, y: sticker.printableArea.y };
  }

  const index = position - 1;
  const row = Math.floor(index / config.columns);
  const col = index % config.columns;

  const x = config.leftMargin + col * (config.stickerWidth + config.horizontalGap);
  const y = config.topMargin + row * (config.stickerHeight + config.verticalGap);

  return { x, y };
}

export function getFieldAbsoluteRect(
  field: LayoutField,
  sticker: StickerDefinition
): RectMm {
  const section = field.section ?? 'full';
  let base: RectMm;
  if (section === 'A') base = sticker.sectionA;
  else if (section === 'B') base = sticker.sectionB;
  else base = sticker.printableArea;

  return {
    x: base.x + field.x,
    y: base.y + field.y,
    width: field.width,
    height: field.height,
  };
}

export function resolveFieldValue(field: LayoutField, values: ProductValues): string {
  if (field.type === 'text' || field.type === 'staticBranding') {
    return field.staticText ?? '';
  }
  if (field.type === 'logo') {
    return field.logoUrl ?? '';
  }
  if (field.type === 'categoryField' && field.fieldKey) {
    const v = values[field.fieldKey];
    return v === null || v === undefined ? '' : String(v);
  }
  return '';
}

export function computePrintPositions(
  mode: PrintMode,
  labelCount: number,
  config: PageConfig,
  options: {
    selectedPositions?: number[];
    startFromPosition?: number;
    usedPositions?: number[];
  }
): number[] {
  const total = getTotalPositions(config);
  const used = new Set(options.usedPositions ?? []);

  const isAvailable = (pos: number) => !used.has(pos);

  if (mode === 'single') {
    const pos = options.selectedPositions?.[0];
    return pos && isAvailable(pos) ? [pos] : [];
  }

  if (mode === 'selected') {
    return (options.selectedPositions ?? [])
      .filter((p) => p >= 1 && p <= total && isAvailable(p))
      .slice(0, labelCount);
  }

  const start = options.startFromPosition ?? 1;
  const positions: number[] = [];
  for (let p = start; p <= total && positions.length < labelCount; p++) {
    if (isAvailable(p)) positions.push(p);
  }
  return positions;
}

export function countAvailableStickers(
  config: PageConfig,
  usedPositions: number[]
): number {
  const used = new Set(usedPositions);
  const total = getTotalPositions(config);
  let count = 0;
  for (let p = 1; p <= total; p++) {
    if (!used.has(p)) count++;
  }
  return count;
}

export function findFirstAvailablePosition(
  config: PageConfig,
  usedPositions: number[]
): number {
  const used = new Set(usedPositions);
  const total = getTotalPositions(config);
  for (let p = 1; p <= total; p++) {
    if (!used.has(p)) return p;
  }
  return 1;
}

export function filterLabels(
  search: string,
  labels: Label[],
  searchableKeys?: string[]
): Label[] {
  const q = search.trim().toLowerCase();
  if (!q) return labels;
  const keys =
    searchableKeys ??
    [...new Set(labels.flatMap((l) => Object.keys(l.values ?? {})))];
  return labels.filter((l) => {
    const haystack = buildSearchHaystack(l.name, undefined, l.values ?? {}, keys);
    return haystack.includes(q);
  });
}
