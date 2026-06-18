import type { LayoutField, LabelData } from '../../types';
import {
  getFieldAbsoluteRect,
  resolveFieldValue,
  resolveProductFieldValue,
  formatPrintFieldLine,
  isJewelleryTemplate,
} from '../../types';
import type { Category } from '../../types';
import { resolveStickers } from '../../lib/geometryBuilder';
import {
  mmToPx,
  calibrateMm,
  formatLength,
  PREVIEW_SCALE,
  LABEL_FONT_MM_SCALE,
  type RenderUnit,
} from '../../lib/units';
import type { SheetRenderOptions } from './SheetRenderer';

function renderField(
  field: LayoutField,
  label: LabelData,
  sticker: import('../../types').StickerDefinition,
  unit: RenderUnit,
  scale: number,
  calX: (mm: number) => string,
  calY: (mm: number) => string,
  len: (mm: number) => string,
  brandName?: string,
  logoUrl?: string,
  category?: Category
) {
  const rect = getFieldAbsoluteRect(field, sticker);
  let value = category
    ? resolveProductFieldValue(field, label, category, brandName)
    : resolveFieldValue(field, label);
  if (field.type === 'staticBranding' && brandName) value = brandName;
  value = formatPrintFieldLine(field, value, category);

  if (field.type === 'logo' && (value || logoUrl)) {
    return (
      <img
        key={field.id}
        src={value || logoUrl}
        alt=""
        className="absolute object-contain"
        style={{
          left: calX(rect.x),
          top: calY(rect.y),
          width: len(rect.width),
          height: len(rect.height),
          transform: field.rotation ? `rotate(${field.rotation}deg)` : undefined,
        }}
      />
    );
  }

  if (!value && field.type !== 'staticBranding' && field.type !== 'text') return null;

  const fontSize =
    unit === 'mm'
      ? `${field.fontSize * LABEL_FONT_MM_SCALE}mm`
      : `${field.fontSize * scale * LABEL_FONT_MM_SCALE}px`;

  return (
    <div
      key={field.id}
      className="absolute overflow-hidden leading-tight text-slate-900"
      style={{
        left: calX(rect.x),
        top: calY(rect.y),
        width: len(rect.width),
        height: len(rect.height),
        fontSize,
        fontWeight: field.bold ? 'bold' : 'normal',
        fontStyle: field.italic ? 'italic' : 'normal',
        textAlign: field.alignment,
        lineHeight: field.lineSpacing ? `${field.lineSpacing}` : undefined,
        transform: field.rotation ? `rotate(${field.rotation}deg)` : undefined,
        transformOrigin: 'top left',
      }}
    >
      {value}
    </div>
  );
}

export function JewellerySheetRenderer({
  pageConfig,
  layoutConfig,
  calibration,
  usedPositions,
  printPositions,
  positionLabelMap,
  brandName,
  logoUrl,
  resolveFieldsForPosition,
  categoriesById,
  showGrid = true,
  showPositionNumbers = true,
  showPrintableArea = false,
  scale = PREVIEW_SCALE,
  unit = 'px',
  className = '',
  id,
}: SheetRenderOptions) {
  const stickers = resolveStickers(pageConfig);
  if (!isJewelleryTemplate(pageConfig) || !stickers.length) return null;

  const printSet = new Set(printPositions);
  const usedSet = new Set(usedPositions);
  const labelMap = new Map(positionLabelMap.map((p) => [p.position, p.label]));
  const categoryMap = new Map(
    positionLabelMap.filter((p) => p.categoryId).map((p) => [p.position, p.categoryId!])
  );

  const calX = (mm: number) =>
    formatLength(calibrateMm(mm, calibration.horizontalOffset, calibration.scaleX), unit, scale);
  const calY = (mm: number) =>
    formatLength(calibrateMm(mm, calibration.verticalOffset, calibration.scaleY), unit, scale);
  const len = (mm: number) => formatLength(mm, unit, scale);

  const stickerElements = stickers.map((sticker) => {
    const position = sticker.stickerNumber;
    const isUsed = usedSet.has(position);
    const isSelected = printSet.has(position);
    const label = labelMap.get(position);

    let broadBg = '#ffffff';
    if (isUsed) broadBg = '#cbd5e1';
    else if (isSelected) broadBg = '#4ade80';

    const tail = sticker.tailArea;
    const broad = sticker.broadArea;

    const numSize = unit === 'mm' ? '2mm' : `${Math.max(6, 5 * scale)}px`;

    return (
      <div key={position} className="absolute" style={{ pointerEvents: 'none' }}>
        <div
          className="absolute"
          style={{
            left: calX(tail.x),
            top: calY(tail.y),
            width: len(tail.width),
            height: len(tail.height),
            backgroundColor: '#e2e8f0',
            borderRadius: unit === 'mm' ? '0.8mm' : `${mmToPx(0.8, scale)}px`,
          }}
        />
        <div
          className="absolute"
          style={{
            left: calX(broad.x),
            top: calY(broad.y),
            width: len(broad.width),
            height: len(broad.height),
            backgroundColor: broadBg,
            border: showGrid ? '0.1mm solid #64748b' : 'none',
            borderRadius: unit === 'mm' ? '1mm' : `${mmToPx(1, scale)}px`,
          }}
        >
          {showGrid && (
            <div
              className="absolute top-0 border-r border-dashed border-slate-400/50"
              style={{
                left: len(sticker.sectionA.x - broad.x + sticker.sectionA.width),
                height: '100%',
              }}
            />
          )}
        </div>
        {showPositionNumbers && (
          <span
            className="absolute font-bold text-slate-600"
            style={{
              left: calX(broad.x + 0.5),
              top: calY(broad.y + 0.3),
              fontSize: numSize,
            }}
          >
            {position}
          </span>
        )}
        {label &&
          (resolveFieldsForPosition
            ? resolveFieldsForPosition(position, categoryMap.get(position))
            : layoutConfig.fields
          ).map((field) =>
            renderField(
              field,
              label,
              sticker,
              unit,
              scale,
              calX,
              calY,
              len,
              brandName,
              logoUrl,
              categoryMap.get(position)
                ? categoriesById?.get(categoryMap.get(position)!)
                : undefined
            )
          )}
      </div>
    );
  });

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
      {showPrintableArea && (
        <div
          className="pointer-events-none absolute border border-dashed border-amber-400/60"
          style={{
            left: calX(pageConfig.leftMargin),
            top: calY(pageConfig.topMargin),
            width: len(pageConfig.printableAreaWidth),
            height: len(pageConfig.printableAreaHeight),
          }}
        />
      )}
      {stickerElements}
    </div>
  );
}
