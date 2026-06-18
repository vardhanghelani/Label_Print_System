import jsPDF from 'jspdf';
import type {
  PageConfig,
  LayoutConfig,
  LayoutField,
  LabelData,
  CalibrationSettings,
  Category,
  Layout,
} from '../types';
import {
  getEffectivePageConfig,
  getFieldAbsoluteRect,
  resolveProductFieldValue,
  formatPrintFieldLine,
} from '../types';
import { resolveLayoutFieldsForCategory } from '../lib/categoryPrintLayout';
import { resolveStickers } from './geometryBuilder';
import { calibrateMm } from './units';

export interface VectorLabelPdfInput {
  pageConfig: PageConfig;
  layoutConfig: LayoutConfig;
  calibration: CalibrationSettings;
  printPositions: number[];
  positionLabelMap: Array<{
    position: number;
    label: LabelData | null;
    categoryId?: string;
  }>;
  categoriesById?: Map<string, Category>;
  layouts?: Layout[];
  templateId?: string;
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
function fieldFontSizeMm(field: LayoutField, calibration: CalibrationSettings): number {
  const raw = Number(field.fontSize);
  const base = Number.isFinite(raw) && raw > 0 ? Math.max(2, raw * 0.35) : 2.5;
  const scaleY = Number(calibration.scaleY);
  return base * ((Number.isFinite(scaleY) && scaleY > 0 ? scaleY : 100) / 100);
}

function sanitizePageMm(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Calibrated field box — matches preview renderer coordinate math */
function getCalibratedRect(
  rect: { x: number; y: number; width: number; height: number },
  calibration: CalibrationSettings
) {
  const x0 = calX(rect.x, calibration);
  const y0 = calY(rect.y, calibration);
  const x1 = calX(rect.x + rect.width, calibration);
  const y1 = calY(rect.y + rect.height, calibration);
  return {
    x: x0,
    y: y0,
    width: x1 - x0,
    height: y1 - y0,
  };
}

function resolveDisplayValue(
  field: LayoutField,
  values: LabelData,
  category: Category | undefined,
  brandName?: string
): string {
  const raw = resolveProductFieldValue(field, values, category, brandName);
  return formatPrintFieldLine(field, raw, category);
}

function hasDisplayValue(value: string): boolean {
  return value.trim().length > 0;
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
  const pageWidth = sanitizePageMm(pageConfig.pageWidth, 137);
  const pageHeight = sanitizePageMm(pageConfig.pageHeight, 172);

  const pdf = new jsPDF({
    orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight],
  });

  pdf.setTextColor(0, 0, 0);

  const stickers = resolveStickers(pageConfig);
  const labelMap = new Map(
    input.positionLabelMap.map((p) => [
      p.position,
      { values: p.label, categoryId: p.categoryId },
    ])
  );
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
      categoryFieldMode: true,
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
  const skipEmptyByField: Record<string, number> = {};

  for (const sticker of stickers) {
    if (!printSet.has(sticker.stickerNumber)) continue;

    const entry = labelMap.get(sticker.stickerNumber);
    const label = entry?.values ?? null;
    const category = entry?.categoryId
      ? input.categoriesById?.get(entry.categoryId)
      : undefined;

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

    for (const field of resolveLayoutFieldsForCategory(
      category,
      input.layouts,
      input.templateId,
      pageConfig
    )) {
      const value = resolveDisplayValue(field, label, category, input.brandName);
      if (!hasDisplayValue(value)) {
        skipEmpty++;
        const fk = field.fieldKey ?? field.label;
        skipEmptyByField[fk] = (skipEmptyByField[fk] ?? 0) + 1;
        // #region agent log
        debugLog(
          'vectorLabelPdf.ts:empty-value',
          'Field value empty — skipped',
          {
            position: sticker.stickerNumber,
            fieldKey: field.fieldKey,
            fieldLabel: field.label,
            labelKeys: Object.keys(label),
            labelValues: label,
            categoryId: entry?.categoryId,
          },
          'H-A'
        );
        // #endregion
        continue;
      }

      const rect = getFieldAbsoluteRect(field, sticker);
      const box = getCalibratedRect(rect, input.calibration);

      if (!isValidCoord(box.x, box.y, pageWidth, pageHeight)) {
        skipInvalid++;
        // #region agent log
        debugLog(
          'vectorLabelPdf.ts:invalid-coord',
          'Invalid coordinates — skipped',
          { field: field.fieldKey, value, box, rawRect: rect, pageWidth, pageHeight },
          'H-E'
        );
        // #endregion
        continue;
      }

      pdf.setFont('helvetica', fontStyle(field));
      const safeFontSize = fieldFontSizeMm(field, input.calibration);
      pdf.setFontSize(safeFontSize);

      let textX = box.x;
      if (field.alignment === 'center') textX = box.x + box.width / 2;
      else if (field.alignment === 'right') textX = box.x + box.width;

      const textY = box.y;

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
          box,
          fontSizeMm: safeFontSize,
          rawFontSize: field.fontSize,
          position: sticker.stickerNumber,
          section: field.section,
        },
        'H-C'
      );
      // #endregion

      const maxWidth = Number.isFinite(box.width) && box.width > 0 ? box.width : 30;
      const textOpts: {
        align: 'left' | 'center' | 'right';
        maxWidth: number;
        baseline: 'top';
        angle?: number;
      } = {
        align: field.alignment,
        maxWidth,
        baseline: 'top',
      };
      if (field.rotation) textOpts.angle = field.rotation;

      pdf.text(String(value), textX, textY, textOpts);
      drawCount++;
    }
  }

  const filename = input.filename ?? 'labels.pdf';

  // #region agent log
  debugLog(
    'vectorLabelPdf.ts:save',
    'PDF save',
    {
      filename,
      drawCount,
      skipEmpty,
      skipInvalid,
      skipEmptyByField,
      pageWidth,
      pageHeight,
    },
    'H-D'
  );
  // #endregion

  pdf.save(filename);
}
