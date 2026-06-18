import { Template } from '../models/Template.js';
import { Layout } from '../models/Layout.js';
import { Settings } from '../models/Settings.js';
import { buildInterlockPageConfig } from '../types/index.js';

export const JEWELLERY_SHEET_NAME = 'Jewellery Tag Sheet 14';
export const JEWELLERY_LAYOUT_NAME = 'Default Jewellery Label';

export function buildJewellerySheetConfig() {
  return buildInterlockPageConfig(137, 172, {
    stickerCount: 14,
    topMargin: 13,
    bottomMargin: 13,
    leftMargin: 5,
    rightMargin: 5,
    broadWidth: 62,
    broadHeight: 9,
    tailWidth: 61,
    tailHeight: 5,
    sectionA: { x: 0, y: 0, width: 31.1, height: 9 },
    sectionB: { x: 31.1, y: 0, width: 30.9, height: 9 },
    verticalPitch: 9,
  });
}

/** Ensures the single predefined jewellery sheet exists and is set as shop default */
export async function ensureJewellerySheet(): Promise<{ templateId: string; layoutId: string }> {
  const config = buildJewellerySheetConfig();

  let template = await Template.findOne({ name: JEWELLERY_SHEET_NAME });
  if (!template) {
    template = await Template.create({
      name: JEWELLERY_SHEET_NAME,
      description: '137×172 mm interlocking jewellery sheet — 14 stickers',
      config,
    });
  } else {
    template.config = config;
    template.description = '137×172 mm interlocking jewellery sheet — 14 stickers';
    await template.save();
  }

  let layout = await Layout.findOne({ name: JEWELLERY_LAYOUT_NAME, templateId: template._id });
  if (!layout) {
    layout = await Layout.create({
      name: JEWELLERY_LAYOUT_NAME,
      templateId: template._id,
      config: { fields: [] },
    });
  }

  await Settings.findOneAndUpdate(
    { key: 'global' },
    {
      $set: {
        'shop.defaultTemplateId': template._id,
        'shop.defaultLayoutId': layout._id,
      },
    },
    { upsert: true }
  );

  return {
    templateId: String(template._id),
    layoutId: String(layout._id),
  };
}
