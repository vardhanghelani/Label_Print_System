import jsPDF from 'jspdf';
import {
  buildPrintTextItems,
  assertPrintReady,
  fieldFontSizeMm,
  fontStyle,
  PrintPipelineError,
  type BuildPrintItemsInput,
} from './labelRenderPipeline';
import { logPdfRenderDiagnostics, logPrintDebug } from './printDebug';

export interface VectorLabelPdfInput extends BuildPrintItemsInput {
  filename?: string;
}

export interface VectorLabelPdfResult {
  filename: string;
  diagnostics: ReturnType<typeof buildPrintTextItems>['diagnostics'];
  itemCount: number;
}

// #region agent log
function debugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string
) {
  fetch('http://127.0.0.1:7355/ingest/c86470b8-c57e-4f6c-891d-dfb865bf7897', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '602ec9' },
    body: JSON.stringify({
      sessionId: '602ec9',
      location,
      message,
      data,
      hypothesisId,
      timestamp: Date.now(),
      runId: 'vector-pdf',
    }),
  }).catch(() => {});
}
// #endregion

/**
 * Vector PDF export — text only at exact mm coordinates.
 * Uses shared labelRenderPipeline (same as preview).
 */
export function exportVectorLabelPdf(input: VectorLabelPdfInput): VectorLabelPdfResult {
  const pipelineResult = buildPrintTextItems(input);

  // #region agent log
  debugLog(
    'vectorLabelPdf.ts:pipeline',
    'Print pipeline diagnostics',
    pipelineResult.diagnostics as unknown as Record<string, unknown>,
    'H-C'
  );
  // #endregion

  const items = assertPrintReady(pipelineResult);
  const { pageWidth, pageHeight } = pipelineResult.diagnostics;

  logPdfRenderDiagnostics(pageWidth, pageHeight, items);
  logPrintDebug('exportVectorLabelPdf', pageWidth, pageHeight, items);

  const pdf = new jsPDF({
    orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight],
  });

  pdf.setTextColor(0, 0, 0);

  for (const item of items) {
    const field = item.field;
    const box = item.calibratedRect;

    pdf.setFont('helvetica', fontStyle(field));
    pdf.setFontSize(fieldFontSizeMm(field, input.calibration));

    let textX = box.x;
    if (field.alignment === 'center') textX = box.x + box.width / 2;
    else if (field.alignment === 'right') textX = box.x + box.width;

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

    pdf.text(String(item.text), textX, box.y, textOpts);
  }

  const filename = input.filename ?? 'labels.pdf';
  pdf.save(filename);

  // #region agent log
  debugLog(
    'vectorLabelPdf.ts:save',
    'PDF saved',
    { filename, itemCount: items.length, pageWidth, pageHeight },
    'H-D'
  );
  // #endregion

  return { filename, diagnostics: pipelineResult.diagnostics, itemCount: items.length };
}

export { PrintPipelineError };
