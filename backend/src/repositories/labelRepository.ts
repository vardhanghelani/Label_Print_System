import { Label, type ILabel } from '../models/Label.js';
import { toPublicLabel } from '../utils/normalizeLabel.js';

export class LabelRepository {
  async findAll(categoryId?: string): Promise<ILabel[]> {
    const filter = categoryId ? { categoryId } : {};
    const labels = await Label.find(filter).sort({ updatedAt: -1 });
    return labels.map((l) => toPublicLabel(l) as unknown as ILabel);
  }

  async findById(id: string): Promise<ILabel | null> {
    const label = await Label.findById(id);
    return label ? (toPublicLabel(label) as unknown as ILabel) : null;
  }

  async findByIds(ids: string[]): Promise<ILabel[]> {
    const labels = await Label.find({ _id: { $in: ids } });
    return labels.map((l) => toPublicLabel(l) as unknown as ILabel);
  }

  /** Preserves the order of ids (MongoDB $in does not guarantee order). */
  async findByIdsOrdered(ids: string[]): Promise<(ILabel | null)[]> {
    if (!ids.length) return [];
    const labels = await Label.find({ _id: { $in: ids } });
    const byId = new Map(labels.map((l) => [String(l._id), l]));
    return ids.map((id) => {
      const doc = byId.get(id);
      return doc ? (toPublicLabel(doc) as unknown as ILabel) : null;
    });
  }

  async create(data: Partial<ILabel>): Promise<ILabel> {
    const label = await Label.create(data);
    return toPublicLabel(label) as unknown as ILabel;
  }

  async update(id: string, data: Partial<ILabel>): Promise<ILabel | null> {
    const label = await Label.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    return label ? (toPublicLabel(label) as unknown as ILabel) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await Label.findByIdAndDelete(id);
    return !!result;
  }
}

export const labelRepository = new LabelRepository();
