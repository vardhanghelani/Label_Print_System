import jsPDF from 'jspdf';
import type { PageConfig, CalibrationSettings } from '../types';
import { resolveStickers } from './geometryBuilder';
import { calibrateMm } from './units';

export function exportCalibrationPdf(
  pageConfig: PageConfig,
  calibration: CalibrationSettings,
  filename = 'calibration-sheet.pdf'
): void {
  const pageWidth = pageConfig.pageWidth;
  const pageHeight = pageConfig.pageHeight;
  const stickers = resolveStickers(pageConfig);

  const calX = (mm: number) => calibrateMm(mm, calibration.horizontalOffset, calibration.scaleX);
  const calY = (mm: number) => calibrateMm(mm, calibration.verticalOffset, calibration.scaleY);

  const pdf = new jsPDF({
    orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight],
  });

  pdf.setDrawColor(220, 38, 38);
  pdf.setLineWidth(0.3);
  pdf.rect(0, 0, pageWidth, pageHeight);

  pdf.setDrawColor(59, 130, 246);
  pdf.setLineDashPattern([1, 1], 0);
  pdf.rect(
    calX(pageConfig.leftMargin),
    calY(pageConfig.topMargin),
    pageConfig.printableAreaWidth,
    pageConfig.printableAreaHeight
  );
  pdf.setLineDashPattern([], 0);

  for (let mm = 0; mm <= pageWidth; mm += 10) {
    pdf.setDrawColor(148, 163, 184);
    pdf.line(calX(mm), calY(0), calX(mm), calY(mm % 50 === 0 ? 4 : 2));
    if (mm % 20 === 0) {
      pdf.setFontSize(5);
      pdf.text(String(mm), calX(mm + 0.5), calY(5));
    }
  }
  for (let mm = 0; mm <= pageHeight; mm += 10) {
    pdf.setDrawColor(148, 163, 184);
    pdf.line(calX(0), calY(mm), calX(mm % 50 === 0 ? 4 : 2), calY(mm));
    if (mm % 20 === 0) {
      pdf.setFontSize(5);
      pdf.text(String(mm), calX(5), calY(mm + 1));
    }
  }

  for (const sticker of stickers) {
    const broad = sticker.broadArea;
    const tail = sticker.tailArea;
    const cx = calX(broad.x + broad.width / 2);
    const cy = calY(broad.y + broad.height / 2);

    pdf.setFillColor(226, 232, 240);
    pdf.rect(calX(tail.x), calY(tail.y), tail.width, tail.height, 'F');

    pdf.setDrawColor(71, 85, 105);
    pdf.rect(calX(broad.x), calY(broad.y), broad.width, broad.height);

    pdf.setDrawColor(244, 114, 182);
    pdf.setLineDashPattern([0.5, 0.5], 0);
    pdf.rect(
      calX(sticker.sectionA.x),
      calY(sticker.sectionA.y),
      sticker.sectionA.width,
      sticker.sectionA.height
    );
    pdf.setDrawColor(192, 132, 252);
    pdf.rect(
      calX(sticker.sectionB.x),
      calY(sticker.sectionB.y),
      sticker.sectionB.width,
      sticker.sectionB.height
    );
    pdf.setLineDashPattern([], 0);

    pdf.setDrawColor(220, 38, 38);
    pdf.line(cx - 1.5, cy, cx + 1.5, cy);
    pdf.line(cx, cy - 1.5, cx, cy + 1.5);

    pdf.setFontSize(6);
    pdf.setTextColor(220, 38, 38);
    pdf.text(String(sticker.stickerNumber), calX(broad.x + 0.5), calY(broad.y + 2));
  }

  pdf.setFontSize(7);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Calibration ${pageWidth}×${pageHeight} mm — ${stickers.length} stickers`, 2, pageHeight - 2);

  pdf.save(filename);
}
