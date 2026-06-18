import { Layout, type ILayout } from '../models/Layout.js';
import type { LayoutConfig } from '../types/index.js';

export class LayoutRepository {
  async findAll(templateId?: string): Promise<ILayout[]> {
    const filter = templateId ? { templateId } : {};
    return Layout.find(filter).sort({ updatedAt: -1 });
  }

  async findById(id: string): Promise<ILayout | null> {
    return Layout.findById(id);
  }

  async create(data: {
    name: string;
    templateId: string;
    config: LayoutConfig;
  }): Promise<ILayout> {
    return Layout.create(data);
  }

  async update(
    id: string,
    data: Partial<{ name: string; templateId: string; config: LayoutConfig }>
  ): Promise<ILayout | null> {
    return Layout.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await Layout.findByIdAndDelete(id);
    return !!result;
  }
}

export const layoutRepository = new LayoutRepository();
