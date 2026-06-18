import mongoose, { Schema, Document } from 'mongoose';
import type { LabelData } from '../types/index.js';

export interface ILabel extends Document {
  name: string;
  data: LabelData;
  createdAt: Date;
  updatedAt: Date;
}

const labelDataSchema = new Schema<LabelData>(
  {
    productName: { type: String },
    designNumber: { type: String },
    category: { type: String },
    weight: { type: String },
    purity: { type: String },
    price: { type: String },
    makingCharge: { type: String },
    sku: { type: String },
    notes: { type: String },
    storeName: { type: String },
    barcode: { type: String },
    qrCode: { type: String },
    customField1: { type: String },
    customField2: { type: String },
    customField3: { type: String },
  },
  { _id: false }
);

const labelSchema = new Schema<ILabel>(
  {
    name: { type: String, required: true, trim: true },
    data: { type: labelDataSchema, required: true, default: {} },
  },
  { timestamps: true }
);

export const Label = mongoose.model<ILabel>('Label', labelSchema);
