import { Template, type ITemplate } from '../models/Template.js';

export class TemplateRepository {
  async findAll(): Promise<ITemplate[]> {
    return Template.find().sort({ updatedAt: -1 });
  }

  async findById(id: string): Promise<ITemplate | null> {
    return Template.findById(id);
  }

  async create(data: Partial<ITemplate>): Promise<ITemplate> {
    return Template.create(data);
  }

  async update(id: string, data: Partial<ITemplate>): Promise<ITemplate | null> {
    return Template.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await Template.findByIdAndDelete(id);
    return !!result;
  }
}

export const templateRepository = new TemplateRepository();
