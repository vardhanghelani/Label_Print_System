import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/index.js';
import { layoutRepository } from '../repositories/layoutRepository.js';
import { paramId } from '../utils/params.js';
import type { LayoutConfig } from '../types/index.js';

const layoutFieldSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  fontSize: z.number(),
  bold: z.boolean(),
  italic: z.boolean(),
  alignment: z.enum(['left', 'center', 'right']),
  section: z.enum(['A', 'B', 'full']).optional(),
  rotation: z.number().optional(),
  lineSpacing: z.number().optional(),
  fieldKey: z.string().optional(),
  categoryId: z.string().optional(),
  staticText: z.string().optional(),
  logoUrl: z.string().optional(),
});

const createLayoutSchema = z.object({
  name: z.string().min(1),
  templateId: z.string(),
  config: z.object({
    categoryId: z.string().optional(),
    fields: z.array(layoutFieldSchema),
  }),
});

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const templateId = req.query.templateId as string | undefined;
    const layouts = await layoutRepository.findAll(templateId);
    res.json(layouts);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const layout = await layoutRepository.findById(paramId(req));
    if (!layout) {
      res.status(404).json({ error: 'Layout not found' });
      return;
    }
    res.json(layout);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createLayoutSchema.parse(req.body);
    const layout = await layoutRepository.create({
      name: parsed.name,
      templateId: parsed.templateId,
      config: parsed.config as LayoutConfig,
    });
    res.status(201).json(layout);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const parsed = createLayoutSchema.partial().parse(req.body);
    const layout = await layoutRepository.update(paramId(req), {
      ...(parsed.name !== undefined && { name: parsed.name }),
      ...(parsed.templateId !== undefined && { templateId: parsed.templateId }),
      ...(parsed.config !== undefined && { config: parsed.config as LayoutConfig }),
    });
    if (!layout) {
      res.status(404).json({ error: 'Layout not found' });
      return;
    }
    res.json(layout);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await layoutRepository.delete(paramId(req));
    if (!deleted) {
      res.status(404).json({ error: 'Layout not found' });
      return;
    }
    res.status(204).send();
  })
);

export default router;
