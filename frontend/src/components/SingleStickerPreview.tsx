import type { PageConfig, LayoutConfig, LabelData, CalibrationSettings, LayoutField } from '../types';
import {
  resolveFieldValue,
  isJewelleryTemplate,
  getStickerDefinition,
  getFieldAbsoluteRect,
  getEffectivePageConfig,
} from '../types';
import { resolveStickers } from '../lib/geometryBuilder';
import { mmToPx } from '../lib/units';

interface SingleStickerPreviewProps {
  pageConfig: PageConfig;
  layoutConfig: LayoutConfig;
  labelData: LabelData;
  brandName?: string;
  logoUrl?: string;
  calibration?: CalibrationSettings;
  title?: string;
}

const PREVIEW_SCALE = 4;

function renderFieldAt(
  field: LayoutField,
  labelData: LabelData,
  originX: number,
  originY: number,
  brandName?: string,
  logoUrl?: string
) {
  let value = resolveFieldValue(field, labelData);
  if (field.type === 'staticBranding' && brandName) value = brandName;

  const left = mmToPx(originX + field.x, PREVIEW_SCALE);
  const top = mmToPx(originY + field.y, PREVIEW_SCALE);

  if (field.type === 'logo' && (value || logoUrl)) {
    return (
      <img
        key={field.id}
        src={value || logoUrl}
        alt=""
        className="absolute object-contain"
        style={{
          left,
          top,
          width: mmToPx(field.width, PREVIEW_SCALE),
          height: mmToPx(field.height, PREVIEW_SCALE),
        }}
      />
    );
  }

  if (!value && field.type !== 'staticBranding' && field.type !== 'text') return null;

  return (
    <div
      key={field.id}
      className="absolute overflow-hidden leading-tight text-slate-900"
      style={{
        left,
        top,
        width: mmToPx(field.width, PREVIEW_SCALE),
        height: mmToPx(field.height, PREVIEW_SCALE),
        fontSize: field.fontSize * PREVIEW_SCALE * 0.35,
        fontWeight: field.bold ? 'bold' : 'normal',
        fontStyle: field.italic ? 'italic' : 'normal',
        textAlign: field.alignment,
      }}
    >
      {value}
    </div>
  );
}

export function SingleStickerPreview({
  pageConfig,
  layoutConfig,
  labelData,
  brandName,
  logoUrl,
  title = 'Your Label Will Look Like This',
}: SingleStickerPreviewProps) {
  const effectiveConfig = getEffectivePageConfig(pageConfig);
  const isJewellery = isJewelleryTemplate(effectiveConfig);
  const geo = effectiveConfig.geometry;
  const sampleSticker = isJewellery
    ? getStickerDefinition(effectiveConfig, 1) ?? resolveStickers(effectiveConfig)[0]
    : undefined;

  if (isJewellery && sampleSticker && geo) {
    const totalW = geo.broadWidth + geo.tailWidth;
    const totalH = geo.broadHeight;
    const w = mmToPx(totalW, PREVIEW_SCALE);
    const h = mmToPx(totalH, PREVIEW_SCALE);

    return (
      <div className="text-center">
        <p className="mb-4 text-xl font-bold text-slate-800">{title}</p>
        <div className="inline-block rounded-2xl bg-slate-100 p-6 shadow-inner">
          <div
            className="relative overflow-visible rounded-xl border-2 border-slate-400 bg-slate-200 shadow-lg"
            style={{ width: w, height: h }}
          >
            <div
              className="absolute rounded bg-slate-300"
              style={{
                left: mmToPx(sampleSticker.tailArea.x - sampleSticker.x, PREVIEW_SCALE),
                top: mmToPx(sampleSticker.tailArea.y - sampleSticker.y, PREVIEW_SCALE),
                width: mmToPx(sampleSticker.tailArea.width, PREVIEW_SCALE),
                height: mmToPx(sampleSticker.tailArea.height, PREVIEW_SCALE),
              }}
            />
            <div
              className="absolute rounded bg-white"
              style={{
                left: mmToPx(sampleSticker.broadArea.x - sampleSticker.x, PREVIEW_SCALE),
                top: mmToPx(sampleSticker.broadArea.y - sampleSticker.y, PREVIEW_SCALE),
                width: mmToPx(sampleSticker.broadArea.width, PREVIEW_SCALE),
                height: mmToPx(sampleSticker.broadArea.height, PREVIEW_SCALE),
              }}
            >
              <div
                className="absolute top-0 border-r border-dashed border-slate-300"
                style={{
                  left: mmToPx(sampleSticker.sectionA.width, PREVIEW_SCALE),
                  height: '100%',
                }}
              />
            </div>
            {layoutConfig.fields.map((field) => {
              const rect = getFieldAbsoluteRect(field, sampleSticker);
              return renderFieldAt(
                field,
                labelData,
                rect.x - sampleSticker.x,
                rect.y - sampleSticker.y,
                brandName,
                logoUrl
              );
            })}
          </div>
          <p className="mt-3 text-base text-slate-500">
            Broad area: {geo.broadWidth} × {geo.broadHeight} mm (Section A + B)
          </p>
        </div>
      </div>
    );
  }

  const w = mmToPx(effectiveConfig.stickerWidth, PREVIEW_SCALE);
  const h = mmToPx(effectiveConfig.stickerHeight, PREVIEW_SCALE);

  return (
    <div className="text-center">
      <p className="mb-4 text-xl font-bold text-slate-800">{title}</p>
      <div className="inline-block rounded-2xl bg-slate-100 p-6 shadow-inner">
        <div
          className="relative overflow-hidden rounded-xl border-2 border-slate-400 bg-white shadow-lg"
          style={{ width: w, height: h }}
        >
          {layoutConfig.fields.map((field) =>
            renderFieldAt(field, labelData, 0, 0, brandName, logoUrl)
          )}
        </div>
        <p className="mt-3 text-base text-slate-500">
          Actual sticker size: {effectiveConfig.stickerWidth} × {effectiveConfig.stickerHeight} mm
        </p>
      </div>
    </div>
  );
}
