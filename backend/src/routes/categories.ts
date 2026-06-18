import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/index.js';
import { categoryRepository } from '../repositories/categoryRepository.js';
import { paramId } from '../utils/params.js';
import { slugifyFieldKey } from '../types/category.js';
import type { CategoryFieldDefinition } from '../types/category.js';
import type { ICategory } from '../models/Category.js';

const fieldSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  key: z.string().min(1).optional(),
  datatype: z.enum([
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
  ]),
  required: z.boolean(),
  showInSearch: z.boolean(),
  showInLabel: z.boolean(),
  visibleInForm: z.boolean(),
  editable: z.boolean(),
  readOnly: z.boolean(),
  defaultValue: z.string().optional(),
  sortOrder: z.number(),
  options: z.array(z.string()).optional(),
});

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  config: z.object({
    fields: z.array(fieldSchema),
  }),
  defaultLayoutId: z.string().optional(),
});

function normalizeFields(fields: z.infer<typeof fieldSchema>[]): CategoryFieldDefinition[] {
  const usedKeys = new Set<string>();
  return fields.map((f, i) => {
    let key = f.key?.trim() || slugifyFieldKey(f.name);
    let n = 1;
    while (usedKeys.has(key)) {
      key = `${slugifyFieldKey(f.name)}_${n++}`;
    }
    usedKeys.add(key);
    return { ...f, key, sortOrder: f.sortOrder ?? i };
  });
}

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await categoryRepository.findAll());
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const cat = await categoryRepository.findById(paramId(req));
    if (!cat) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(cat);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = categorySchema.parse(req.body);
    const cat = await categoryRepository.create({
      ...parsed,
      config: { fields: normalizeFields(parsed.config.fields) },
    } as Partial<ICategory>);
    res.status(201).json(cat);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const parsed = categorySchema.partial().parse(req.body);
    const data = parsed.config
      ? { ...parsed, config: { fields: normalizeFields(parsed.config.fields) } }
      : parsed;
    const cat = await categoryRepository.update(paramId(req), data as Partial<ICategory>);
    if (!cat) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(cat);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await categoryRepository.delete(paramId(req));
    if (!deleted) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.status(204).send();
  })
);

export default router;
