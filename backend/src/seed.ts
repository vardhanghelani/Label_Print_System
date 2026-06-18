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
    description: '137×172 mm interlocking jewellery sheet — 14 stickers',
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
  field('rf1', 'Design Number', 'design_number', 'text', { showInSearch: true, required: true, sortOrder: 0 }),
  field('rf2', 'Weight', 'weight', 'text', { showInLabel: true, sortOrder: 1 }),
  field('rf3', 'Size', 'size', 'number', { sortOrder: 2 }),
  field('rf4', 'Purity', 'purity', 'dropdown', { options: ['18K', '22K', '24K'], sortOrder: 3 }),
  field('rf5', 'Price', 'price', 'currency', { showInSearch: true, sortOrder: 4 }),
  field('rf6', 'Making Charge', 'making_charge', 'currency', { sortOrder: 5 }),
];

const NECKLACE_FIELDS: CategoryFieldDefinition[] = [
  field('nf1', 'Design Number', 'design_number', 'text', { showInSearch: true, required: true, sortOrder: 0 }),
  field('nf2', 'Length', 'length', 'text', { sortOrder: 1 }),
  field('nf3', 'Weight', 'weight', 'text', { sortOrder: 2 }),
  field('nf4', 'Purity', 'purity', 'dropdown', { options: ['18K', '22K'], sortOrder: 3 }),
  field('nf5', 'Price', 'price', 'currency', { showInSearch: true, sortOrder: 4 }),
];

const LEGACY_FIELDS: CategoryFieldDefinition[] = [
  field('lf1', 'Design Number', 'design_number', 'text', { showInSearch: true, sortOrder: 0 }),
  field('lf2', 'Weight', 'weight', 'text', { sortOrder: 1 }),
  field('lf3', 'Purity', 'purity', 'text', { sortOrder: 2 }),
  field('lf4', 'Price', 'price', 'text', { showInSearch: true, sortOrder: 3 }),
  field('lf5', 'SKU', 'sku', 'text', { showInSearch: true, sortOrder: 4 }),
  field('lf6', 'Notes', 'notes', 'multiline', { sortOrder: 5 }),
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

  const necklaceCategory = await Category.create({
    name: 'Necklace',
    description: 'Necklaces and chains',
    config: { fields: NECKLACE_FIELDS },
  });

  const legacyCategory = await Category.create({
    name: 'Legacy Jewellery',
    description: 'Migrated from previous fixed-field products',
    config: { fields: LEGACY_FIELDS },
  });

  const defaultLayout = await Layout.create({
    name: JEWELLERY_LAYOUT_NAME,
    templateId: defaultTemplate._id,
    config: {
      categoryId: ringCategory._id,
      fields: [
        {
          id: 'f1',
          type: 'categoryField',
          fieldKey: 'design_number',
          label: 'Design Number',
          section: 'A',
          x: 0.5,
          y: 0.3,
          width: 30,
          height: 4,
          fontSize: 7,
          bold: true,
          italic: false,
          alignment: 'left',
        },
        {
          id: 'f2',
          type: 'categoryField',
          fieldKey: 'weight',
          label: 'Weight',
          section: 'A',
          x: 0.5,
          y: 5,
          width: 30,
          height: 3.5,
          fontSize: 6,
          bold: false,
          italic: false,
          alignment: 'left',
        },
        {
          id: 'f3',
          type: 'categoryField',
          fieldKey: 'price',
          label: 'Price',
          section: 'B',
          x: 0.5,
          y: 0.3,
          width: 29.5,
          height: 4,
          fontSize: 7,
          bold: true,
          italic: false,
          alignment: 'center',
        },
        {
          id: 'f4',
          type: 'categoryField',
          fieldKey: 'purity',
          label: 'Purity',
          section: 'B',
          x: 0.5,
          y: 5,
          width: 29.5,
          height: 3.5,
          fontSize: 6,
          bold: false,
          italic: false,
          alignment: 'right',
        },
      ],
    },
  });

  await Category.findByIdAndUpdate(ringCategory._id, { defaultLayoutId: defaultLayout._id });

  await Label.insertMany([
    {
      name: 'Gold Ring R1001',
      categoryId: ringCategory._id,
      values: {
        design_number: 'R1001',
        weight: '4.350 gm',
        size: 12,
        purity: '22K',
        price: '₹56,000',
        making_charge: '₹2,500',
      },
    },
    {
      name: 'Diamond Necklace N2002',
      categoryId: necklaceCategory._id,
      values: {
        design_number: 'N2002',
        length: '18 inch',
        weight: '12.800 gm',
        purity: '18K',
        price: '₹1,25,000',
      },
    },
    {
      name: 'Gold Bracelet B3003',
      categoryId: legacyCategory._id,
      values: {
        design_number: 'B3003',
        weight: '8.200 gm',
        purity: '22KT',
        price: '₹78,500',
      },
    },
    {
      name: 'Gold Earrings E4004',
      categoryId: ringCategory._id,
      values: {
        design_number: 'E4004',
        weight: '3.100 gm',
        size: 8,
        purity: '22K',
        price: '₹42,000',
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
  console.log(`  Categories: 3`);
  console.log(`  Default layout: ${defaultLayout.name}`);
  console.log(`  Products: 4`);

  await disconnectDatabase();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
