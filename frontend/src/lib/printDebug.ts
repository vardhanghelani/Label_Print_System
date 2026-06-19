import type { PrintTextItem } from './labelRenderPipeline';

export function isPrintDebugEnabled(): boolean {
  return (
    typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: { VITE_PRINT_DEBUG?: string } }).env?.VITE_PRINT_DEBUG ===
      'true'
  );
}

export interface PrintDebugRow {
  stickerNumber: number;
  section: string | undefined;
  field: string;
  text: string;
  absoluteX: number;
  absoluteY: number;
  width: number;
  height: number;
}

export function toPrintDebugRows(items: PrintTextItem[]): PrintDebugRow[] {
  return items.map((item) => ({
    stickerNumber: item.stickerNumber,
    section: item.section,
    field: item.field.label ?? item.fieldId,
    text: item.text,
    absoluteX: item.calibratedRect.x,
    absoluteY: item.calibratedRect.y,
    width: item.calibratedRect.width,
    height: item.calibratedRect.height,
  }));
}

export function logPrintDebug(
  source: string,
  pageWidth: number,
  pageHeight: number,
  items: PrintTextItem[]
): void {
  if (!isPrintDebugEnabled()) return;

  const rows = toPrintDebugRows(items);
  console.group(`[PRINT_DEBUG] ${source}`);
  console.log('pageWidth:', pageWidth, 'pageHeight:', pageHeight);
  for (const row of rows) {
    console.log(
      `Sticker ${row.stickerNumber} | Section ${row.section ?? '-'} | Field ${row.field} | Text "${row.text}" | X ${row.absoluteX.toFixed(2)} | Y ${row.absoluteY.toFixed(2)} | W ${row.width.toFixed(2)} | H ${row.height.toFixed(2)}`
    );
  }
  console.table(rows);
  console.groupEnd();
}

export function logPdfRenderDiagnostics(
  pageWidth: number,
  pageHeight: number,
  items: PrintTextItem[]
): void {
  console.group('[PDF Export] Render diagnostics');
  console.log('pageWidth:', pageWidth, 'pageHeight:', pageHeight);
  for (const item of items) {
    console.log({
      pageWidth,
      pageHeight,
      stickerNumber: item.stickerNumber,
      fieldName: item.field.label ?? item.fieldId,
      fieldValue: item.text,
      finalX: item.calibratedRect.x,
      finalY: item.calibratedRect.y,
    });
  }
  console.groupEnd();
}
