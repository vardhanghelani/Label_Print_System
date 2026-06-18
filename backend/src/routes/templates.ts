import { Router } from 'express';
import { asyncHandler } from '../middleware/index.js';
import { templateRepository } from '../repositories/templateRepository.js';
import { paramId } from '../utils/params.js';
import { createTemplateSchema } from '../schemas/templateSchema.js';
import { normalizeTemplateConfig } from '../utils/normalizeTemplateConfig.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const templates = await templateRepository.findAll();
    res.json(templates);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const template = await templateRepository.findById(paramId(req));
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json(template);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createTemplateSchema.parse(req.body);
    const config = normalizeTemplateConfig(parsed.config);
    const template = await templateRepository.create({ ...parsed, config });
    res.status(201).json(template);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const parsed = createTemplateSchema.partial().parse(req.body);
    const data = parsed.config
      ? { ...parsed, config: normalizeTemplateConfig(parsed.config) }
      : parsed;
    const template = await templateRepository.update(paramId(req), data);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json(template);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await templateRepository.delete(paramId(req));
    if (!deleted) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.status(204).send();
  })
);

export default router;
