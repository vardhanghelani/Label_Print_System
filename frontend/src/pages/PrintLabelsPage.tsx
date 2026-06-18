import { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight,
  ChevronLeft,
  Search,
  RotateCcw,
  FileStack,
  Sparkles,
  PlayCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { usePrintStore } from '../stores/printStore';
import { LoadingSpinner } from '../components/Layout';
import { SmartPositionGrid, PositionLegend } from '../components/SmartPositionGrid';
import { SheetRenderer } from '../components/render/SheetRenderer';
import { SingleStickerPreview } from '../components/SingleStickerPreview';
import { PrintConfirmModal } from '../components/PrintConfirmModal';
import { PrintSuccessScreen } from '../components/PrintSuccessScreen';
import { WastageCounter } from '../components/WastageCounter';
import { SheetPreviewFrame } from '../components/PreviewFrame';
import { triggerBrowserPrint, setPrintPageSize } from '../lib/printExport';
import { PREVIEW_SCALE } from '../lib/units';
import { computePrintPositions, filterLabels, getEffectivePageConfig, productSummaryLine } from '../types';
import { clearSheetState, saveSheetState } from '../lib/sheetState';
import {
  DEMO_PRODUCTS,
  DEMO_TEMPLATE,
  DEMO_LAYOUT,
  buildDemoPreview,
  getDemoLabelData,
  productDisplayLine,
} from '../lib/demoData';
import { buildWastageStats } from '../lib/wastageStats';
import type { Label, Template, PrintJob, Layout, PageConfig, Category } from '../types';

interface PopulatedJob extends Omit<PrintJob, 'templateId' | 'labelIds'> {
  templateId: Template | string;
  labelIds: (Label | string)[];
}

function getRecentProductIds(history: PopulatedJob[], labels: Label[]): Label[] {
  const seen = new Set<string>();
  const result: Label[] = [];
  for (const job of history) {
    for (const ref of job.labelIds) {
      const id = typeof ref === 'string' ? ref : ref._id;
      if (seen.has(id)) continue;
      seen.add(id);
      const label = labels.find((l) => l._id === id);
      if (label) result.push(label);
      if (result.length >= 6) return result;
    }
  }
  return result;
}

export default function PrintLabelsPage() {
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [markUsedMode, setMarkUsedMode] = useState(false);

  const store = usePrintStore();
  const {
    templateId,
    layoutId,
    selectedLabelIds,
    startFromPosition,
    usedPositions,
    previewData,
    calibration,
    screen,
    quickStep,
    sheetIntent,
    successInfo,
    productSearch,
    isDemoMode,
    setTemplateId,
    setLayoutId,
    toggleLabel,
    setStartFromPosition,
    toggleUsedPosition,
    setUsedPositions,
    setPreviewData,
    setCalibration,
    setScreen,
    setQuickStep,
    setSuccessInfo,
    setProductSearch,
    startQuickPrint,
    startDemoPrint,
    setSheetIntent,
    startContinueSheet,
    persistSheetAfterPrint,
    reprintJob,
    loadFromHistory,
    goHome,
    exitDemoMode,
  } = store;

  const { data: shop, isLoading: loadingShop } = useQuery({
    queryKey: ['shop'],
    queryFn: api.settings.getShop,
  });

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: api.templates.list,
    enabled: !isDemoMode,
  });

  const { data: labels, isLoading: loadingLabels } = useQuery({
    queryKey: ['labels'],
    queryFn: () => api.labels.list(),
    enabled: !isDemoMode,
  });

  const { data: history } = useQuery({
    queryKey: ['history'],
    queryFn: api.printJobs.history,
    enabled: !isDemoMode,
  });

  const { data: layouts } = useQuery({
    queryKey: ['layouts', templateId],
    queryFn: () => api.layouts.list(templateId ?? undefined),
    enabled: !!templateId && !isDemoMode,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.list,
    enabled: !isDemoMode,
  });

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    (categories ?? []).forEach((c) => map.set(c._id, c));
    return map;
  }, [categories]);

  const summarizeProduct = (label: Label) => {
    if (isDemoMode) return productDisplayLine(label);
    return productSummaryLine(label, categoryMap.get(label.categoryId));
  };

  useQuery({
    queryKey: ['calibration'],
    queryFn: api.settings.getCalibration,
    select: (data) => {
      setCalibration(data);
      return data;
    },
    enabled: !isDemoMode,
  });

  useEffect(() => {
    if (templateId && sheetIntent === 'continue') {
      saveSheetState(templateId, usedPositions);
    }
  }, [usedPositions, templateId, sheetIntent]);

  useEffect(() => {
    if (isDemoMode) return;
    if (shop?.defaultTemplateId && !templateId) {
      setTemplateId(shop.defaultTemplateId);
    }
  }, [shop, templateId, setTemplateId, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) return;
    if (shop?.defaultLayoutId && templateId && !layoutId) {
      setLayoutId(shop.defaultLayoutId);
    } else if (layouts?.length && templateId && !layoutId) {
      setLayoutId(layouts[0]._id);
    }
  }, [shop, layouts, templateId, layoutId, setLayoutId, isDemoMode]);

  const activeTemplate: Template | undefined = isDemoMode
    ? DEMO_TEMPLATE
    : templates?.find((t: Template) => t._id === templateId);

  const activeLayout = isDemoMode ? DEMO_LAYOUT : layouts?.find((l) => l._id === layoutId);

  const activeLabels: Label[] = isDemoMode ? DEMO_PRODUCTS : (labels ?? []);

  const pageConfig: PageConfig | undefined = activeTemplate?.config
    ? getEffectivePageConfig(activeTemplate.config)
    : undefined;

  const printPositions =
    pageConfig && selectedLabelIds.length
      ? computePrintPositions('startFrom', selectedLabelIds.length, pageConfig, {
          startFromPosition,
          usedPositions,
        })
      : [];

  const searchableKeys = useMemo(() => {
    const keys = new Set<string>();
    (categories ?? []).forEach((c) => {
      c.config.fields.filter((f) => f.showInSearch).forEach((f) => keys.add(f.key));
    });
    return [...keys];
  }, [categories]);

  const filteredLabels = useMemo(
    () => filterLabels(productSearch, activeLabels, searchableKeys.length ? searchableKeys : undefined),
    [productSearch, activeLabels, searchableKeys]
  );

  const recentProducts = useMemo(
    () => getRecentProductIds((history as PopulatedJob[]) ?? [], labels ?? []),
    [history, labels]
  );

  const wastageStats = useMemo(() => {
    const config =
      pageConfig ?? templates?.[0]?.config ?? (isDemoMode ? DEMO_TEMPLATE.config : undefined);
    if (!config) return null;
    return buildWastageStats(
      config,
      usedPositions,
      printPositions,
      (history as PrintJob[]) ?? []
    );
  }, [pageConfig, templates, usedPositions, printPositions, history, isDemoMode]);

  const firstLabelData = useMemo(() => {
    const id = selectedLabelIds[0];
    if (!id) return null;
    if (isDemoMode) return getDemoLabelData(id);
    return labels?.find((l) => l._id === id)?.values ?? null;
  }, [selectedLabelIds, isDemoMode, labels]);

  const saveHistoryMutation = useMutation({
    mutationFn: api.printJobs.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  });

  const loadPreview = async () => {
    if (isDemoMode) {
      const data = buildDemoPreview();
      setPreviewData({ ...data, calibration });
      return data;
    }
    if (!templateId || !layoutId || !selectedLabelIds.length) return null;
    const data = await api.printJobs.preview({
      templateId,
      layoutId,
      labelIds: selectedLabelIds,
      mode: 'startFrom',
      selectedPositions: [],
      startFromPosition,
      usedPositions,
    });
    setPreviewData({ ...data, calibration });
    return data;
  };

  const handleQuickPrintStart = () => {
    startQuickPrint();
    if (shop?.defaultSheetBehavior === 'newSheet') {
      setUsedPositions([]);
      setStartFromPosition(1);
    }
  };

  const handleDemoStart = () => {
    startDemoPrint();
    setPreviewData(buildDemoPreview());
  };

  const handleRecentProduct = (labelId: string) => {
    startQuickPrint([labelId]);
    if (shop?.defaultSheetBehavior === 'newSheet') {
      setUsedPositions([]);
      setStartFromPosition(1);
      setQuickStep(2);
    } else {
      startContinueSheet(templateId ?? undefined, pageConfig);
      setQuickStep(2);
    }
  };

  const handleStep1Next = () => {
    if (selectedLabelIds.length === 0) return;
    if (shop?.defaultSheetBehavior === 'newSheet' && !sheetIntent) {
      setUsedPositions([]);
      setStartFromPosition(1);
    }
    setQuickStep(2);
  };

  const handleProceedToPrint = async () => {
    setConfirmError('');
    if (printPositions.length === 0) {
      setConfirmError('No empty stickers available. Try "New Sheet" or select fewer products.');
      setShowConfirm(true);
      return;
    }
    if (printPositions.length < selectedLabelIds.length) {
      setConfirmError(
        `You selected ${selectedLabelIds.length} products but only ${printPositions.length} empty stickers are available. Please select fewer products or use a new sheet.`
      );
      setShowConfirm(true);
      return;
    }
    await loadPreview();
    setShowConfirm(true);
  };

  const handlePrintConfirm = async () => {
    if (confirmError) return;
    setShowConfirm(false);

    if (isDemoMode) {
      setSuccessInfo({
        labelCount: printPositions.length,
        startPosition: printPositions[0],
        endPosition: printPositions[printPositions.length - 1],
        positions: printPositions,
        isDemo: true,
      });
      setScreen('success');
      return;
    }

    if (!templateId || !layoutId) return;

    const data = previewData ?? (await loadPreview());
    if (!data) return;

    setPrintPageSize(data.template.config.pageWidth, data.template.config.pageHeight);

    await saveHistoryMutation.mutateAsync({
      templateId,
      layoutId,
      labelIds: selectedLabelIds,
      mode: 'startFrom',
      selectedPositions: [],
      startFromPosition,
      usedPositions,
      status: 'printed',
    });

    persistSheetAfterPrint(templateId, printPositions);
    triggerBrowserPrint();

    setSuccessInfo({
      labelCount: printPositions.length,
      startPosition: printPositions[0],
      endPosition: printPositions[printPositions.length - 1],
      positions: printPositions,
    });
    setScreen('success');
  };

  if (!isDemoMode && (loadingShop || loadingLabels)) return <LoadingSpinner />;

  if (screen === 'success' && successInfo) {
    return (
      <PrintSuccessScreen
        info={successInfo}
        wastage={wastageStats ?? undefined}
        onPrintAgain={() => {
          exitDemoMode();
          setScreen('quickPrint');
          setQuickStep(2);
        }}
        onBack={() => {
          exitDemoMode();
          goHome();
        }}
      />
    );
  }

  if (screen === 'previousPrints') {
    return (
      <div className="mx-auto max-w-3xl">
        <button type="button" className="btn-secondary mb-6" onClick={goHome}>
          <ChevronLeft className="h-5 w-5" />
          Back to Print Labels
        </button>
        <h2 className="mb-6 text-3xl font-bold">Previous Prints</h2>
        {!history?.length ? (
          <p className="text-xl text-slate-500">No previous prints yet.</p>
        ) : (
          <div className="space-y-4">
            {(history as PopulatedJob[]).map((job) => (
              <div key={job._id} className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xl font-bold">
                    {new Date(job.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  <p className="text-lg text-slate-600">
                    {job.printPositions.length} labels · Stickers {job.printPositions.join(', ')}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-primary shrink-0"
                  onClick={async () => {
                    const tid = typeof job.templateId === 'string' ? job.templateId : job.templateId._id;
                    const lid = typeof job.layoutId === 'string' ? job.layoutId : (job.layoutId as Layout)._id;
                    const labelIds = job.labelIds.map((l) => (typeof l === 'string' ? l : l._id));
                    reprintJob({
                      templateId: tid,
                      layoutId: lid,
                      labelIds,
                      startFromPosition: job.startFromPosition,
                      usedPositions: job.usedPositions,
                      printPositions: job.printPositions,
                    });
                    const data = await api.printJobs.preview({
                      templateId: tid,
                      layoutId: lid,
                      labelIds,
                      mode: 'startFrom',
                      selectedPositions: [],
                      startFromPosition: job.startFromPosition ?? job.printPositions[0],
                      usedPositions: job.usedPositions,
                    });
                    setPreviewData({ ...data, calibration });
                    setShowConfirm(true);
                  }}
                >
                  <RotateCcw className="h-5 w-5" />
                  Reprint
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (screen === 'quickPrint') {
    const storeName = isDemoMode ? 'ABC Jewellers (Demo)' : (shop?.brandName ?? '');
    const sheetFormat = activeTemplate?.name ?? 'Default';

    return (
      <div className="mx-auto max-w-4xl">
        <button type="button" className="btn-secondary mb-6" onClick={goHome}>
          <ChevronLeft className="h-5 w-5" />
          Back
        </button>

        {isDemoMode && (
          <p className="demo-banner">
            Demo Mode — sample products & sticker sheet. Tap sticker #9 to see auto-fill!
          </p>
        )}

        {quickStep === 1 && (
          <div className="card">
            <h2 className="mb-2 text-3xl font-bold">Step 1 — Select Products</h2>
            <p className="mb-6 text-xl text-slate-600">Tap the products you want to print.</p>

            <div className="relative mb-6">
              <Search className="absolute left-5 top-1/2 h-7 w-7 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                className="input-field pl-16"
                placeholder="Search design no, ring, necklace..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              {filteredLabels.map((label: Label) => {
                const selected = selectedLabelIds.includes(label._id);
                return (
                  <button
                    key={label._id}
                    type="button"
                    onClick={() => toggleLabel(label._id)}
                    className={selected ? 'product-card-selected w-full' : 'product-card-default w-full'}
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 text-2xl font-bold ${
                        selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {selected ? '✓' : ''}
                    </span>
                    <div className="text-left">
                      <p className="text-2xl font-bold">{label.name}</p>
                      <p className="text-xl text-slate-600">{summarizeProduct(label)}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8">
              <button
                type="button"
                className="btn-xl w-full sm:w-auto"
                onClick={handleStep1Next}
                disabled={selectedLabelIds.length === 0}
              >
                Next — Choose Sticker
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}

        {quickStep === 2 && pageConfig && activeLayout && (
          <div className="card">
            <h2 className="mb-2 text-3xl font-bold">Step 2 — Choose Sticker Position</h2>
            <p className="mb-6 text-xl text-slate-600">
              Tap the first empty sticker where you want to start.
            </p>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                className="btn-secondary min-h-[64px]"
                onClick={() => {
                  if (templateId) clearSheetState(templateId);
                  setUsedPositions([]);
                  setStartFromPosition(1);
                  setSheetIntent('new');
                  setMarkUsedMode(false);
                }}
              >
                <FileStack className="h-7 w-7" />
                NEW SHEET
                <span className="block text-base font-normal text-slate-500">Start from sticker #1</span>
              </button>
              <button
                type="button"
                className="btn-secondary min-h-[64px]"
                onClick={() => {
                  startContinueSheet(templateId ?? undefined, pageConfig);
                  setMarkUsedMode(true);
                }}
              >
                <Sparkles className="h-7 w-7" />
                CONTINUE EXISTING SHEET
                <span className="block text-base font-normal text-slate-500">Mark used stickers first</span>
              </button>
            </div>

            {markUsedMode && (
              <p className="mb-4 rounded-2xl bg-amber-50 px-5 py-4 text-xl font-semibold text-amber-900">
                Tap stickers you've already used (grey). Then tap your first empty sticker.
              </p>
            )}

            <PositionLegend />

            <div className="my-6 rounded-2xl bg-slate-50 p-6">
              <SmartPositionGrid
                config={pageConfig}
                usedPositions={usedPositions}
                startFromPosition={startFromPosition}
                labelCount={selectedLabelIds.length}
                onStartFromChange={(pos) => {
                  setStartFromPosition(pos);
                  setMarkUsedMode(false);
                  if (templateId && sheetIntent === 'continue') {
                    saveSheetState(templateId, usedPositions);
                  }
                }}
                onToggleUsed={toggleUsedPosition}
                markUsedMode={markUsedMode}
              />
            </div>

            {firstLabelData && printPositions.length > 0 && (
              <div className="mb-6 preview-grid">
                <SingleStickerPreview
                  pageConfig={pageConfig}
                  layoutConfig={activeLayout.config}
                  labelData={firstLabelData}
                  brandName={storeName}
                  logoUrl={shop?.logoUrl}
                />
                <SheetPreviewFrame
                  pageWidthMm={pageConfig.pageWidth}
                  pageHeightMm={pageConfig.pageHeight}
                  scale={PREVIEW_SCALE * 0.85}
                  label="Full Sheet Preview"
                >
                  <SheetRenderer
                    pageConfig={pageConfig}
                    layoutConfig={activeLayout.config}
                    calibration={calibration}
                    usedPositions={usedPositions}
                    printPositions={printPositions}
                    positionLabelMap={printPositions.map((pos, i) => {
                      const id = selectedLabelIds[i];
                      const data = isDemoMode
                        ? getDemoLabelData(id)
                        : labels?.find((l) => l._id === id)?.values ?? null;
                      return { position: pos, label: data };
                    })}
                    brandName={storeName}
                    logoUrl={shop?.logoUrl}
                    showGrid
                    showPositionNumbers
                    scale={PREVIEW_SCALE * 0.85}
                  />
                </SheetPreviewFrame>
              </div>
            )}

            {wastageStats && printPositions.length > 0 && (
              <div className="mb-6">
                <WastageCounter stats={wastageStats} />
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <button type="button" className="btn-secondary" onClick={() => setQuickStep(1)}>
                <ChevronLeft className="h-5 w-5" />
                Back
              </button>
              <button
                type="button"
                className="btn-xl"
                onClick={handleProceedToPrint}
                disabled={printPositions.length === 0}
              >
                Print
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}

        {previewData && !isDemoMode && (
          <div className="pointer-events-none fixed left-[-9999px] top-0">
            <div ref={printRef} className="print-area">
              <SheetRenderer
                pageConfig={previewData.template.config}
                layoutConfig={previewData.layout.config}
                calibration={previewData.calibration}
                usedPositions={previewData.usedPositions}
                printPositions={previewData.printPositions}
                positionLabelMap={previewData.positionLabelMap.map((p) => ({
                  position: p.position,
                  label: p.label?.values ?? null,
                }))}
                brandName={shop?.brandName}
                logoUrl={shop?.logoUrl}
                showGrid
                showPositionNumbers
                unit="mm"
              />
            </div>
          </div>
        )}

        <PrintConfirmModal
          open={showConfirm}
          storeName={storeName}
          labelCount={Math.min(selectedLabelIds.length, printPositions.length)}
          startPosition={printPositions[0] ?? startFromPosition}
          endPosition={printPositions[printPositions.length - 1] ?? startFromPosition}
          sheetFormat={sheetFormat}
          error={confirmError}
          isDemo={isDemoMode}
          wastage={wastageStats ?? undefined}
          stickerPreview={
            firstLabelData && pageConfig && activeLayout ? (
              <SingleStickerPreview
                pageConfig={pageConfig}
                layoutConfig={activeLayout.config}
                labelData={firstLabelData}
                brandName={storeName}
                logoUrl={shop?.logoUrl}
                title="Actual Sticker Preview"
              />
            ) : undefined
          }
          onConfirm={handlePrintConfirm}
          onCancel={() => {
            setShowConfirm(false);
            setConfirmError('');
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-brand-700 sm:text-6xl">
          PRINT LABELS
        </h1>
        {shop?.brandName && (
          <p className="mt-3 text-2xl font-semibold text-slate-700">{shop.brandName}</p>
        )}
      </div>

      <button type="button" className="btn-quick-print mb-5 w-full" onClick={handleQuickPrintStart}>
        QUICK PRINT
      </button>

      <button type="button" className="btn-demo mb-10" onClick={handleDemoStart}>
        <PlayCircle className="h-8 w-8" />
        Try Demo Print
      </button>

      {wastageStats && wastageStats.stickersSavedThisMonth > 0 && (
        <div className="mb-8">
          <WastageCounter stats={wastageStats} compact />
        </div>
      )}

      {recentProducts.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-800">Recent Products</h2>
          <p className="mb-4 text-xl text-slate-600">Tap once to print again.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {recentProducts.map((label) => (
              <button
                key={label._id}
                type="button"
                onClick={() => handleRecentProduct(label._id)}
                className="product-card-default text-left"
              >
                <p className="text-xl font-bold">{label.name}</p>
                <p className="text-lg text-slate-600">{summarizeProduct(label)}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {(history as PopulatedJob[])?.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-800">Recent Prints</h2>
          <div className="space-y-4">
            {(history as PopulatedJob[]).slice(0, 3).map((job) => (
              <button
                key={job._id}
                type="button"
                onClick={() => {
                  const tid = typeof job.templateId === 'string' ? job.templateId : job.templateId._id;
                  loadFromHistory({
                    templateId: tid,
                    layoutId: typeof job.layoutId === 'string' ? job.layoutId : (job.layoutId as Layout)._id,
                    labelIds: job.labelIds.map((l) => (typeof l === 'string' ? l : l._id)),
                    startFromPosition: job.startFromPosition,
                    usedPositions: job.usedPositions,
                    printPositions: job.printPositions,
                  });
                }}
                className="product-card-default w-full text-left"
              >
                <p className="text-xl font-bold">
                  {job.printPositions.length} labels · Stickers {job.printPositions[0]}–
                  {job.printPositions[job.printPositions.length - 1]}
                </p>
                <p className="text-lg text-slate-500">
                  {new Date(job.createdAt).toLocaleDateString('en-IN')}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className="btn-secondary w-full"
        onClick={() => setScreen('previousPrints')}
      >
        Previous Prints
      </button>
    </div>
  );
}
