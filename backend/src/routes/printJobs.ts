import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/index.js';
import { printJobRepository } from '../repositories/printJobRepository.js';
import { templateRepository } from '../repositories/templateRepository.js';
import { layoutRepository } from '../repositories/layoutRepository.js';
import { labelRepository } from '../repositories/labelRepository.js';
import { settingsRepository } from '../repositories/settingsRepository.js';
import { computePrintPositions, getEffectivePageConfig, type PageConfig } from '../types/index.js';
import { paramId } from '../utils/params.js';

const createPrintJobSchema = z.object({
  templateId: z.string(),
  layoutId: z.string(),
  labelIds: z.array(z.string()),
  mode: z.enum(['single', 'selected', 'startFrom']),
  selectedPositions: z.array(z.number()).default([]),
  startFromPosition: z.number().optional(),
  usedPositions: z.array(z.number()).default([]),
  status: z.enum(['draft', 'previewed', 'printed', 'exported']).optional(),
});

const router = Router();

router.get(
  '/history',
  asyncHandler(async (_req, res) => {
    const jobs = await printJobRepository.findHistory();
    res.json(jobs);
  })
);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const jobs = await printJobRepository.findHistory();
    res.json(jobs);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const job = await printJobRepository.findById(paramId(req));
    if (!job) {
      res.status(404).json({ error: 'Print job not found' });
      return;
    }
    res.json(job);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createPrintJobSchema.parse(req.body);

    const template = await templateRepository.findById(parsed.templateId);
    const layout = await layoutRepository.findById(parsed.layoutId);
    if (!template || !layout) {
      res.status(400).json({ error: 'Invalid template or layout' });
      return;
    }

    const labels = await labelRepository.findByIds(parsed.labelIds);
    const pageConfig = getEffectivePageConfig(template.config as PageConfig);
    const printPositions = computePrintPositions(
      parsed.mode,
      labels.length,
      pageConfig,
      {
        selectedPositions: parsed.selectedPositions,
        startFromPosition: parsed.startFromPosition,
        usedPositions: parsed.usedPositions,
      }
    );

    const job = await printJobRepository.create({
      ...parsed,
      printPositions,
      status: parsed.status ?? 'printed',
    });

    res.status(201).json(job);
  })
);

router.post(
  '/preview',
  asyncHandler(async (req, res) => {
    const parsed = createPrintJobSchema.parse(req.body);

    const [template, layout, labels, calibration] = await Promise.all([
      templateRepository.findById(parsed.templateId),
      layoutRepository.findById(parsed.layoutId),
      labelRepository.findByIds(parsed.labelIds),
      settingsRepository.getCalibration(),
    ]);

    if (!template || !layout) {
      res.status(400).json({ error: 'Invalid template or layout' });
      return;
    }

    const pageConfig = getEffectivePageConfig(template.config as PageConfig);
    const printPositions = computePrintPositions(
      parsed.mode,
      labels.length,
      pageConfig,
      {
        selectedPositions: parsed.selectedPositions,
        startFromPosition: parsed.startFromPosition,
        usedPositions: parsed.usedPositions,
      }
    );

    const positionLabelMap = printPositions.map((pos, i) => ({
      position: pos,
      label: labels[i] ?? null,
    }));

    res.json({
      template: { ...template.toObject(), config: pageConfig },
      layout,
      calibration,
      printPositions,
      positionLabelMap,
      usedPositions: parsed.usedPositions,
      mode: parsed.mode,
    });
  })
);

router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const statusSchema = z.object({
      status: z.enum(['draft', 'previewed', 'printed', 'exported']),
    });
    const { status } = statusSchema.parse(req.body);
    const job = await printJobRepository.update(paramId(req), { status });
    if (!job) {
      res.status(404).json({ error: 'Print job not found' });
      return;
    }
    res.json(job);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await printJobRepository.delete(paramId(req));
    if (!deleted) {
      res.status(404).json({ error: 'Print job not found' });
      return;
    }
    res.status(204).send();
  })
);

export default router;
