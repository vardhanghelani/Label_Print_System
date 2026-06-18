import { Label, type ILabel } from '../models/Label.js';

export class LabelRepository {
  async findAll(categoryId?: string): Promise<ILabel[]> {
    const filter = categoryId ? { categoryId } : {};
    return Label.find(filter).sort({ updatedAt: -1 });
  }

  async findById(id: string): Promise<ILabel | null> {
    return Label.findById(id);
  }

  async findByIds(ids: string[]): Promise<ILabel[]> {
    return Label.find({ _id: { $in: ids } });
  }

  /** Preserves the order of ids (MongoDB $in does not guarantee order). */
  async findByIdsOrdered(ids: string[]): Promise<(ILabel | null)[]> {
    if (!ids.length) return [];
    const labels = await Label.find({ _id: { $in: ids } });
    const byId = new Map(labels.map((l) => [String(l._id), l]));
    return ids.map((id) => byId.get(id) ?? null);
  }

  async create(data: Partial<ILabel>): Promise<ILabel> {
    return Label.create(data);
  }

  async update(id: string, data: Partial<ILabel>): Promise<ILabel | null> {
    return Label.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await Label.findByIdAndDelete(id);
    return !!result;
  }
}

export const labelRepository = new LabelRepository();
