import mongoose, { Schema, Document } from 'mongoose';
import type { ProductValues } from '../types/category.js';

export interface ILabel extends Document {
  name: string;
  categoryId: mongoose.Types.ObjectId;
  values: ProductValues;
  createdAt: Date;
  updatedAt: Date;
}

const labelSchema = new Schema<ILabel>(
  {
    name: { type: String, required: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    values: { type: Schema.Types.Mixed, required: true, default: {} },
  },
  { timestamps: true }
);

labelSchema.index({ categoryId: 1 });
labelSchema.index({ name: 'text' });

export const Label = mongoose.model<ILabel>('Label', labelSchema);
