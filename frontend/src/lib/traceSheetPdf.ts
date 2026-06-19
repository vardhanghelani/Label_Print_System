import { jsPDF } from 'jspdf';
import type { PageConfig, CalibrationSettings, Category, LabelData } from '../types';
import { resolveStickers } from './geometryBuilder';
import { buildPrintTextItems } from './labelRenderPipeline';
import { fieldFontSizeMm, fontStyle } from './labelRenderPipeline';
import { calibrateMm } from './units';

const TRACE_CATEGORY_ID = 'trace-sheet-category';

const TRACE_CATEGORY: Category = {
  _id: TRACE_CATEGORY_ID,
  name: 'Trace Sheet',
  config: {
    fields: [
      {
        id: 'tf1',
        name: 'Label',
        key: 'label',
        datatype: 'text',
        required: false,
        showInSearch: false,
        showInLabel: true,
        visibleInForm: false,
        editable: false,
        readOnly: true,
        sortOrder: 0,
      },
      {
        id: 'tf2',
        name: 'Coords',
        key: 'coords',
        datatype: 'text',
        required: false,
        showInSearch: false,
        showInLabel: true,
        visibleInForm: false,
        editable: false,
        readOnly: true,
        sortOrder: 1,
      },
    ],
  },
  createdAt: '',
  updatedAt: '',
};

function buildTracePrintInput(
  pageConfig: PageConfig,
  calibration: CalibrationSettings,
  stickerCount: number
) {
  const printPositions = Array.from({ length: stickerCount }, (_, i) => i + 1);
  const categoriesById = new Map([[TRACE_CATEGORY_ID, TRACE_CATEGORY]]);

  const positionLabelMap = printPositions.map((position) => {
    const values: LabelData = {
      label: `#${position}`,
      coords: `S${position}`,
    };
    return { position, label: values, categoryId: TRACE_CATEGORY_ID };
  });

  return buildPrintTextItems({
    pageConfig,
    calibration,
    printPositions,
    positionLabelMap,
    categoriesById,
  });
}

/**
 * Trace sheet PDF — print on blank paper, overlay real tag sheet, verify alignment.
 * Page box + all sticker broad outlines + text at exact production coordinates.
 */
export function exportTraceSheetPdf(
  pageConfig: PageConfig,
  calibration: CalibrationSettings,
  filename = 'trace-sheet.pdf'
): void {
  const stickers = resolveStickers(pageConfig);
  const pageWidth = pageConfig.pageWidth;
  const pageHeight = pageConfig.pageHeight;
  const pipelineResult = buildTracePrintInput(pageConfig, calibration, stickers.length);

  const pdfX = (mm: number) => calibrateMm(mm, calibration.horizontalOffset, calibration.scaleX);
  const pdfY = (mm: number) => calibrateMm(mm, calibration.verticalOffset, calibration.scaleY);

  const pdf = new jsPDF({
    orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight],
  });

  // Outer page box (trace against sheet edge)
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.rect(0, 0, pageWidth, pageHeight);

  // Corner marks
  const corner = 3;
  pdf.setLineWidth(0.35);
  pdf.line(0, 0, corner, 0);
  pdf.line(0, 0, 0, corner);
  pdf.line(pageWidth, 0, pageWidth - corner, 0);
  pdf.line(pageWidth, 0, pageWidth, corner);
  pdf.line(0, pageHeight, corner, pageHeight);
  pdf.line(0, pageHeight, 0, pageHeight - corner);
  pdf.line(pageWidth, pageHeight, pageWidth - corner, pageHeight);
  pdf.line(pageWidth, pageHeight, pageWidth, pageHeight - corner);

  // Printable margin (dashed)
  pdf.setDrawColor(100, 100, 100);
  pdf.setLineDashPattern([1.5, 1.5], 0);
  pdf.rect(
    pdfX(pageConfig.leftMargin),
    pdfY(pageConfig.topMargin),
    pageConfig.printableAreaWidth,
    pageConfig.printableAreaHeight
  );
  pdf.setLineDashPattern([], 0);

  // Sticker outlines
  for (const sticker of stickers) {
    const tail = sticker.tailArea;
    const broad = sticker.broadArea;

    pdf.setFillColor(240, 240, 240);
    pdf.rect(pdfX(tail.x), pdfY(tail.y), tail.width, tail.height, 'F');

    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.25);
    pdf.rect(pdfX(broad.x), pdfY(broad.y), broad.width, broad.height);

    pdf.setDrawColor(160, 160, 160);
    pdf.setLineDashPattern([0.8, 0.8], 0);
    pdf.line(
      pdfX(sticker.sectionA.x + sticker.sectionA.width),
      pdfY(sticker.sectionA.y),
      pdfX(sticker.sectionA.x + sticker.sectionA.width),
      pdfY(sticker.sectionA.y + sticker.sectionA.height)
    );
    pdf.setLineDashPattern([], 0);

    pdf.setFontSize(5);
    pdf.setTextColor(120, 120, 120);
    pdf.text(String(sticker.stickerNumber), pdfX(broad.x + 0.3), pdfY(broad.y + 2));
  }

  // Text at exact print coordinates (same pipeline as labels.pdf)
  pdf.setTextColor(0, 0, 0);
  for (const item of pipelineResult.items) {
    const field = item.field;
    const box = item.calibratedRect;

    pdf.setFont('helvetica', fontStyle(field));
    pdf.setFontSize(Math.min(fieldFontSizeMm(field, calibration), 6));

    let textX = box.x;
    if (field.alignment === 'center') textX = box.x + box.width / 2;
    else if (field.alignment === 'right') textX = box.x + box.width;

    pdf.text(String(item.text), textX, box.y, {
      align: field.alignment,
      maxWidth: box.width > 0 ? box.width : 20,
      baseline: 'top',
    });
  }

  pdf.setFontSize(6);
  pdf.setTextColor(80, 80, 80);
  pdf.text(
    `TRACE SHEET ${pageWidth}×${pageHeight} mm — overlay tag sheet on blank paper print`,
    2,
    pageHeight - 2
  );

  pdf.save(filename);
}
