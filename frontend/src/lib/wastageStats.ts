import type { PrintJob, PageConfig } from '../types';
import { getTotalPositions } from '../types';

export interface WastageStats {
  labelsPrinting: number;
  sheetUsed: number;
  sheetRemaining: number;
  sheetTotal: number;
  stickersSavedThisMonth: number;
  labelsPrintedThisMonth: number;
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function computeMonthlyStats(history: PrintJob[]): {
  stickersSavedThisMonth: number;
  labelsPrintedThisMonth: number;
} {
  let stickersSavedThisMonth = 0;
  let labelsPrintedThisMonth = 0;

  for (const job of history) {
    if (!isThisMonth(job.createdAt)) continue;
    labelsPrintedThisMonth += job.printPositions.length;
    const start = job.printPositions[0];
    if (start && start > 1) {
      stickersSavedThisMonth += start - 1;
    }
  }

  return { stickersSavedThisMonth, labelsPrintedThisMonth };
}

export function computeSheetUsage(
  config: PageConfig,
  usedPositions: number[],
  printPositions: number[]
): { used: number; remaining: number; total: number } {
  const total = getTotalPositions(config);
  const occupied = new Set([...usedPositions, ...printPositions]);
  const used = occupied.size;
  return { used, remaining: total - used, total };
}

export function buildWastageStats(
  config: PageConfig,
  usedPositions: number[],
  printPositions: number[],
  history: PrintJob[]
): WastageStats {
  const sheet = computeSheetUsage(config, usedPositions, printPositions);
  const monthly = computeMonthlyStats(history);

  return {
    labelsPrinting: printPositions.length,
    sheetUsed: sheet.used,
    sheetRemaining: sheet.remaining,
    sheetTotal: sheet.total,
    stickersSavedThisMonth: monthly.stickersSavedThisMonth,
    labelsPrintedThisMonth: monthly.labelsPrintedThisMonth,
  };
}
