import type { PageConfig, CalibrationSettings } from '../../types';
import { resolveStickers } from '../../lib/geometryBuilder';
import { calibrateMm, formatLength, type RenderUnit } from '../../lib/units';

export interface CalibrationSheetProps {
  pageConfig: PageConfig;
  calibration: CalibrationSettings;
  unit?: RenderUnit;
  scale?: number;
  className?: string;
  id?: string;
}

export function CalibrationSheetRenderer({
  pageConfig,
  calibration,
  unit = 'px',
  scale = 2,
  className = '',
  id,
}: CalibrationSheetProps) {
  const stickers = resolveStickers(pageConfig);
  const calX = (mm: number) =>
    formatLength(calibrateMm(mm, calibration.horizontalOffset, calibration.scaleX), unit, scale);
  const calY = (mm: number) =>
    formatLength(calibrateMm(mm, calibration.verticalOffset, calibration.scaleY), unit, scale);
  const len = (mm: number) => formatLength(mm, unit, scale);

  return (
    <div
      id={id}
      className={`relative bg-white ${className}`}
      style={{
        width: calX(pageConfig.pageWidth),
        height: calY(pageConfig.pageHeight),
        boxShadow: unit === 'px' ? '0 4px 24px rgba(0,0,0,0.12)' : undefined,
      }}
    >
      {/* Page border */}
      <div
        className="pointer-events-none absolute inset-0 border-2 border-red-500"
        style={{ boxSizing: 'border-box' }}
      />

      {/* Printable area border */}
      <div
        className="pointer-events-none absolute border border-dashed border-blue-500"
        style={{
          left: calX(pageConfig.leftMargin),
          top: calY(pageConfig.topMargin),
          width: len(pageConfig.printableAreaWidth),
          height: len(pageConfig.printableAreaHeight),
        }}
      />

      {stickers.map((sticker) => {
        const broad = sticker.broadArea;
        const tail = sticker.tailArea;
        const cx = broad.x + broad.width / 2;
        const cy = broad.y + broad.height / 2;
        const cross = 2;

        return (
          <div key={sticker.stickerNumber} className="pointer-events-none absolute">
            {/* Tail outline */}
            <div
              className="absolute bg-slate-200"
              style={{
                left: calX(tail.x),
                top: calY(tail.y),
                width: len(tail.width),
                height: len(tail.height),
              }}
            />
            {/* Broad outline */}
            <div
              className="absolute border border-slate-600 bg-white"
              style={{
                left: calX(broad.x),
                top: calY(broad.y),
                width: len(broad.width),
                height: len(broad.height),
              }}
            />
            {/* Section A/B dividers */}
            <div
              className="absolute border-r border-dashed border-pink-400"
              style={{
                left: calX(sticker.sectionA.x + sticker.sectionA.width),
                top: calY(sticker.sectionA.y),
                height: len(sticker.sectionA.height),
              }}
            />
            {/* Crosshair at broad center */}
            <div
              className="absolute bg-red-500"
              style={{
                left: calX(cx - cross / 2),
                top: calY(cy),
                width: len(cross),
                height: unit === 'mm' ? '0.15mm' : '1px',
              }}
            />
            <div
              className="absolute bg-red-500"
              style={{
                left: calX(cx),
                top: calY(cy - cross / 2),
                width: unit === 'mm' ? '0.15mm' : '1px',
                height: len(cross),
              }}
            />
            {/* Sticker number */}
            <span
              className="absolute font-bold text-red-600"
              style={{
                left: calX(broad.x + 0.5),
                top: calY(broad.y + 0.5),
                fontSize: unit === 'mm' ? '2.5mm' : `${8 * scale}px`,
              }}
            >
              {sticker.stickerNumber}
            </span>
          </div>
        );
      })}
    </div>
  );
}
