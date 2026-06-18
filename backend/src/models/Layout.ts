import mongoose, { Schema, Document } from 'mongoose';
import type { LayoutConfig } from '../types/index.js';

export interface ILayout extends Document {
  name: string;
  templateId: mongoose.Types.ObjectId;
  config: LayoutConfig;
  createdAt: Date;
  updatedAt: Date;
}

const layoutFieldSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    label: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    fontSize: { type: Number, required: true, default: 10 },
    bold: { type: Boolean, default: false },
    italic: { type: Boolean, default: false },
    alignment: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
    section: { type: String, enum: ['A', 'B', 'full'] },
    rotation: { type: Number },
    lineSpacing: { type: Number },
    fieldKey: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    staticText: { type: String },
    logoUrl: { type: String },
  },
  { _id: false }
);

const layoutSchema = new Schema<ILayout>(
  {
    name: { type: String, required: true, trim: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
    config: {
      categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
      fields: { type: [layoutFieldSchema], default: [] },
    },
  },
  { timestamps: true }
);

export const Layout = mongoose.model<ILayout>('Layout', layoutSchema);
