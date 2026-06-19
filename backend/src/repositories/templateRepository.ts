import { Template, type ITemplate } from '../models/Template.js';
import { getEffectivePageConfig, type PageConfig } from '../types/index.js';

function withNormalizedConfig(template: ITemplate): ITemplate {
  const obj = template.toObject ? template.toObject() : { ...template };
  if (obj.config) {
    obj.config = getEffectivePageConfig(obj.config as PageConfig);
  }
  return obj as ITemplate;
}

export class TemplateRepository {
  async findAll(): Promise<ITemplate[]> {
    const templates = await Template.find().sort({ updatedAt: -1 });
    return templates.map(withNormalizedConfig);
  }

  async findById(id: string): Promise<ITemplate | null> {
    const template = await Template.findById(id);
    return template ? withNormalizedConfig(template) : null;
  }

  async create(data: Partial<ITemplate>): Promise<ITemplate> {
    const template = await Template.create(data);
    return withNormalizedConfig(template);
  }

  async update(id: string, data: Partial<ITemplate>): Promise<ITemplate | null> {
    const template = await Template.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    return template ? withNormalizedConfig(template) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await Template.findByIdAndDelete(id);
    return !!result;
  }
}

export const templateRepository = new TemplateRepository();
