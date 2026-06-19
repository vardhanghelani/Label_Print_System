import { debugLogBackend } from './debugLog.js';

export function isPrintDebugEnabled(): boolean {
  return process.env.PRINT_DEBUG === 'true';
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

export function logPrintDebugBackend(
  source: string,
  pageWidth: number,
  pageHeight: number,
  rows: PrintDebugRow[]
): void {
  if (!isPrintDebugEnabled()) return;

  console.log(`[PRINT_DEBUG] ${source} — page ${pageWidth}×${pageHeight} mm, ${rows.length} items`);
  for (const row of rows) {
    console.log(
      `  Sticker ${row.stickerNumber} | Section ${row.section ?? '-'} | Field ${row.field} | Text "${row.text}" | X ${row.absoluteX.toFixed(2)} | Y ${row.absoluteY.toFixed(2)} | W ${row.width.toFixed(2)} | H ${row.height.toFixed(2)}`
    );
  }

  debugLogBackend(
    'printDebug.ts:log',
    'Print debug rows',
    { source, pageWidth, pageHeight, rows },
    'PRINT_DEBUG'
  );
}
