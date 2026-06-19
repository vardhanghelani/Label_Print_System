import type { PageConfig, LabelData, CalibrationSettings, Category, Layout } from '../types';
import { isJewelleryTemplate, getStickerDefinition, getEffectivePageConfig, DEFAULT_CALIBRATION } from '../types';
import { resolveStickers } from '../lib/geometryBuilder';
import { buildPrintTextItems } from '../lib/labelRenderPipeline';
import { mmToPx, LABEL_FONT_MM_SCALE } from '../lib/units';
import { PreviewFrame } from './PreviewFrame';

interface SingleStickerPreviewProps {
  pageConfig: PageConfig;
  labelData: LabelData;
  brandName?: string;
  category?: Category;
  calibration?: CalibrationSettings;
  layouts?: Layout[];
  templateId?: string;
  stickerNumber?: number;
  title?: string;
}

const PREVIEW_SCALE = 4;

export function SingleStickerPreview({
  pageConfig,
  labelData,
  brandName,
  category,
  calibration = DEFAULT_CALIBRATION,
  layouts,
  templateId,
  stickerNumber = 1,
  title = 'Your Label Will Look Like This',
}: SingleStickerPreviewProps) {
  const effectiveConfig = getEffectivePageConfig(pageConfig);
  const isJewellery = isJewelleryTemplate(effectiveConfig);
  const geo = effectiveConfig.geometry;
  const sampleSticker = isJewellery
    ? getStickerDefinition(effectiveConfig, stickerNumber) ??
      resolveStickers(effectiveConfig)[stickerNumber - 1]
    : undefined;

  const printResult = buildPrintTextItems({
    pageConfig: effectiveConfig,
    calibration,
    printPositions: [stickerNumber],
    positionLabelMap: [
      {
        position: stickerNumber,
        label: labelData,
        categoryId: category?._id,
      },
    ],
    categoriesById: category ? new Map([[category._id, category]]) : undefined,
    layouts,
    templateId,
    brandName,
  });

  const printItems = printResult.items.filter((item) => item.stickerNumber === stickerNumber);

  if (isJewellery && sampleSticker && geo) {
    const totalW = geo.broadWidth + geo.tailWidth;
    const totalH = geo.broadHeight;
    const w = mmToPx(totalW, PREVIEW_SCALE);
    const h = mmToPx(totalH, PREVIEW_SCALE);
    const originX = sampleSticker.x;
    const originY = sampleSticker.y;

    return (
      <div className="preview-frame card p-4">
        <p className="preview-frame-label">{title}</p>
        <PreviewFrame contentWidth={w} contentHeight={h} maxHeight={220}>
          <div
            className="relative overflow-hidden rounded-xl border-2 border-slate-400 bg-slate-200"
            style={{ width: w, height: h }}
          >
            <div
              className="absolute rounded bg-slate-300"
              style={{
                left: mmToPx(sampleSticker.tailArea.x - originX, PREVIEW_SCALE),
                top: mmToPx(sampleSticker.tailArea.y - originY, PREVIEW_SCALE),
                width: mmToPx(sampleSticker.tailArea.width, PREVIEW_SCALE),
                height: mmToPx(sampleSticker.tailArea.height, PREVIEW_SCALE),
              }}
            />
            <div
              className="absolute rounded bg-white"
              style={{
                left: mmToPx(sampleSticker.broadArea.x - originX, PREVIEW_SCALE),
                top: mmToPx(sampleSticker.broadArea.y - originY, PREVIEW_SCALE),
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
            {printItems.map((item) => {
              const field = item.field;
              return (
                <div
                  key={item.fieldId}
                  className="absolute overflow-hidden leading-tight text-slate-900"
                  style={{
                    left: mmToPx(item.rect.x - originX, PREVIEW_SCALE),
                    top: mmToPx(item.rect.y - originY, PREVIEW_SCALE),
                    width: mmToPx(item.rect.width, PREVIEW_SCALE),
                    height: mmToPx(item.rect.height, PREVIEW_SCALE),
                    fontSize: field.fontSize * PREVIEW_SCALE * LABEL_FONT_MM_SCALE,
                    fontWeight: field.bold ? 'bold' : 'normal',
                    fontStyle: field.italic ? 'italic' : 'normal',
                    textAlign: field.alignment,
                  }}
                >
                  {item.text}
                </div>
              );
            })}
          </div>
        </PreviewFrame>
        <p className="mt-2 text-center text-sm text-slate-500">
          Broad area: {geo.broadWidth} × {geo.broadHeight} mm (Section A + B)
        </p>
      </div>
    );
  }

  const w = mmToPx(effectiveConfig.stickerWidth, PREVIEW_SCALE);
  const h = mmToPx(effectiveConfig.stickerHeight, PREVIEW_SCALE);

  return (
    <div className="preview-frame card p-4">
      <p className="preview-frame-label">{title}</p>
      <PreviewFrame contentWidth={w} contentHeight={h} maxHeight={220}>
        <div
          className="relative overflow-hidden rounded-xl border-2 border-slate-400 bg-white"
          style={{ width: w, height: h }}
        >
          {printItems.map((item) => {
            const field = item.field;
            return (
              <div
                key={item.fieldId}
                className="absolute overflow-hidden leading-tight text-slate-900"
                style={{
                  left: mmToPx(item.rect.x, PREVIEW_SCALE),
                  top: mmToPx(item.rect.y, PREVIEW_SCALE),
                  width: mmToPx(item.rect.width, PREVIEW_SCALE),
                  height: mmToPx(item.rect.height, PREVIEW_SCALE),
                  fontSize: field.fontSize * PREVIEW_SCALE * LABEL_FONT_MM_SCALE,
                  fontWeight: field.bold ? 'bold' : 'normal',
                  fontStyle: field.italic ? 'italic' : 'normal',
                  textAlign: field.alignment,
                }}
              >
                {item.text}
              </div>
            );
          })}
        </div>
      </PreviewFrame>
      <p className="mt-2 text-center text-sm text-slate-500">
        Actual sticker size: {effectiveConfig.stickerWidth} × {effectiveConfig.stickerHeight} mm
      </p>
    </div>
  );
}
