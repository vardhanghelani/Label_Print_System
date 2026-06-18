import { create } from 'zustand';
import type { CalibrationSettings, PreviewData } from '../types';
import { DEFAULT_CALIBRATION, findFirstAvailablePosition } from '../types';
import { loadSheetState, saveSheetState, mergeUsedAfterPrint } from '../lib/sheetState';
import { calibrationEquals } from '../lib/calibration';
import type { PageConfig } from '../types';

export type PrintScreen = 'home' | 'quickPrint' | 'previousPrints' | 'success';
export type QuickStep = 1 | 2;
export type SheetIntent = 'new' | 'continue' | null;

export interface SuccessInfo {
  labelCount: number;
  startPosition: number;
  endPosition: number;
  positions: number[];
  isDemo?: boolean;
}

interface PrintState {
  templateId: string | null;
  layoutId: string | null;
  selectedLabelIds: string[];
  startFromPosition: number;
  usedPositions: number[];
  previewData: PreviewData | null;
  calibration: CalibrationSettings;
  screen: PrintScreen;
  quickStep: QuickStep;
  sheetIntent: SheetIntent;
  successInfo: SuccessInfo | null;
  productSearch: string;
  isDemoMode: boolean;

  setTemplateId: (id: string | null) => void;
  setLayoutId: (id: string | null) => void;
  toggleLabel: (id: string) => void;
  setSelectedLabels: (ids: string[]) => void;
  setStartFromPosition: (pos: number) => void;
  toggleUsedPosition: (pos: number) => void;
  setUsedPositions: (positions: number[]) => void;
  setPreviewData: (data: PreviewData | null) => void;
  setCalibration: (calibration: CalibrationSettings) => void;
  setScreen: (screen: PrintScreen) => void;
  setQuickStep: (step: QuickStep) => void;
  setSheetIntent: (intent: SheetIntent) => void;
  setSuccessInfo: (info: SuccessInfo | null) => void;
  setProductSearch: (search: string) => void;
  startQuickPrint: (labelIds?: string[]) => void;
  startDemoPrint: () => void;
  startContinueSheet: (templateId?: string, pageConfig?: PageConfig) => void;
  persistSheetAfterPrint: (templateId: string, printedPositions: number[]) => void;
  reprintJob: (job: {
    templateId: string;
    layoutId: string;
    labelIds: string[];
    startFromPosition?: number;
    usedPositions: number[];
    printPositions: number[];
  }) => void;
  exitDemoMode: () => void;
  loadFromHistory: (job: {
    templateId: string;
    layoutId: string;
    labelIds: string[];
    startFromPosition?: number;
    usedPositions: number[];
    printPositions: number[];
  }) => void;
  goHome: () => void;
  reset: () => void;
}

const baseState = {
  templateId: null as string | null,
  layoutId: null as string | null,
  selectedLabelIds: [] as string[],
  startFromPosition: 1,
  usedPositions: [] as number[],
  previewData: null as PreviewData | null,
  calibration: { ...DEFAULT_CALIBRATION },
  screen: 'home' as PrintScreen,
  quickStep: 1 as QuickStep,
  sheetIntent: null as SheetIntent,
  successInfo: null as SuccessInfo | null,
  productSearch: '',
  isDemoMode: false,
};

export const usePrintStore = create<PrintState>((set, get) => ({
  ...baseState,

  setTemplateId: (id) => set({ templateId: id, layoutId: null }),
  setLayoutId: (id) => set({ layoutId: id }),
  setScreen: (screen) => set({ screen }),
  setQuickStep: (step) => set({ quickStep: step }),
  setSheetIntent: (intent) => set({ sheetIntent: intent }),
  setSuccessInfo: (info) => set({ successInfo: info }),
  setProductSearch: (search) => set({ productSearch: search }),

  toggleLabel: (id) => {
    const current = get().selectedLabelIds;
    set({
      selectedLabelIds: current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
    });
  },

  setSelectedLabels: (ids) => set({ selectedLabelIds: ids }),
  setStartFromPosition: (pos) => set({ startFromPosition: pos }),

  toggleUsedPosition: (pos) => {
    const used = get().usedPositions;
    set({
      usedPositions: used.includes(pos)
        ? used.filter((p) => p !== pos)
        : [...used, pos].sort((a, b) => a - b),
    });
  },

  setUsedPositions: (positions) => set({ usedPositions: positions }),
  setPreviewData: (data) => set({ previewData: data }),
  setCalibration: (calibration) =>
    set((state) =>
      calibrationEquals(state.calibration, calibration) ? state : { calibration }
    ),

  startQuickPrint: (labelIds) =>
    set({
      isDemoMode: false,
      screen: 'quickPrint',
      quickStep: 1,
      sheetIntent: null,
      successInfo: null,
      previewData: null,
      productSearch: '',
      selectedLabelIds: labelIds ?? [],
    }),

  startNewSheet: () =>
    set({
      usedPositions: [],
      startFromPosition: 1,
      sheetIntent: 'new',
      quickStep: 2,
      screen: 'quickPrint',
    }),

  startContinueSheet: (templateId, pageConfig) => {
    const tid = templateId ?? get().templateId;
    const used = tid ? loadSheetState(tid) : [];
    const start = pageConfig
      ? findFirstAvailablePosition(pageConfig, used)
      : used.length
        ? Math.max(...used) + 1
        : 1;
    set({
      sheetIntent: 'continue',
      quickStep: 2,
      screen: 'quickPrint',
      usedPositions: used,
      startFromPosition: start,
    });
  },

  persistSheetAfterPrint: (templateId, printedPositions) => {
    const merged = mergeUsedAfterPrint(get().usedPositions, printedPositions);
    set({ usedPositions: merged });
    saveSheetState(templateId, merged);
  },

  reprintJob: (job) =>
    set({
      isDemoMode: false,
      templateId: job.templateId,
      layoutId: job.layoutId,
      selectedLabelIds: job.labelIds,
      startFromPosition: job.startFromPosition ?? job.printPositions[0] ?? 1,
      usedPositions: job.usedPositions,
      screen: 'quickPrint',
      quickStep: 2,
      sheetIntent: 'continue',
      previewData: null,
      successInfo: null,
    }),

  startDemoPrint: () =>
    set({
      isDemoMode: true,
      screen: 'quickPrint',
      quickStep: 2,
      sheetIntent: 'continue',
      successInfo: null,
      productSearch: '',
      selectedLabelIds: ['demo-1', 'demo-2', 'demo-3', 'demo-4'],
      usedPositions: [1, 2, 3, 4, 5, 6, 7, 8],
      startFromPosition: 9,
      previewData: null,
    }),

  exitDemoMode: () => set({ isDemoMode: false }),

  loadFromHistory: (job) => get().reprintJob(job),

  goHome: () =>
    set({
      isDemoMode: false,
      screen: 'home',
      quickStep: 1,
      sheetIntent: null,
      successInfo: null,
      previewData: null,
      productSearch: '',
      selectedLabelIds: [],
    }),

  reset: () =>
    set({
      ...baseState,
      calibration: get().calibration,
      templateId: get().templateId,
      layoutId: get().layoutId,
    }),
}));
