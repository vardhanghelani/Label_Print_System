import type { PageConfig, StickerDefinition, RectMm, LayoutType } from './index.js';

/** Section rect relative to broad printable area origin (mm) */
export interface SectionGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** All physical measurements for an interlocking jewellery sheet — no hardcoded runtime values */
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
  /** Distance between consecutive sticker tops; defaults to broadHeight (zero gap) */
  verticalPitch?: number;
}

/** Defaults used ONLY when creating a new template — never at render time */
export const DEFAULT_INTERLOCK_GEOMETRY: InterlockSheetGeometry = {
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
};

export const DEFAULT_INTERLOCK_PAGE = {
  pageWidth: 137,
  pageHeight: 172,
};

function rect(x: number, y: number, width: number, height: number): RectMm {
  return { x, y, width, height };
}

export function buildInterlockStickers(
  pageWidth: number,
  pageHeight: number,
  geometry: InterlockSheetGeometry
): StickerDefinition[] {
  const g = geometry;
  const pitch = g.verticalPitch ?? g.broadHeight;
  const tailYOffset = g.broadHeight - g.tailHeight;
  const stickers: StickerDefinition[] = [];

  for (let n = 1; n <= g.stickerCount; n++) {
    const y = g.topMargin + (n - 1) * pitch;
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
  geometry: InterlockSheetGeometry
): PageConfig {
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
    verticalPitch: geometry.verticalPitch ?? geometry.broadHeight,
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
    verticalPitch: config.geometry.verticalPitch ?? config.geometry.broadHeight,
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

/** @deprecated use isInterlockTemplate */
export const isJewelleryTemplate = isInterlockTemplate;

export function getStickerDefinition(
  config: PageConfig,
  position: number
): StickerDefinition | undefined {
  const stickers = resolveStickers(config);
  return stickers.find((st) => st.stickerNumber === position);
}

export function resolveStickers(config: PageConfig): StickerDefinition[] {
  if (config.stickers?.length) return config.stickers;
  if (config.geometry) {
    return buildInterlockStickers(config.pageWidth, config.pageHeight, config.geometry);
  }
  return [];
}

export function getEffectivePageConfig(config: PageConfig): PageConfig {
  if (isInterlockTemplate(config) && config.geometry) {
    return regenerateInterlockConfig(config);
  }
  return config;
}

export function createDefaultInterlockTemplate(name: string, description?: string) {
  const config = buildInterlockPageConfig(
    DEFAULT_INTERLOCK_PAGE.pageWidth,
    DEFAULT_INTERLOCK_PAGE.pageHeight,
    { ...DEFAULT_INTERLOCK_GEOMETRY }
  );
  return { name, description, config };
}

/** Legacy alias */
export function buildJewelleryPageConfig(overrides: Partial<InterlockSheetGeometry & typeof DEFAULT_INTERLOCK_PAGE> = {}) {
  const { pageWidth = DEFAULT_INTERLOCK_PAGE.pageWidth, pageHeight = DEFAULT_INTERLOCK_PAGE.pageHeight, ...geoOverrides } = overrides;
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
  topMarginNarrow: DEFAULT_INTERLOCK_GEOMETRY.topMargin,
  bottomMarginNarrow: DEFAULT_INTERLOCK_GEOMETRY.bottomMargin,
  topMarginBroad: 5,
};

export const buildJewelleryStickers = (overrides: Partial<InterlockSheetGeometry & typeof DEFAULT_INTERLOCK_PAGE> = {}) => {
  const config = buildJewelleryPageConfig(overrides);
  return config.stickers ?? [];
};
