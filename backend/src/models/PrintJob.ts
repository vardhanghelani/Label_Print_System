import mongoose, { Schema, Document } from 'mongoose';
import type { PrintMode } from '../types/index.js';

export interface IPrintJob extends Document {
  templateId: mongoose.Types.ObjectId;
  layoutId: mongoose.Types.ObjectId;
  labelIds: mongoose.Types.ObjectId[];
  mode: PrintMode;
  selectedPositions: number[];
  startFromPosition?: number;
  usedPositions: number[];
  printPositions: number[];
  status: 'draft' | 'previewed' | 'printed' | 'exported';
  createdAt: Date;
  updatedAt: Date;
}

const printJobSchema = new Schema<IPrintJob>(
  {
    templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
    layoutId: { type: Schema.Types.ObjectId, ref: 'Layout', required: true },
    labelIds: [{ type: Schema.Types.ObjectId, ref: 'Label' }],
    mode: { type: String, enum: ['single', 'selected', 'startFrom'], required: true },
    selectedPositions: { type: [Number], default: [] },
    startFromPosition: { type: Number },
    usedPositions: { type: [Number], default: [] },
    printPositions: { type: [Number], default: [] },
    status: {
      type: String,
      enum: ['draft', 'previewed', 'printed', 'exported'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

export const PrintJob = mongoose.model<IPrintJob>('PrintJob', printJobSchema);
