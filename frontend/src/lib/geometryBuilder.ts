import type { PageConfig, StickerDefinition, RectMm } from '../types';
import { validateInterlockGeometry } from './geometryValidator';

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

/** 11 pairs × 16.5 mm + 14 mm last broad = 193 mm; top 4 mm → bottom exactly 197 mm */
export const DEFAULT_INTERLOCK_GEOMETRY: InterlockSheetGeometry = {
  stickerCount: 22,
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
};

export const DEFAULT_INTERLOCK_PAGE = { pageWidth: 110, pageHeight: 197 };

/** Broad-area top Y — odd rows start pair; even rows interlock (last even uses tail offset to fit page) */
export function interlockBroadTopY(stickerNumber: number, g: InterlockSheetGeometry): number {
  const pairHeight = g.broadHeight + g.tailHeight;
  const pairIndex = Math.floor((stickerNumber - 1) / 2);
  const pairTop = g.topMargin + pairIndex * pairHeight;

  if (stickerNumber % 2 === 1) {
    return pairTop;
  }
  return pairTop + g.broadHeight;
}

export function interlockTailYOffset(g: InterlockSheetGeometry): number {
  return (g.broadHeight - g.tailHeight) / 2;
}

function rect(x: number, y: number, width: number, height: number): RectMm {
  return { x, y, width, height };
}

export function buildInterlockStickers(
  _pageWidth: number,
  _pageHeight: number,
  geometry: InterlockSheetGeometry
): StickerDefinition[] {
  const g = geometry;
  const tailYOffset = interlockTailYOffset(g);
  const stickers: StickerDefinition[] = [];

  for (let n = 1; n <= g.stickerCount; n++) {
    const y = interlockBroadTopY(n, g);
    const odd = n % 2 === 1;

    if (odd) {
      const broadX = g.leftMargin;
      const tailX = broadX + g.broadWidth;
      const broadArea = rect(broadX, y, g.broadWidth, g.broadHeight);
      stickers.push({
        stickerNumber: n,
        orientation: 'broad-left',
        x: g.leftMargin,
        y,
        width: g.broadWidth + g.tailWidth,
        height: g.broadHeight,
        broadArea,
        tailArea: rect(tailX, y + tailYOffset, g.tailWidth, g.tailHeight),
        sectionA: rect(broadX + g.sectionA.x, y + g.sectionA.y, g.sectionA.width, g.sectionA.height),
        sectionB: rect(broadX + g.sectionB.x, y + g.sectionB.y, g.sectionB.width, g.sectionB.height),
        printableArea: broadArea,
      });
    } else {
      const tailX = g.leftMargin;
      const broadX = g.leftMargin + g.tailWidth;
      const broadArea = rect(broadX, y, g.broadWidth, g.broadHeight);
      stickers.push({
        stickerNumber: n,
        orientation: 'broad-right',
        x: g.leftMargin,
        y,
        width: g.broadWidth + g.tailWidth,
        height: g.broadHeight,
        tailArea: rect(tailX, y + tailYOffset, g.tailWidth, g.tailHeight),
        broadArea,
        sectionA: rect(broadX + g.sectionA.x, y + g.sectionA.y, g.sectionA.width, g.sectionA.height),
        sectionB: rect(broadX + g.sectionB.x, y + g.sectionB.y, g.sectionB.width, g.sectionB.height),
        printableArea: broadArea,
      });
    }
  }

  return stickers;
}

export function buildInterlockPageConfig(
  pageWidth: number,
  pageHeight: number,
  geometry: InterlockSheetGeometry,
  options?: { skipValidation?: boolean }
): PageConfig {
  if (!options?.skipValidation) {
    const validation = validateInterlockGeometry(pageWidth, pageHeight, geometry);
    if (!validation.valid) {
      throw new Error(validation.issues.map((i) => i.message).join(' '));
    }
  }
  const stickers = buildInterlockStickers(pageWidth, pageHeight, geometry);
  return {
    layoutType: 'jewellery-interlock',
    pageWidth,
    pageHeight,
    rows: 1,
    columns: geometry.stickerCount,
    stickerWidth: geometry.broadWidth,
    stickerHeight: geometry.broadHeight,
    horizontalGap: 0,
    verticalGap: 0,
    topMargin: geometry.topMargin,
    bottomMargin: geometry.bottomMargin,
    leftMargin: geometry.leftMargin,
    rightMargin: geometry.rightMargin,
    printableAreaWidth: pageWidth - geometry.leftMargin - geometry.rightMargin,
    printableAreaHeight: pageHeight - geometry.topMargin - geometry.bottomMargin,
    stickerCount: geometry.stickerCount,
    verticalPitch: geometry.broadHeight + geometry.tailHeight,
    geometry,
    stickers,
  };
}

export function regenerateInterlockConfig(config: PageConfig): PageConfig {
  if (!config.geometry) return config;
  const stickers = buildInterlockStickers(config.pageWidth, config.pageHeight, config.geometry);
  return {
    ...config,
    layoutType: 'jewellery-interlock',
    stickerCount: config.geometry.stickerCount,
    verticalPitch: config.geometry.broadHeight + config.geometry.tailHeight,
    stickerWidth: config.geometry.broadWidth,
    stickerHeight: config.geometry.broadHeight,
    topMargin: config.geometry.topMargin,
    bottomMargin: config.geometry.bottomMargin,
    leftMargin: config.geometry.leftMargin,
    rightMargin: config.geometry.rightMargin,
    printableAreaWidth: config.pageWidth - config.geometry.leftMargin - config.geometry.rightMargin,
    printableAreaHeight: config.pageHeight - config.geometry.topMargin - config.geometry.bottomMargin,
    stickers,
  };
}

export function isInterlockTemplate(config: PageConfig): boolean {
  return config.layoutType === 'jewellery-interlock' && (!!config.stickers?.length || !!config.geometry);
}

export const isJewelleryTemplate = isInterlockTemplate;

export function resolveStickers(config: PageConfig): StickerDefinition[] {
  if (config.geometry) {
    return buildInterlockStickers(config.pageWidth, config.pageHeight, config.geometry);
  }
  if (config.stickers?.length) return config.stickers;
  return [];
}

const effectiveConfigCache = new Map<string, PageConfig>();

function effectiveConfigCacheKey(config: PageConfig): string {
  if (!config.geometry) {
    return `grid:${config.pageWidth}:${config.pageHeight}:${config.rows}:${config.columns}:${config.stickerWidth}:${config.stickerHeight}`;
  }
  return `jewellery:${config.pageWidth}:${config.pageHeight}:${JSON.stringify(config.geometry)}`;
}

export function getEffectivePageConfig(config: PageConfig): PageConfig {
  if (!isInterlockTemplate(config) || !config.geometry) return config;
  const key = effectiveConfigCacheKey(config);
  const cached = effectiveConfigCache.get(key);
  if (cached) return cached;
  const result = regenerateInterlockConfig(config);
  effectiveConfigCache.set(key, result);
  if (effectiveConfigCache.size > 64) {
    const oldest = effectiveConfigCache.keys().next().value;
    if (oldest) effectiveConfigCache.delete(oldest);
  }
  return result;
}

export function getStickerDefinition(config: PageConfig, position: number): StickerDefinition | undefined {
  return resolveStickers(config).find((st) => st.stickerNumber === position);
}

export function buildJewelleryPageConfig(
  overrides: Partial<InterlockSheetGeometry & typeof DEFAULT_INTERLOCK_PAGE> = {}
) {
  const {
    pageWidth = DEFAULT_INTERLOCK_PAGE.pageWidth,
    pageHeight = DEFAULT_INTERLOCK_PAGE.pageHeight,
    ...geoOverrides
  } = overrides;
  const geometry: InterlockSheetGeometry = {
    ...DEFAULT_INTERLOCK_GEOMETRY,
    ...geoOverrides,
    sectionA: { ...DEFAULT_INTERLOCK_GEOMETRY.sectionA, ...(geoOverrides as Partial<InterlockSheetGeometry>).sectionA },
    sectionB: { ...DEFAULT_INTERLOCK_GEOMETRY.sectionB, ...(geoOverrides as Partial<InterlockSheetGeometry>).sectionB },
  };
  return buildInterlockPageConfig(pageWidth, pageHeight, geometry);
}

export const JEWELLERY_SPEC = {
  ...DEFAULT_INTERLOCK_PAGE,
  ...DEFAULT_INTERLOCK_GEOMETRY,
  sectionAWidth: DEFAULT_INTERLOCK_GEOMETRY.sectionA.width,
  sectionBWidth: DEFAULT_INTERLOCK_GEOMETRY.sectionB.width,
};

export const buildJewelleryStickers = buildInterlockStickers;
