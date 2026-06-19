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
  showDimensions?: boolean;
  showRulers?: boolean;
}

function DimensionLabel({
  left,
  top,
  text,
  unit,
  scale,
  color = 'text-red-600',
}: {
  left: string;
  top: string;
  text: string;
  unit: RenderUnit;
  scale: number;
  color?: string;
}) {
  return (
    <span
      className={`pointer-events-none absolute font-mono font-semibold ${color}`}
      style={{
        left,
        top,
        fontSize: unit === 'mm' ? '1.8mm' : `${7 * scale}px`,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}

export function CalibrationSheetRenderer({
  pageConfig,
  calibration,
  unit = 'px',
  scale = 2,
  className = '',
  id,
  showDimensions = true,
  showRulers = true,
}: CalibrationSheetProps) {
  const stickers = resolveStickers(pageConfig);
  const calX = (mm: number) =>
    formatLength(calibrateMm(mm, calibration.horizontalOffset, calibration.scaleX), unit, scale);
  const calY = (mm: number) =>
    formatLength(calibrateMm(mm, calibration.verticalOffset, calibration.scaleY), unit, scale);
  const len = (mm: number) => formatLength(mm, unit, scale);

  const rulerStep = 10;
  const rulerMarks: number[] = [];
  for (let mm = 0; mm <= pageConfig.pageWidth; mm += rulerStep) rulerMarks.push(mm);
  const rulerMarksY: number[] = [];
  for (let mm = 0; mm <= pageConfig.pageHeight; mm += rulerStep) rulerMarksY.push(mm);

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
      {/* Page boundary */}
      <div
        className="pointer-events-none absolute inset-0 border-2 border-red-500"
        style={{ boxSizing: 'border-box' }}
      />
      {showDimensions && (
        <DimensionLabel
          left={calX(pageConfig.pageWidth / 2)}
          top={calY(0.5)}
          text={`PAGE ${pageConfig.pageWidth}×${pageConfig.pageHeight} mm`}
          unit={unit}
          scale={scale}
        />
      )}

      {/* Printable area boundary */}
      <div
        className="pointer-events-none absolute border border-dashed border-blue-500"
        style={{
          left: calX(pageConfig.leftMargin),
          top: calY(pageConfig.topMargin),
          width: len(pageConfig.printableAreaWidth),
          height: len(pageConfig.printableAreaHeight),
        }}
      />
      {showDimensions && (
        <DimensionLabel
          left={calX(pageConfig.leftMargin + 1)}
          top={calY(pageConfig.topMargin + 1)}
          text={`Printable ${pageConfig.printableAreaWidth.toFixed(1)}×${pageConfig.printableAreaHeight.toFixed(1)} mm`}
          unit={unit}
          scale={scale}
          color="text-blue-600"
        />
      )}

      {/* Horizontal ruler */}
      {showRulers &&
        rulerMarks.map((mm) => (
          <div key={`rx-${mm}`} className="pointer-events-none absolute">
            <div
              className="absolute bg-slate-400"
              style={{
                left: calX(mm),
                top: calY(0),
                width: unit === 'mm' ? '0.12mm' : '1px',
                height: len(mm % 50 === 0 ? 4 : 2),
              }}
            />
            {mm % 20 === 0 && (
              <span
                className="absolute text-slate-500"
                style={{
                  left: calX(mm + 0.5),
                  top: calY(4.5),
                  fontSize: unit === 'mm' ? '1.5mm' : `${6 * scale}px`,
                }}
              >
                {mm}
              </span>
            )}
          </div>
        ))}

      {/* Vertical ruler */}
      {showRulers &&
        rulerMarksY.map((mm) => (
          <div key={`ry-${mm}`} className="pointer-events-none absolute">
            <div
              className="absolute bg-slate-400"
              style={{
                left: calX(0),
                top: calY(mm),
                height: unit === 'mm' ? '0.12mm' : '1px',
                width: len(mm % 50 === 0 ? 4 : 2),
              }}
            />
            {mm % 20 === 0 && (
              <span
                className="absolute text-slate-500"
                style={{
                  left: calX(4.5),
                  top: calY(mm + 0.5),
                  fontSize: unit === 'mm' ? '1.5mm' : `${6 * scale}px`,
                }}
              >
                {mm}
              </span>
            )}
          </div>
        ))}

      {stickers.map((sticker) => {
        const broad = sticker.broadArea;
        const tail = sticker.tailArea;
        const cx = broad.x + broad.width / 2;
        const cy = broad.y + broad.height / 2;
        const cross = 3;

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
              className="absolute border border-slate-600 bg-white/50"
              style={{
                left: calX(broad.x),
                top: calY(broad.y),
                width: len(broad.width),
                height: len(broad.height),
              }}
            />
            {/* Section A */}
            <div
              className="absolute border border-dashed border-pink-400 bg-pink-50/30"
              style={{
                left: calX(sticker.sectionA.x),
                top: calY(sticker.sectionA.y),
                width: len(sticker.sectionA.width),
                height: len(sticker.sectionA.height),
              }}
            />
            {/* Section B */}
            <div
              className="absolute border border-dashed border-purple-400 bg-purple-50/30"
              style={{
                left: calX(sticker.sectionB.x),
                top: calY(sticker.sectionB.y),
                width: len(sticker.sectionB.width),
                height: len(sticker.sectionB.height),
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
            {showDimensions && sticker.stickerNumber <= 3 && (
              <DimensionLabel
                left={calX(broad.x + broad.width / 2)}
                top={calY(broad.y + broad.height + 0.3)}
                text={`${broad.width}×${broad.height}`}
                unit={unit}
                scale={scale}
                color="text-slate-600"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
