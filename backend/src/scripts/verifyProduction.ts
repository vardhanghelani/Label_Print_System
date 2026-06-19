/**
 * Production audit script — geometry, DB state, category workflow evidence.
 * Run: npx tsx backend/src/scripts/verifyProduction.ts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { config } from '../config/index.js';
import { Template } from '../models/Template.js';
import { Label } from '../models/Label.js';
import { Category } from '../models/Category.js';
import { buildJewellerySheetConfig, JEWELLERY_SHEET_NAME } from './ensureJewellerySheet.js';
import { validateInterlockGeometry } from '../types/geometryValidator.js';
import { toPublicLabel } from '../utils/normalizeLabel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../../../.verify-output');
const OUT_REPORT = path.join(OUT_DIR, 'production-audit-report.json');

async function main() {
  await connectDatabase(config.mongoUri);

  const template = await Template.findOne({ name: JEWELLERY_SHEET_NAME });
  const canonical = buildJewellerySheetConfig();
  const validation = validateInterlockGeometry(110, 197, canonical.geometry!);

  const allStickers = validation.stickers.map((s) => ({
    stickerNumber: s.stickerNumber,
    orientation: s.orientation,
    broadArea: s.broadArea,
    tailArea: s.tailArea,
    sectionA: s.sectionA,
    sectionB: s.sectionB,
    broadBottom: s.broadArea.y + s.broadArea.height,
  }));

  const sticker22 = allStickers.find((s) => s.stickerNumber === 22);

  const labels = await Label.find().limit(5);
  const categories = await Category.find();

  const categoryReport = categories.map((c) => ({
    name: c.name,
    fieldCount: c.config?.fields?.length ?? 0,
    fieldTypes: (c.config?.fields ?? []).map((f) => ({ name: f.name, key: f.key, datatype: f.datatype })),
  }));

  const report = {
    timestamp: new Date().toISOString(),
    geometry: {
      sheetSize: { width: 110, height: 197 },
      stickerCount: 22,
      topMargin: canonical.geometry?.topMargin,
      bottomMargin: canonical.geometry?.bottomMargin,
      pairHeight: (canonical.geometry?.broadHeight ?? 0) + (canonical.geometry?.tailHeight ?? 0),
      validation: {
        valid: validation.valid,
        issues: validation.issues.map((i) => i.message),
      },
      sticker22: sticker22
        ? {
            broadY: sticker22.broadArea.y,
            broadBottom: sticker22.broadBottom,
            fitsInPage: sticker22.broadBottom <= 197,
          }
        : null,
      allStickerCoordinates: allStickers,
    },
    database: {
      template: template
        ? {
            name: template.name,
            pageWidth: template.config.pageWidth,
            pageHeight: template.config.pageHeight,
            stickerCount: template.config.stickerCount,
            topMargin: template.config.geometry?.topMargin,
          }
        : null,
      labelCount: labels.length,
      labelSamples: labels.map((l) => toPublicLabel(l)),
      categoryCount: categories.length,
      categories: categoryReport,
    },
    remainingKnownIssues: [] as string[],
  };

  if (!validation.valid) {
    report.remainingKnownIssues.push('Geometry validation failed');
  }
  if (sticker22 && sticker22.broadBottom > 197) {
    report.remainingKnownIssues.push(`Sticker 22 exceeds page: bottom=${sticker22.broadBottom}`);
  }
  if (template?.config?.geometry?.topMargin === 5) {
    report.remainingKnownIssues.push('DB template still has topMargin=5 — run ensureJewellerySheet migration');
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2));

  console.log(JSON.stringify(report, null, 2));
  console.log(`\nReport written to ${OUT_REPORT}`);

  await disconnectDatabase();

  if (!validation.valid || (sticker22 && sticker22.broadBottom > 197)) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
