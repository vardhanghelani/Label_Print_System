import mongoose, { Schema, Document } from 'mongoose';
import type { CalibrationSettings } from '../types/index.js';
import { DEFAULT_CALIBRATION } from '../types/index.js';

export type DefaultSheetBehavior = 'newSheet' | 'continueSheet';

export interface ShopSettings {
  brandName: string;
  logoUrl?: string;
  defaultTemplateId?: mongoose.Types.ObjectId;
  defaultLayoutId?: mongoose.Types.ObjectId;
  defaultSheetBehavior: DefaultSheetBehavior;
}

export interface ISettings extends Document {
  key: string;
  calibration: CalibrationSettings;
  shop: ShopSettings;
  adminPassword: string;
  updatedAt: Date;
}

const calibrationSchema = new Schema<CalibrationSettings>(
  {
    horizontalOffset: { type: Number, default: DEFAULT_CALIBRATION.horizontalOffset },
    verticalOffset: { type: Number, default: DEFAULT_CALIBRATION.verticalOffset },
    scaleX: { type: Number, default: DEFAULT_CALIBRATION.scaleX },
    scaleY: { type: Number, default: DEFAULT_CALIBRATION.scaleY },
  },
  { _id: false }
);

const shopSchema = new Schema<ShopSettings>(
  {
    brandName: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    defaultTemplateId: { type: Schema.Types.ObjectId, ref: 'Template' },
    defaultLayoutId: { type: Schema.Types.ObjectId, ref: 'Layout' },
    defaultSheetBehavior: {
      type: String,
      enum: ['newSheet', 'continueSheet'],
      default: 'newSheet',
    },
  },
  { _id: false }
);

const settingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    calibration: { type: calibrationSchema, default: () => ({ ...DEFAULT_CALIBRATION }) },
    shop: {
      type: shopSchema,
      default: () => ({ brandName: '', defaultSheetBehavior: 'newSheet' }),
    },
    adminPassword: { type: String, default: '' },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
