import { Category, type ICategory } from '../models/Category.js';

export const categoryRepository = {
  findAll: () => Category.find().sort({ name: 1 }).lean(),

  findById: (id: string) => Category.findById(id).lean(),

  create: (data: Partial<ICategory>) => Category.create(data),

  update: (id: string, data: Partial<ICategory>) =>
    Category.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean(),

  delete: (id: string) => Category.findByIdAndDelete(id),
};
