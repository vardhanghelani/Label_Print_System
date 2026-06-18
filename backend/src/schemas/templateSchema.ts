import { z } from 'zod';

const rectSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const sectionSchema = rectSchema;

const geometrySchema = z.object({
  stickerCount: z.number().int().positive(),
  topMargin: z.number().min(0),
  bottomMargin: z.number().min(0),
  leftMargin: z.number().min(0),
  rightMargin: z.number().min(0),
  broadWidth: z.number().positive(),
  broadHeight: z.number().positive(),
  tailWidth: z.number().positive(),
  tailHeight: z.number().positive(),
  sectionA: sectionSchema,
  sectionB: sectionSchema,
  verticalPitch: z.number().positive().optional(),
});

const stickerSchema = z.object({
  stickerNumber: z.number().int().positive(),
  orientation: z.enum(['broad-left', 'broad-right']),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  broadArea: rectSchema,
  tailArea: rectSchema,
  sectionA: rectSchema,
  sectionB: rectSchema,
  printableArea: rectSchema,
});

export const pageConfigSchema = z.object({
  layoutType: z.enum(['grid', 'jewellery-interlock']).optional(),
  pageWidth: z.number().positive(),
  pageHeight: z.number().positive(),
  rows: z.number().int().min(1),
  columns: z.number().int().min(1),
  stickerWidth: z.number().positive(),
  stickerHeight: z.number().positive(),
  horizontalGap: z.number().min(0),
  verticalGap: z.number().min(0),
  topMargin: z.number().min(0),
  bottomMargin: z.number().min(0),
  leftMargin: z.number().min(0),
  rightMargin: z.number().min(0),
  printableAreaWidth: z.number().positive(),
  printableAreaHeight: z.number().positive(),
  stickerCount: z.number().int().positive().optional(),
  verticalPitch: z.number().positive().optional(),
  geometry: geometrySchema.optional(),
  stickers: z.array(stickerSchema).optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  config: pageConfigSchema,
});
