import type { InterlockSheetGeometry, StickerDefinition } from '../types';
import { buildInterlockStickers } from './geometryBuilder';

export interface GeometryValidationIssue {
  code: string;
  message: string;
  stickerNumber?: number;
}

export interface GeometryValidationResult {
  valid: boolean;
  issues: GeometryValidationIssue[];
  stickers: StickerDefinition[];
}

function rectBottom(rect: { y: number; height: number }): number {
  return rect.y + rect.height;
}

function rectRight(rect: { x: number; width: number }): number {
  return rect.x + rect.width;
}

function rectsOverlap(a: { x: number; y: number; width: number; height: number }, b: typeof a): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Validate interlock sheet geometry — throws nothing; returns structured issues */
export function validateInterlockGeometry(
  pageWidth: number,
  pageHeight: number,
  geometry: InterlockSheetGeometry
): GeometryValidationResult {
  const issues: GeometryValidationIssue[] = [];
  const stickers = buildInterlockStickers(pageWidth, pageHeight, geometry);

  if (geometry.stickerCount <= 0) {
    issues.push({ code: 'INVALID_COUNT', message: 'Sticker count must be greater than 0.' });
  }

  for (const sticker of stickers) {
    const n = sticker.stickerNumber;
    const regions = [
      { name: 'broadArea', rect: sticker.broadArea },
      { name: 'sectionA', rect: sticker.sectionA },
      { name: 'sectionB', rect: sticker.sectionB },
    ];

    for (const { name, rect } of regions) {
      if (rect.x < 0 || rect.y < 0) {
        issues.push({
          code: 'NEGATIVE_COORD',
          message: `Sticker ${n} ${name} has negative coordinates (x=${rect.x}, y=${rect.y}).`,
          stickerNumber: n,
        });
      }
      const bottom = rectBottom(rect);
      const right = rectRight(rect);
      if (bottom > pageHeight) {
        issues.push({
          code: 'EXCEEDS_PAGE_HEIGHT',
          message: `Sticker ${n} ${name} exceeds page height by ${(bottom - pageHeight).toFixed(1)} mm (bottom=${bottom.toFixed(1)}, page=${pageHeight}).`,
          stickerNumber: n,
        });
      }
      if (right > pageWidth) {
        issues.push({
          code: 'EXCEEDS_PAGE_WIDTH',
          message: `Sticker ${n} ${name} exceeds page width by ${(right - pageWidth).toFixed(1)} mm.`,
          stickerNumber: n,
        });
      }
    }

    const tail = sticker.tailArea;
    const broad = sticker.broadArea;
    const tailCenterY = tail.y + tail.height / 2;
    const broadCenterY = broad.y + broad.height / 2;
    const tailAttached =
      Math.abs(tailCenterY - broadCenterY) <= geometry.broadHeight / 2 + 0.01;
    if (!tailAttached) {
      issues.push({
        code: 'TAIL_DETACHED',
        message: `Sticker ${n} tail is not vertically aligned with broad area.`,
        stickerNumber: n,
      });
    }

    if (
      (sticker.orientation === 'broad-left' && tail.x < broad.x + broad.width - 0.01) ||
      (sticker.orientation === 'broad-right' && tail.x + tail.width > broad.x + 0.01)
    ) {
      issues.push({
        code: 'TAIL_POSITION',
        message: `Sticker ${n} tail is not attached horizontally to broad area.`,
        stickerNumber: n,
      });
    }
  }

  const leftSections = stickers.map((s) => s.sectionA);
  const rightSections = stickers.map((s) => s.sectionB);
  for (const group of [leftSections, rightSections]) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (rectsOverlap(group[i], group[j])) {
          issues.push({
            code: 'PRINTABLE_OVERLAP',
            message: `Printable sections overlap on the same side (stickers ${i + 1} and ${j + 1}).`,
          });
        }
      }
    }
  }

  return { valid: issues.length === 0, issues, stickers };
}

export function assertValidInterlockGeometry(
  pageWidth: number,
  pageHeight: number,
  geometry: InterlockSheetGeometry
): StickerDefinition[] {
  const result = validateInterlockGeometry(pageWidth, pageHeight, geometry);
  if (!result.valid) {
    throw new Error(result.issues.map((i) => i.message).join(' '));
  }
  return result.stickers;
}
