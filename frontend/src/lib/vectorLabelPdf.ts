import jsPDF from 'jspdf';
import type {
  PageConfig,
  LayoutConfig,
  LayoutField,
  LabelData,
  CalibrationSettings,
} from '../types';
import {
  getEffectivePageConfig,
  getFieldAbsoluteRect,
  resolveFieldValue,
} from '../types';
import { resolveStickers } from './geometryBuilder';
import { calibrateMm } from './units';

export interface VectorLabelPdfInput {
  pageConfig: PageConfig;
  layoutConfig: LayoutConfig;
  calibration: CalibrationSettings;
  printPositions: number[];
  positionLabelMap: Array<{ position: number; label: LabelData | null }>;
  brandName?: string;
  filename?: string;
}

// #region agent log
function debugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string
) {
  const payload = {
    sessionId: '602ec9',
    location,
    message,
    data,
    hypothesisId,
    timestamp: Date.now(),
    runId: 'vector-pdf',
  };
  console.log(`[print-debug] ${message}`, data);
  fetch('http://127.0.0.1:7355/ingest/c86470b8-c57e-4f6c-891d-dfb865bf7897', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '602ec9' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
// #endregion

function calX(mm: number, calibration: CalibrationSettings): number {
  return calibrateMm(mm, calibration.horizontalOffset, calibration.scaleX);
}

function calY(mm: number, calibration: CalibrationSettings): number {
  return calibrateMm(mm, calibration.verticalOffset, calibration.scaleY);
}

function fontStyle(field: LayoutField): string {
  if (field.bold && field.italic) return 'bolditalic';
  if (field.bold) return 'bold';
  if (field.italic) return 'italic';
  return 'normal';
}

/** Layout fontSize uses designer units; convert to mm for jsPDF */
function fieldFontSizeMm(field: LayoutField): number {
  return Math.max(2, field.fontSize * 0.35);
}

function resolveDisplayValue(
  field: LayoutField,
  values: LabelData,
  brandName?: string
): string {
  if (field.type === 'staticBranding' && brandName) return brandName;
  return resolveFieldValue(field, values);
}

function isValidCoord(x: number, y: number, pageW: number, pageH: number): boolean {
  return (
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= -5 &&
    y >= -5 &&
    x <= pageW + 5 &&
    y <= pageH + 5
  );
}

/**
 * Vector PDF export — text only at exact mm coordinates.
 * No html2canvas, no browser print, no layout backgrounds.
 */
export function exportVectorLabelPdf(input: VectorLabelPdfInput): void {
  const pageConfig = getEffectivePageConfig(input.pageConfig);
  const { pageWidth, pageHeight } = pageConfig;

  const pdf = new jsPDF({
    orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight],
  });

  pdf.setTextColor(0, 0, 0);

  const stickers = resolveStickers(pageConfig);
  const labelMap = new Map(input.positionLabelMap.map((p) => [p.position, p.label]));
  const printSet = new Set(input.printPositions);

  // #region agent log
  const sampleLabels = input.positionLabelMap
    .filter((p) => printSet.has(p.position) && p.label)
    .slice(0, 3)
    .map((p) => ({ position: p.position, values: p.label }));
  debugLog(
    'vectorLabelPdf.ts:entry',
    'PDF generation start',
    {
      pageWidth,
      pageHeight,
      printPositions: input.printPositions,
      fieldCount: input.layoutConfig.fields.length,
      fields: input.layoutConfig.fields.map((f) => ({
        id: f.id,
        key: f.fieldKey,
        section: f.section,
        type: f.type,
      })),
      sampleLabels,
      calibration: input.calibration,
    },
    'H-A'
  );
  // #endregion

  let drawCount = 0;
  let skipEmpty = 0;
  let skipInvalid = 0;

  for (const sticker of stickers) {
    if (!printSet.has(sticker.stickerNumber)) continue;

    const label = labelMap.get(sticker.stickerNumber);
    if (!label) {
      // #region agent log
      debugLog(
        'vectorLabelPdf.ts:no-label',
        'Sticker has no label data',
        { position: sticker.stickerNumber },
        'H-A'
      );
      // #endregion
      continue;
    }

    for (const field of input.layoutConfig.fields) {
      const value = resolveDisplayValue(field, label, input.brandName);
      if (!value) {
        skipEmpty++;
        // #region agent log
        debugLog(
          'vectorLabelPdf.ts:empty-value',
          'Field value empty — skipped',
          {
            position: sticker.stickerNumber,
            fieldKey: field.fieldKey,
            fieldLabel: field.label,
            labelKeys: Object.keys(label),
          },
          'H-A'
        );
        // #endregion
        continue;
      }

      const rect = getFieldAbsoluteRect(field, sticker);
      const x = calX(rect.x, input.calibration);
      const y = calY(rect.y, input.calibration);
      const fontSizeMm = fieldFontSizeMm(field);

      if (!isValidCoord(x, y, pageWidth, pageHeight)) {
        skipInvalid++;
        // #region agent log
        debugLog(
          'vectorLabelPdf.ts:invalid-coord',
          'Invalid coordinates — skipped',
          { field: field.fieldKey, value, x, y, rect, pageWidth, pageHeight },
          'H-E'
        );
        // #endregion
        continue;
      }

      pdf.setFont('helvetica', fontStyle(field));
      pdf.setFontSize(fontSizeMm);

      let textX = x;
      if (field.alignment === 'center') textX = x + rect.width / 2;
      else if (field.alignment === 'right') textX = x + rect.width;

      const textY = y + fontSizeMm * 0.85;

      // #region agent log
      debugLog(
        'vectorLabelPdf.ts:draw',
        'Drawing field',
        {
          field: field.label,
          fieldKey: field.fieldKey,
          value,
          x: textX,
          y: textY,
          fontSizeMm,
          position: sticker.stickerNumber,
          section: field.section,
        },
        'H-C'
      );
      // #endregion

      const textOpts: { align: 'left' | 'center' | 'right'; maxWidth: number; angle?: number } = {
        align: field.alignment,
        maxWidth: rect.width,
      };
      if (field.rotation) textOpts.angle = field.rotation;

      pdf.text(value, textX, textY, textOpts);
      drawCount++;
    }
  }

  const filename = input.filename ?? 'labels.pdf';

  // #region agent log
  debugLog(
    'vectorLabelPdf.ts:save',
    'PDF save',
    { filename, drawCount, skipEmpty, skipInvalid, pageWidth, pageHeight },
    'H-D'
  );
  // #endregion

  pdf.save(filename);
}
