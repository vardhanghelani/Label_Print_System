import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/index.js';
import { labelRepository } from '../repositories/labelRepository.js';
import { paramId } from '../utils/params.js';

const labelDataSchema = z.object({
  productName: z.string().optional(),
  weight: z.string().optional(),
  price: z.string().optional(),
  purity: z.string().optional(),
  designNumber: z.string().optional(),
  customField1: z.string().optional(),
  customField2: z.string().optional(),
  customField3: z.string().optional(),
});

const createLabelSchema = z.object({
  name: z.string().min(1),
  data: labelDataSchema,
});

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const labels = await labelRepository.findAll();
    res.json(labels);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const label = await labelRepository.findById(paramId(req));
    if (!label) {
      res.status(404).json({ error: 'Label not found' });
      return;
    }
    res.json(label);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createLabelSchema.parse(req.body);
    const label = await labelRepository.create(parsed);
    res.status(201).json(label);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const parsed = createLabelSchema.partial().parse(req.body);
    const label = await labelRepository.update(paramId(req), parsed);
    if (!label) {
      res.status(404).json({ error: 'Label not found' });
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
      res.status(404).json({ error: 'Label not found' });
      return;
    }
    res.status(204).send();
  })
);

export default router;
