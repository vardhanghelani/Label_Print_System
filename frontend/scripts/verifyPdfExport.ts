/**
 * PDF export smoke test — verifies text items and page size without a browser.
 * Run: npx tsx frontend/scripts/verifyPdfExport.ts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jsPDF } from 'jspdf';
import { buildJewellerySheetPageConfig } from '../src/lib/jewelleryGeometry.js';
import { buildPrintTextItems, assertPrintReady, fieldFontSizeMm, fontStyle } from '../src/lib/labelRenderPipeline.js';
import { DEFAULT_CALIBRATION, type Category } from '../src/types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../../.verify-output');
const OUT_PDF = path.join(OUT_DIR, 'verify-labels.pdf');
const OUT_REPORT = path.join(OUT_DIR, 'pdf-verification-report.json');

const TEST_CATEGORY: Category = {
  _id: 'verify-ring',
  name: 'Ring',
  config: {
    fields: [
      {
        id: 'v1',
        name: 'Item Code',
        key: 'item_code',
        datatype: 'text',
        required: true,
        showInSearch: true,
        showInLabel: true,
        visibleInForm: true,
        editable: true,
        readOnly: false,
        sortOrder: 0,
      },
      {
        id: 'v2',
        name: 'Weight',
        key: 'weight',
        datatype: 'number',
        required: false,
        showInSearch: false,
        showInLabel: true,
        visibleInForm: true,
        editable: true,
        readOnly: false,
        sortOrder: 1,
      },
      {
        id: 'v3',
        name: 'Price',
        key: 'price',
        datatype: 'currency',
        required: false,
        showInSearch: true,
        showInLabel: true,
        visibleInForm: true,
        editable: true,
        readOnly: false,
        sortOrder: 2,
      },
    ],
  },
  createdAt: '',
  updatedAt: '',
};

const pageConfig = buildJewellerySheetPageConfig();
const calibration = { ...DEFAULT_CALIBRATION };

const pipelineResult = buildPrintTextItems({
  pageConfig,
  calibration,
  printPositions: [1],
  positionLabelMap: [
    {
      position: 1,
      label: { item_code: 'TEST001', weight: 4.5, price: 5000 },
      categoryId: TEST_CATEGORY._id,
    },
  ],
  categoriesById: new Map([[TEST_CATEGORY._id, TEST_CATEGORY]]),
});

const items = assertPrintReady(pipelineResult);
const { pageWidth, pageHeight } = pipelineResult.diagnostics;

const renderLog = items.map((item) => ({
  pageWidth,
  pageHeight,
  stickerNumber: item.stickerNumber,
  fieldName: item.field.label ?? item.fieldId,
  fieldValue: item.text,
  finalX: item.calibratedRect.x,
  finalY: item.calibratedRect.y,
}));

console.log('[PDF Verification] Render diagnostics:');
for (const row of renderLog) {
  console.log(JSON.stringify(row));
}

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
  pdf.setFontSize(fieldFontSizeMm(field, calibration));
  let textX = box.x;
  if (field.alignment === 'center') textX = box.x + box.width / 2;
  else if (field.alignment === 'right') textX = box.x + box.width;
  pdf.text(String(item.text), textX, box.y, {
    align: field.alignment,
    maxWidth: box.width > 0 ? box.width : 30,
    baseline: 'top',
  });
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
fs.writeFileSync(OUT_PDF, pdfBuffer);

const pdfBytes = fs.readFileSync(OUT_PDF);
const textChunks = pdfBytes
  .toString('latin1')
  .match(/\(([^)\\]*(?:\\.[^)\\]*)*)\)/g)
  ?.map((m) => m.slice(1, -1).replace(/\\(.)/g, '$1'))
  .filter((t) => t.length > 1 && !/^\d/.test(t)) ?? [];

const report = {
  passed: items.length > 0 && pageWidth === 110 && pageHeight === 197 && pdfBytes.length > 500,
  pageWidth,
  pageHeight,
  itemCount: items.length,
  pdfPath: OUT_PDF,
  pdfSizeBytes: pdfBytes.length,
  extractedTextSamples: textChunks.slice(0, 20),
  renderLog,
  emptyPdf: items.length === 0 || pdfBytes.length < 500,
};

fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2));

console.log('\n[PDF Verification] Report:');
console.log(JSON.stringify(report, null, 2));

if (!report.passed) {
  process.exit(1);
}
