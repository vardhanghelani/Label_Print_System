import type { ILabel } from '../models/Label.js';
import type { ProductValues } from '../types/category.js';

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

function mapLegacyData(data: Record<string, unknown>): ProductValues {
  const values: ProductValues = {};
  for (const [oldKey, newKey] of Object.entries(LEGACY_FIELD_MAP)) {
    const v = data[oldKey];
    if (v !== undefined && v !== null && v !== '') {
      values[newKey] = v as string | number | boolean;
    }
  }
  for (const [key, v] of Object.entries(data)) {
    if (v !== undefined && v !== null && v !== '' && !LEGACY_FIELD_MAP[key]) {
      values[key] = v as string | number | boolean;
    }
  }
  return values;
}

/** Normalize legacy `data` field → `values` for API responses and print engine */
export function normalizeLabelValues(
  doc: Record<string, unknown>
): ProductValues {
  const existing = doc.values as ProductValues | undefined;
  if (existing && Object.keys(existing).length > 0) {
    return existing;
  }
  const legacy = doc.data as Record<string, unknown> | undefined;
  if (legacy && Object.keys(legacy).length > 0) {
    return mapLegacyData(legacy);
  }
  return {};
}

export function normalizeLabel<T extends Record<string, unknown>>(doc: T): T & { values: ProductValues } {
  const values = normalizeLabelValues(doc);
  return { ...doc, values };
}

export function toPublicLabel(label: ILabel | Record<string, unknown>) {
  const raw = typeof (label as ILabel).toObject === 'function'
    ? (label as ILabel).toObject()
    : { ...label };
  const normalized = normalizeLabel(raw as Record<string, unknown>);
  return {
    ...normalized,
    _id: String(normalized._id),
    categoryId: normalized.categoryId ? String(normalized.categoryId) : normalized.categoryId,
  };
}
