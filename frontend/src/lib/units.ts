/** Millimeters to pixels at 96 DPI (screen preview scale) */
export const MM_TO_PX = 96 / 25.4;

/** Preview display scale — keeps large sheets visible on screen */
export const PREVIEW_SCALE = 2;

/** Print/preview: layout fontSize units → mm on sticker */
export const LABEL_FONT_MM_SCALE = 0.4;

export function mmToPx(mm: number, scale = PREVIEW_SCALE): number {
  return mm * MM_TO_PX * scale;
}

export function applyCalibration(
  value: number,
  offset: number,
  scalePercent: number
): number {
  return value * (scalePercent / 100) + offset;
}

export function getPageDimensionsPx(
  pageWidth: number,
  pageHeight: number,
  scale = PREVIEW_SCALE
) {
  return {
    width: mmToPx(pageWidth, scale),
    height: mmToPx(pageHeight, scale),
  };
}

export type RenderUnit = 'px' | 'mm';

export function formatLength(mm: number, unit: RenderUnit, scale = PREVIEW_SCALE): string {
  if (unit === 'mm') return `${mm}mm`;
  return `${mmToPx(mm, scale)}px`;
}

export function calibrateMm(
  mm: number,
  offset: number,
  scalePercent: number
): number {
  return applyCalibration(mm, offset, scalePercent);
}
