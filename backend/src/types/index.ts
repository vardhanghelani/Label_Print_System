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
  /** Key in product.values when type is categoryField */
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

export type { ProductValues, CategoryFieldDefinition, FieldDatatype } from './category.js';
export { slugifyFieldKey, formatFieldValue, buildSearchHaystack } from './category.js';
import type { ProductValues } from './category.js';
import { buildSearchHaystack } from './category.js';

/** @deprecated use ProductValues on Label */
export type LabelData = ProductValues;

export type PrintMode = 'single' | 'selected' | 'startFrom';

export interface CalibrationSettings {
  horizontalOffset: number;
  verticalOffset: number;
  scaleX: number;
  scaleY: number;
}

export interface PositionState {
  position: number;
  used: boolean;
}

export interface PrintJobPayload {
  templateId: string;
  layoutId: string;
  labelIds: string[];
  mode: PrintMode;
  selectedPositions: number[];
  startFromPosition?: number;
  usedPositions: number[];
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
  buildJewelleryStickers,
  DEFAULT_INTERLOCK_GEOMETRY,
  DEFAULT_INTERLOCK_PAGE,
  JEWELLERY_SPEC,
} from './geometryBuilder.js';

import {
  isInterlockTemplate,
  getStickerDefinition,
  resolveStickers,
} from './geometryBuilder.js';

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
    if (isAvailable(p)) {
      positions.push(p);
    }
  }
  return positions;
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

export function filterLabels<T extends { name: string; categoryId?: string; values?: ProductValues }>(
  search: string,
  labels: T[],
  searchableKeys: string[] = Object.keys(labels[0]?.values ?? {})
): T[] {
  const q = search.trim().toLowerCase();
  if (!q) return labels;
  return labels.filter((l) => {
    const haystack = buildSearchHaystack(l.name, undefined, l.values ?? {}, searchableKeys);
    return haystack.includes(q);
  });
}
