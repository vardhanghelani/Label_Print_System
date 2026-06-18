import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/index.js';
import { settingsRepository } from '../repositories/settingsRepository.js';

const calibrationSchema = z.object({
  horizontalOffset: z.number(),
  verticalOffset: z.number(),
  scaleX: z.number().min(1).max(200),
  scaleY: z.number().min(1).max(200),
});

const shopSchema = z.object({
  brandName: z.string(),
  logoUrl: z.string().optional(),
  defaultTemplateId: z.string().optional(),
  defaultLayoutId: z.string().optional(),
  defaultSheetBehavior: z.enum(['newSheet', 'continueSheet']).optional(),
});

const passwordSchema = z.object({
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(4, 'Password must be at least 4 characters'),
});

const router = Router();

router.get(
  '/calibration',
  asyncHandler(async (_req, res) => {
    res.json(await settingsRepository.getCalibration());
  })
);

router.put(
  '/calibration',
  asyncHandler(async (req, res) => {
    const parsed = calibrationSchema.parse(req.body);
    res.json(await settingsRepository.updateCalibration(parsed));
  })
);

router.get(
  '/shop',
  asyncHandler(async (_req, res) => {
    res.json(await settingsRepository.getShop());
  })
);

router.put(
  '/shop',
  asyncHandler(async (req, res) => {
    const parsed = shopSchema.parse(req.body);
    res.json(await settingsRepository.updateShop(parsed));
  })
);

router.get(
  '/admin/status',
  asyncHandler(async (_req, res) => {
    const passwordSet = await settingsRepository.isAdminPasswordSet();
    res.json({ passwordSet });
  })
);

router.post(
  '/admin/setup',
  asyncHandler(async (req, res) => {
    const { password } = passwordSchema.parse(req.body);
    const success = await settingsRepository.setupAdminPassword(password);
    if (!success) {
      res.status(400).json({ error: 'Admin password is already set' });
      return;
    }
    res.json({ success: true });
  })
);

router.post(
  '/admin/verify',
  asyncHandler(async (req, res) => {
    const { password } = passwordSchema.parse(req.body);
    const valid = await settingsRepository.verifyAdminPassword(password);
    res.json({ valid });
  })
);

router.post(
  '/admin/change-password',
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const success = await settingsRepository.updateAdminPassword(currentPassword, newPassword);
    if (!success) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }
    res.json({ success: true });
  })
);

export default router;
