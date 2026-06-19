import type { InterlockSheetGeometry } from './geometryBuilder';
import { buildInterlockPageConfig, interlockBroadTopY, interlockTailYOffset } from './geometryBuilder';

export { interlockBroadTopY, interlockTailYOffset };

/** Client spec: 110×197 mm sheet, 22 interlocking stickers, single column */
export const JEWELLERY_SHEET_NAME = 'Jewellery Tag Sheet 22';

export const JEWELLERY_PAGE = { pageWidth: 110, pageHeight: 197 };

export const JEWELLERY_INTERLOCK_GEOMETRY: InterlockSheetGeometry = {
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

export function buildJewellerySheetPageConfig() {
  return buildInterlockPageConfig(
    JEWELLERY_PAGE.pageWidth,
    JEWELLERY_PAGE.pageHeight,
    JEWELLERY_INTERLOCK_GEOMETRY
  );
}
