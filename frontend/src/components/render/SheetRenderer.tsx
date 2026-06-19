import type {
  PageConfig,
  LayoutConfig,
  LabelData,
  CalibrationSettings,
  LayoutField,
  Category,
  Layout,
} from '../../types';
import {
  getPositionCoordinates,
  getTotalPositions,
  resolveFieldValue,
  isJewelleryTemplate,
  getEffectivePageConfig,
} from '../../types';
import { mmToPx, applyCalibration, PREVIEW_SCALE, type RenderUnit } from '../../lib/units';
import { JewellerySheetRenderer } from './JewellerySheetRenderer';

export interface SheetRenderOptions {
  pageConfig: PageConfig;
  layoutConfig: LayoutConfig;
  calibration: CalibrationSettings;
  usedPositions: number[];
  printPositions: number[];
  positionLabelMap: Array<{ position: number; label: LabelData | null; categoryId?: string }>;
  brandName?: string;
  logoUrl?: string;
  templateId?: string;
  layouts?: Layout[];
  /** @deprecated use shared pipeline via templateId/layouts/categoriesById */
  resolveFieldsForPosition?: (position: number, categoryId?: string) => LayoutField[];
  categoriesById?: Map<string, Category>;
  showGrid?: boolean;
  showPositionNumbers?: boolean;
  showPrintableArea?: boolean;
  scale?: number;
  unit?: RenderUnit;
  className?: string;
  id?: string;
}

export function SheetRenderer({
  pageConfig,
  layoutConfig,
  calibration,
  usedPositions,
  printPositions,
  positionLabelMap,
  brandName,
  logoUrl,
  templateId,
  layouts,
  categoriesById,
  showGrid = true,
  showPositionNumbers = true,
  showPrintableArea = false,
  scale = PREVIEW_SCALE,
  unit = 'px',
  className = '',
  id,
}: SheetRenderOptions) {
  const effectiveConfig = getEffectivePageConfig(pageConfig);

  if (isJewelleryTemplate(effectiveConfig)) {
    return (
      <JewellerySheetRenderer
        pageConfig={effectiveConfig}
        layoutConfig={layoutConfig}
        calibration={calibration}
        usedPositions={usedPositions}
        printPositions={printPositions}
        positionLabelMap={positionLabelMap}
        brandName={brandName}
        logoUrl={logoUrl}
        templateId={templateId}
        layouts={layouts}
        categoriesById={categoriesById}
        showGrid={showGrid}
        showPositionNumbers={showPositionNumbers}
        showPrintableArea={showPrintableArea}
        scale={scale}
        unit={unit}
        className={className}
        id={id}
      />
    );
  }

  const total = getTotalPositions(effectiveConfig);
  const pageW = mmToPx(effectiveConfig.pageWidth, scale);
  const pageH = mmToPx(effectiveConfig.pageHeight, scale);
  const printSet = new Set(printPositions);
  const usedSet = new Set(usedPositions);
  const labelMap = new Map(
    positionLabelMap.map((p) => [p.position, p.label])
  );

  const calX = (mm: number) =>
    mmToPx(applyCalibration(mm, calibration.horizontalOffset, calibration.scaleX), scale);
  const calY = (mm: number) =>
    mmToPx(applyCalibration(mm, calibration.verticalOffset, calibration.scaleY), scale);

  const stickers = Array.from({ length: total }, (_, i) => {
    const position = i + 1;
    const coords = getPositionCoordinates(position, effectiveConfig);
    const isUsed = usedSet.has(position);
    const isSelected = printSet.has(position);
    const label = labelMap.get(position);

    let bg = '#ffffff';
    if (isUsed) bg = '#cbd5e1';
    else if (isSelected) bg = '#4ade80';

    return (
      <div
        key={position}
        className="absolute box-border"
        style={{
          left: calX(coords.x),
          top: calY(coords.y),
          width: mmToPx(effectiveConfig.stickerWidth, scale),
          height: mmToPx(effectiveConfig.stickerHeight, scale),
          border: showGrid ? '1px solid #94a3b8' : 'none',
          backgroundColor: bg,
        }}
      >
        {showPositionNumbers && (
          <span
            className="absolute left-0.5 top-0.5 font-medium text-slate-500"
            style={{ fontSize: Math.max(7, 7 * scale) }}
          >
            {position}
          </span>
        )}
        {label &&
          layoutConfig.fields.map((field) => {
            let value = resolveFieldValue(field, label);
            if (field.type === 'staticBranding' && brandName) {
              value = brandName;
            }
            if (field.type === 'logo' && (value || logoUrl)) {
              return (
                <img
                  key={field.id}
                  src={value || logoUrl}
                  alt=""
                  className="absolute object-contain"
                  style={{
                    left: mmToPx(field.x, scale),
                    top: mmToPx(field.y, scale),
                    width: mmToPx(field.width, scale),
                    height: mmToPx(field.height, scale),
                  }}
                />
              );
            }
            if (!value && field.type !== 'staticBranding' && field.type !== 'text') {
              return null;
            }
            return (
              <div
                key={field.id}
                className="absolute overflow-hidden leading-tight text-slate-900"
                style={{
                  left: mmToPx(field.x, scale),
                  top: mmToPx(field.y, scale),
                  width: mmToPx(field.width, scale),
                  height: mmToPx(field.height, scale),
                  fontSize: field.fontSize * scale * 0.35,
                  fontWeight: field.bold ? 'bold' : 'normal',
                  fontStyle: field.italic ? 'italic' : 'normal',
                  textAlign: field.alignment,
                }}
              >
                {value}
              </div>
            );
          })}
      </div>
    );
  });

  return (
    <div
      id={id}
      className={`relative bg-white ${className}`}
      style={{
        width: pageW,
        height: pageH,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      }}
    >
      {showPrintableArea && (
        <div
          className="pointer-events-none absolute border border-dashed border-amber-400/60"
          style={{
            left: calX(effectiveConfig.leftMargin),
            top: calY(effectiveConfig.topMargin),
            width: mmToPx(effectiveConfig.printableAreaWidth, scale),
            height: mmToPx(effectiveConfig.printableAreaHeight, scale),
          }}
        />
      )}
      {stickers}
    </div>
  );
}
