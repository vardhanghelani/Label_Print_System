import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { config } from '../config/index.js';
import { Label } from '../models/Label.js';
import { Category } from '../models/Category.js';
import { Layout } from '../models/Layout.js';
import type { CategoryFieldDefinition } from '../types/category.js';

const LEGACY_FIELD_MAP: Record<string, string> = {
  designNumber: 'design_number',
  weight: 'weight',
  price: 'price',
  purity: 'purity',
  makingCharge: 'making_charge',
  sku: 'sku',
  notes: 'notes',
  productName: 'product_name',
  category: 'category',
  customField1: 'custom_field_1',
  customField2: 'custom_field_2',
  customField3: 'custom_field_3',
};

const STATIC_LAYOUT_TYPES = new Set(['text', 'staticBranding', 'logo']);

function legacyField(
  id: string,
  name: string,
  key: string,
  opts: Partial<CategoryFieldDefinition> = {}
): CategoryFieldDefinition {
  return {
    id,
    name,
    key,
    datatype: 'text',
    required: false,
    showInSearch: opts.showInSearch ?? false,
    showInLabel: opts.showInLabel ?? true,
    visibleInForm: true,
    editable: true,
    readOnly: false,
    sortOrder: opts.sortOrder ?? 0,
  };
}

const LEGACY_FIELDS: CategoryFieldDefinition[] = [
  legacyField('lf1', 'Design Number', 'design_number', { showInSearch: true, sortOrder: 0 }),
  legacyField('lf2', 'Weight', 'weight', { sortOrder: 1 }),
  legacyField('lf3', 'Purity', 'purity', { sortOrder: 2 }),
  legacyField('lf4', 'Price', 'price', { showInSearch: true, sortOrder: 3 }),
  legacyField('lf5', 'Making Charge', 'making_charge', { sortOrder: 4 }),
  legacyField('lf6', 'SKU', 'sku', { showInSearch: true, sortOrder: 5 }),
  legacyField('lf7', 'Notes', 'notes', { sortOrder: 6 }),
];

function mapLegacyData(data: Record<string, unknown>): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const [oldKey, newKey] of Object.entries(LEGACY_FIELD_MAP)) {
    if (data[oldKey] !== undefined && data[oldKey] !== null && data[oldKey] !== '') {
      values[newKey] = data[oldKey];
    }
  }
  return values;
}

export async function migrateLegacyProducts(): Promise<number> {
  const rawLabels = await Label.collection.find({}).toArray();
  let migrated = 0;

  let legacyCategory = await Category.findOne({ name: 'Legacy Jewellery' });
  if (!legacyCategory) {
    legacyCategory = await Category.create({
      name: 'Legacy Jewellery',
      description: 'Migrated from previous fixed-field products',
      config: { fields: LEGACY_FIELDS },
    });
  }

  for (const doc of rawLabels) {
    const hasValues = doc.values && Object.keys(doc.values as object).length > 0;
    const legacyData = doc.data as Record<string, unknown> | undefined;

    if (hasValues || !legacyData) continue;

    const values = mapLegacyData(legacyData);
    await Label.collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          categoryId: legacyCategory._id,
          values,
        },
        $unset: { data: '' },
      }
    );
    migrated++;
  }

  return migrated;
}

export async function migrateLegacyLayouts(legacyCategoryId: string): Promise<number> {
  const rawLayouts = await Layout.collection.find({}).toArray();
  let migrated = 0;

  for (const doc of rawLayouts) {
    const config = doc.config as { fields?: Array<Record<string, unknown>>; categoryId?: unknown } | undefined;
    const fields = config?.fields ?? [];
    let changed = false;

    const nextFields = fields.map((field) => {
      const type = String(field.type ?? '');
      if (STATIC_LAYOUT_TYPES.has(type)) return field;
      if (type === 'categoryField' && field.fieldKey) return field;

      const fieldKey = LEGACY_FIELD_MAP[type] ?? type.replace(/([A-Z])/g, '_$1').toLowerCase();
      changed = true;
      return {
        ...field,
        type: 'categoryField',
        fieldKey,
        categoryId: config?.categoryId ?? legacyCategoryId,
      };
    });

    const updates: Record<string, unknown> = {};
    if (changed) {
      updates['config.fields'] = nextFields;
    }
    if (!config?.categoryId) {
      updates['config.categoryId'] = legacyCategoryId;
      changed = true;
    }

    if (changed) {
      await Layout.collection.updateOne({ _id: doc._id }, { $set: updates });
      migrated++;
    }
  }

  return migrated;
}

export async function runAllMigrations(): Promise<{ products: number; layouts: number }> {
  const productCount = await migrateLegacyProducts();
  const legacyCategory = await Category.findOne({ name: 'Legacy Jewellery' });
  const layoutCount = legacyCategory
    ? await migrateLegacyLayouts(String(legacyCategory._id))
    : 0;
  return { products: productCount, layouts: layoutCount };
}
