import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/index.js';
import { labelRepository } from '../repositories/labelRepository.js';
import { categoryRepository } from '../repositories/categoryRepository.js';
import { paramId } from '../utils/params.js';
import { buildSearchHaystack } from '../types/category.js';
import type { ILabel } from '../models/Label.js';

const createLabelSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  values: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
});

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = (req.query.q as string | undefined)?.trim().toLowerCase();
    const categoryId = req.query.categoryId as string | undefined;
    let labels = await labelRepository.findAll(categoryId);

    if (q) {
      const categories = await categoryRepository.findAll();
      const catMap = new Map(categories.map((c) => [String(c._id), c]));
      labels = labels.filter((label) => {
        const cat = catMap.get(String(label.categoryId));
        const searchableKeys =
          cat?.config.fields.filter((f) => f.showInSearch).map((f) => f.key) ?? [];
        const haystack = buildSearchHaystack(
          label.name,
          cat?.name,
          label.values ?? {},
          searchableKeys
        );
        return haystack.includes(q);
      });
    }

    res.json(labels);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const label = await labelRepository.findById(paramId(req));
    if (!label) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(label);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createLabelSchema.parse(req.body);
    const cat = await categoryRepository.findById(parsed.categoryId);
    if (!cat) {
      res.status(400).json({ error: 'Invalid category' });
      return;
    }
    const label = await labelRepository.create(parsed as unknown as Partial<ILabel>);
    res.status(201).json(label);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const parsed = createLabelSchema.partial().parse(req.body);
    if (parsed.categoryId) {
      const cat = await categoryRepository.findById(parsed.categoryId);
      if (!cat) {
        res.status(400).json({ error: 'Invalid category' });
        return;
      }
    }
    const label = await labelRepository.update(paramId(req), parsed as unknown as Partial<ILabel>);
    if (!label) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(label);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await labelRepository.delete(paramId(req));
    if (!deleted) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.status(204).send();
  })
);

export default router;
