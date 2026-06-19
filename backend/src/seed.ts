import { connectDatabase, disconnectDatabase } from './config/database.js';
import { config } from './config/index.js';
import { Template } from './models/Template.js';
import { Layout } from './models/Layout.js';
import { Label } from './models/Label.js';
import { Category } from './models/Category.js';
import { Settings } from './models/Settings.js';
import { User } from './models/User.js';
import { DEFAULT_CALIBRATION } from './types/index.js';
import type { CategoryFieldDefinition } from './types/category.js';
import {
  buildJewellerySheetConfig,
  JEWELLERY_SHEET_NAME,
  JEWELLERY_LAYOUT_NAME,
} from './scripts/ensureJewellerySheet.js';

const JEWELLERY_TEMPLATE_CONFIG = buildJewellerySheetConfig();

const SAMPLE_TEMPLATES = [
  {
    name: JEWELLERY_SHEET_NAME,
    description: '110×197 mm interlocking jewellery sheet — 22 stickers',
    config: JEWELLERY_TEMPLATE_CONFIG,
  },
];

function field(
  id: string,
  name: string,
  key: string,
  datatype: CategoryFieldDefinition['datatype'],
  opts: Partial<CategoryFieldDefinition> = {}
): CategoryFieldDefinition {
  return {
    id,
    name,
    key,
    datatype,
    required: opts.required ?? false,
    showInSearch: opts.showInSearch ?? false,
    showInLabel: opts.showInLabel ?? true,
    visibleInForm: opts.visibleInForm ?? true,
    editable: opts.editable ?? true,
    readOnly: opts.readOnly ?? false,
    sortOrder: opts.sortOrder ?? 0,
    options: opts.options,
    defaultValue: opts.defaultValue,
  };
}

const RING_FIELDS: CategoryFieldDefinition[] = [
  field('rf1', 'Serial Number', 'serial_number', 'text', { showInSearch: true, required: true, sortOrder: 0 }),
  field('rf2', 'Weight', 'weight', 'number', { showInLabel: true, sortOrder: 1 }),
  field('rf3', 'Price', 'price', 'currency', { showInSearch: true, sortOrder: 2 }),
];

const PENDANT_FIELDS: CategoryFieldDefinition[] = [
  field('pf1', 'Stone Type', 'stone_type', 'text', { showInSearch: true, required: true, sortOrder: 0 }),
  field('pf2', 'Length', 'length', 'number', { sortOrder: 1 }),
  field('pf3', 'Price', 'price', 'currency', { showInSearch: true, sortOrder: 2 }),
];

const CHAIN_FIELDS: CategoryFieldDefinition[] = [
  field('cf1', 'Item Code', 'item_code', 'text', { showInSearch: true, required: true, sortOrder: 0 }),
  field('cf2', 'Length', 'length', 'number', { sortOrder: 1 }),
  field('cf3', 'Price', 'price', 'currency', { showInSearch: true, sortOrder: 2 }),
];

const LEGACY_FIELDS: CategoryFieldDefinition[] = [
  field('lf1', 'Legacy Code', 'legacy_code', 'text', { showInSearch: true, sortOrder: 0 }),
  field('lf2', 'Notes', 'notes', 'text', { sortOrder: 1 }),
  field('lf3', 'Amount', 'amount', 'currency', { showInSearch: true, sortOrder: 2 }),
];

async function seed() {
  await connectDatabase(config.mongoUri);

  await Promise.all([
    Template.deleteMany({}),
    Layout.deleteMany({}),
    Label.deleteMany({}),
    Category.deleteMany({}),
    Settings.deleteMany({}),
    User.deleteMany({}),
  ]);

  const templates = await Template.insertMany(SAMPLE_TEMPLATES);
  const defaultTemplate = templates[0];

  const ringCategory = await Category.create({
    name: 'Ring',
    description: 'Gold and diamond rings',
    config: { fields: RING_FIELDS },
  });

  const pendantCategory = await Category.create({
    name: 'Pendant',
    description: 'Pendants and lockets',
    config: { fields: PENDANT_FIELDS },
  });

  const chainCategory = await Category.create({
    name: 'Chain',
    description: 'Gold chains',
    config: { fields: CHAIN_FIELDS },
  });

  const legacyCategory = await Category.create({
    name: 'Legacy Jewellery',
    description: 'Migrated from previous fixed-field products',
    config: { fields: LEGACY_FIELDS },
  });

  const defaultLayout = await Layout.create({
    name: JEWELLERY_LAYOUT_NAME,
    templateId: defaultTemplate._id,
    config: { fields: [] },
  });

  await Category.findByIdAndUpdate(ringCategory._id, { defaultLayoutId: defaultLayout._id });

  await Label.insertMany([
    {
      name: 'Gold Ring TEST001',
      categoryId: ringCategory._id,
      values: {
        serial_number: 'TEST001',
        weight: 4.5,
        price: 5000,
      },
    },
    {
      name: 'Ruby Pendant P2002',
      categoryId: pendantCategory._id,
      values: {
        stone_type: 'Ruby',
        length: 18,
        price: 125000,
      },
    },
    {
      name: 'Gold Chain C3003',
      categoryId: chainCategory._id,
      values: {
        item_code: 'C3003',
        length: 20,
        price: 78500,
      },
    },
    {
      name: 'Legacy Item',
      categoryId: legacyCategory._id,
      values: {
        legacy_code: 'LEG-001',
        notes: 'Migrated product',
        amount: 42000,
      },
    },
  ]);

  await Settings.create({
    key: 'global',
    calibration: { ...DEFAULT_CALIBRATION },
    shop: {
      brandName: 'ABC Jewellers',
      defaultTemplateId: defaultTemplate._id,
      defaultLayoutId: defaultLayout._id,
      defaultSheetBehavior: 'newSheet',
    },
    adminPassword: '',
  });

  await User.create({
    name: 'Demo User',
    email: 'demo@jewellers.com',
    role: 'admin',
  });

  console.log('Seed completed successfully');
  console.log(`  Templates: ${templates.length}`);
  console.log(`  Categories: 4 (Ring, Pendant, Chain, Legacy)`);
  console.log(`  Default layout: ${defaultLayout.name}`);
  console.log(`  Products: 4`);

  await disconnectDatabase();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
