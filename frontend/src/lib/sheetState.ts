const SHEET_STATE_KEY = 'label-print-sheet-state';

export interface SheetState {
  templateId: string;
  usedPositions: number[];
  updatedAt: string;
}

export function loadSheetState(templateId: string): number[] {
  try {
    const raw = localStorage.getItem(SHEET_STATE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as SheetState[];
    return all.find((s) => s.templateId === templateId)?.usedPositions ?? [];
  } catch {
    return [];
  }
}

export function saveSheetState(templateId: string, usedPositions: number[]): void {
  try {
    const raw = localStorage.getItem(SHEET_STATE_KEY);
    const all: SheetState[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((s) => s.templateId === templateId);
    const entry: SheetState = {
      templateId,
      usedPositions: [...usedPositions].sort((a, b) => a - b),
      updatedAt: new Date().toISOString(),
    };
    if (idx >= 0) all[idx] = entry;
    else all.push(entry);
    localStorage.setItem(SHEET_STATE_KEY, JSON.stringify(all));
  } catch {
    /* ignore storage errors */
  }
}

export function clearSheetState(templateId: string): void {
  try {
    const raw = localStorage.getItem(SHEET_STATE_KEY);
    if (!raw) return;
    const all = (JSON.parse(raw) as SheetState[]).filter((s) => s.templateId !== templateId);
    localStorage.setItem(SHEET_STATE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function mergeUsedAfterPrint(
  existingUsed: number[],
  printedPositions: number[]
): number[] {
  return [...new Set([...existingUsed, ...printedPositions])].sort((a, b) => a - b);
}
