import mongoose, { Schema, Document } from 'mongoose';
import type { CategoryConfig } from '../types/category.js';

export interface ICategory extends Document {
  name: string;
  description?: string;
  config: CategoryConfig;
  defaultLayoutId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const categoryFieldSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    key: { type: String, required: true },
    datatype: {
      type: String,
      enum: [
        'text',
        'number',
        'decimal',
        'currency',
        'date',
        'dropdown',
        'checkbox',
        'multiline',
        'phone',
        'email',
      ],
      required: true,
    },
    required: { type: Boolean, default: false },
    showInSearch: { type: Boolean, default: false },
    showInLabel: { type: Boolean, default: true },
    visibleInForm: { type: Boolean, default: true },
    editable: { type: Boolean, default: true },
    readOnly: { type: Boolean, default: false },
    defaultValue: { type: String },
    sortOrder: { type: Number, default: 0 },
    options: { type: [String], default: undefined },
  },
  { _id: false }
);

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    config: {
      fields: { type: [categoryFieldSchema], default: [] },
    },
    defaultLayoutId: { type: Schema.Types.ObjectId, ref: 'Layout' },
  },
  { timestamps: true }
);

export const Category = mongoose.model<ICategory>('Category', categorySchema);
