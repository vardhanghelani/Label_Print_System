import { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Printer } from 'lucide-react';
import { api } from '../services/api';
import { usePrintStore } from '../stores/printStore';
import { PageHeader, LoadingSpinner } from '../components/Layout';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CalibrationSheetRenderer } from '../components/render/CalibrationSheetRenderer';
import { SheetPreviewFrame } from '../components/PreviewFrame';
import { effectiveJewelleryPageConfig, JEWELLERY_SHEET_NAME } from '../lib/jewellerySheet';
import type { CalibrationSettings } from '../types';
import { DEFAULT_CALIBRATION } from '../types';
import { triggerBrowserPrint } from '../lib/printExport';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { setCalibration } = usePrintStore();
  const printRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<CalibrationSettings>({ ...DEFAULT_CALIBRATION });
  const [saved, setSaved] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [printPageSize, setPrintPageSize] = useState('137mm 172mm');

  const { data, isLoading } = useQuery({
    queryKey: ['calibration'],
    queryFn: api.settings.getCalibration,
  });

  const pageConfig = useMemo(() => effectiveJewelleryPageConfig(), []);

  useEffect(() => {
    if (data) {
      setForm(data);
      setCalibration(data);
    }
  }, [data, setCalibration]);

  useEffect(() => {
    if (pageConfig) {
      setPrintPageSize(`${pageConfig.pageWidth}mm ${pageConfig.pageHeight}mm`);
    }
  }, [pageConfig]);

  const saveMutation = useMutation({
    mutationFn: api.settings.updateCalibration,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['calibration'] });
      setCalibration(result);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const update = (key: keyof CalibrationSettings, value: number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePrintCalibration = () => {
    triggerBrowserPrint(printPageSize);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Print Adjustment"
        subtitle={`Fine-tune printing for ${JEWELLERY_SHEET_NAME} (137×172 mm) after your first test print`}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card">
          <h3 className="mb-2 text-lg font-semibold">Calibration Values</h3>
          <p className="mb-6 text-slate-600">
            Print the calibration sheet on plain paper. Hold it over your real sticker sheet.
            Adjust until crosshairs and borders align perfectly.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowSaveConfirm(true);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label-text">Horizontal Offset (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  value={form.horizontalOffset}
                  onChange={(e) => update('horizontalOffset', parseFloat(e.target.value) || 0)}
                />
                <p className="mt-1 text-xs text-slate-500">Shift left (-) or right (+)</p>
              </div>
              <div>
                <label className="label-text">Vertical Offset (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  value={form.verticalOffset}
                  onChange={(e) => update('verticalOffset', parseFloat(e.target.value) || 0)}
                />
                <p className="mt-1 text-xs text-slate-500">Shift up (-) or down (+)</p>
              </div>
              <div>
                <label className="label-text">Scale X (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min={50}
                  max={200}
                  className="input-field"
                  value={form.scaleX}
                  onChange={(e) => update('scaleX', parseFloat(e.target.value) || 100)}
                />
              </div>
              <div>
                <label className="label-text">Scale Y (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min={50}
                  max={200}
                  className="input-field"
                  value={form.scaleY}
                  onChange={(e) => update('scaleY', parseFloat(e.target.value) || 100)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
                <Save className="h-5 w-5" />
                {saveMutation.isPending ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handlePrintCalibration}
                disabled={!pageConfig}
              >
                <Printer className="h-5 w-5" />
                Print Calibration Sheet
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Live Preview</h3>
          {pageConfig ? (
            <SheetPreviewFrame
              pageWidthMm={pageConfig.pageWidth}
              pageHeightMm={pageConfig.pageHeight}
              scale={2}
              label="Calibration sheet"
            >
              <CalibrationSheetRenderer
                pageConfig={pageConfig}
                calibration={form}
                scale={2}
                unit="px"
              />
            </SheetPreviewFrame>
          ) : (
            <p className="text-slate-500">No template available for calibration preview.</p>
          )}
          <p className="mt-3 text-sm text-slate-500">
            Red = page border · Blue dashed = printable area · Crosshairs = sticker centers
          </p>
        </div>
      </div>

      {pageConfig && (
        <div className="pointer-events-none fixed left-[-9999px] top-0">
          <div ref={printRef} className="print-area">
            <CalibrationSheetRenderer
              pageConfig={pageConfig}
              calibration={form}
              unit="mm"
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showSaveConfirm}
        title="Save Print Adjustment?"
        message="This changes how labels print on your printer. Only change this if labels are not aligning correctly."
        confirmLabel="Save"
        onConfirm={() => {
          setShowSaveConfirm(false);
          saveMutation.mutate(form);
        }}
        onCancel={() => setShowSaveConfirm(false)}
      />
    </div>
  );
}
