import { PrintJob, type IPrintJob } from '../models/PrintJob.js';
import type { PrintMode } from '../types/index.js';

export class PrintJobRepository {
  async findHistory(): Promise<IPrintJob[]> {
    return PrintJob.find({ status: { $in: ['printed', 'exported'] } })
      .populate('templateId', 'name')
      .populate('layoutId', 'name')
      .populate('labelIds', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
  }

  async findById(id: string): Promise<IPrintJob | null> {
    return PrintJob.findById(id)
      .populate('templateId')
      .populate('layoutId')
      .populate('labelIds');
  }

  async create(data: {
    templateId: string;
    layoutId: string;
    labelIds: string[];
    mode: PrintMode;
    selectedPositions: number[];
    startFromPosition?: number;
    usedPositions: number[];
    printPositions: number[];
    status: IPrintJob['status'];
  }): Promise<IPrintJob> {
    return PrintJob.create(data);
  }

  async update(id: string, data: Partial<IPrintJob>): Promise<IPrintJob | null> {
    return PrintJob.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await PrintJob.findByIdAndDelete(id);
    return !!result;
  }
}

export const printJobRepository = new PrintJobRepository();
