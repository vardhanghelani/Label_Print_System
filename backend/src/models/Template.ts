import mongoose, { Schema, Document } from 'mongoose';
import type { PageConfig } from '../types/index.js';

export interface ITemplate extends Document {
  name: string;
  description?: string;
  config: PageConfig;
  createdAt: Date;
  updatedAt: Date;
}

const rectSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { _id: false }
);

const stickerSchema = new Schema(
  {
    stickerNumber: { type: Number, required: true },
    orientation: { type: String, enum: ['broad-left', 'broad-right'], required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    broadArea: { type: rectSchema, required: true },
    tailArea: { type: rectSchema, required: true },
    sectionA: { type: rectSchema, required: true },
    sectionB: { type: rectSchema, required: true },
    printableArea: { type: rectSchema, required: true },
  },
  { _id: false }
);

const sectionSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { _id: false }
);

const geometrySchema = new Schema(
  {
    stickerCount: { type: Number, required: true },
    topMargin: { type: Number, required: true },
    bottomMargin: { type: Number, required: true },
    leftMargin: { type: Number, required: true },
    rightMargin: { type: Number, required: true },
    broadWidth: { type: Number, required: true },
    broadHeight: { type: Number, required: true },
    tailWidth: { type: Number, required: true },
    tailHeight: { type: Number, required: true },
    sectionA: { type: sectionSchema, required: true },
    sectionB: { type: sectionSchema, required: true },
    verticalPitch: { type: Number },
  },
  { _id: false }
);

const pageConfigSchema = new Schema<PageConfig>(
  {
    layoutType: { type: String, enum: ['grid', 'jewellery-interlock'], default: 'grid' },
    pageWidth: { type: Number, required: true },
    pageHeight: { type: Number, required: true },
    rows: { type: Number, required: true, min: 1 },
    columns: { type: Number, required: true, min: 1 },
    stickerWidth: { type: Number, required: true },
    stickerHeight: { type: Number, required: true },
    horizontalGap: { type: Number, required: true, default: 0 },
    verticalGap: { type: Number, required: true, default: 0 },
    topMargin: { type: Number, required: true, default: 0 },
    bottomMargin: { type: Number, required: true, default: 0 },
    leftMargin: { type: Number, required: true, default: 0 },
    rightMargin: { type: Number, required: true, default: 0 },
    printableAreaWidth: { type: Number, required: true },
    printableAreaHeight: { type: Number, required: true },
    stickerCount: { type: Number },
    verticalPitch: { type: Number },
    geometry: { type: geometrySchema },
    stickers: { type: [stickerSchema], default: undefined },
  },
  { _id: false }
);

const templateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    config: { type: pageConfigSchema, required: true },
  },
  { timestamps: true }
);

export const Template = mongoose.model<ITemplate>('Template', templateSchema);
