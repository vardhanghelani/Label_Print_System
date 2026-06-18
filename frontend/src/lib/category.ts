export type FieldDatatype =
  | 'text'
  | 'number'
  | 'decimal'
  | 'currency'
  | 'date'
  | 'dropdown'
  | 'checkbox'
  | 'multiline'
  | 'phone'
  | 'email';

export interface CategoryFieldDefinition {
  id: string;
  name: string;
  key: string;
  datatype: FieldDatatype;
  required: boolean;
  showInSearch: boolean;
  showInLabel: boolean;
  visibleInForm: boolean;
  editable: boolean;
  readOnly: boolean;
  defaultValue?: string;
  sortOrder: number;
  options?: string[];
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  config: { fields: CategoryFieldDefinition[] };
  defaultLayoutId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductValues = Record<string, string | number | boolean | null | undefined>;

export function slugifyFieldKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48) || 'field';
}

export function formatFieldValue(value: unknown, datatype: FieldDatatype): string {
  if (value === null || value === undefined) return '';
  if (datatype === 'checkbox') return value ? 'Yes' : '';
  if (datatype === 'currency' && typeof value === 'number') {
    return `₹${value.toLocaleString('en-IN')}`;
  }
  return String(value);
}

export function buildSearchHaystack(
  productName: string,
  categoryName: string | undefined,
  values: ProductValues,
  searchableKeys: string[]
): string {
  const parts = [productName, categoryName, ...searchableKeys.map((k) => values[k])];
  return parts.filter(Boolean).join(' ').toLowerCase();
}

export function productSummaryLine(
  label: { name: string; values: ProductValues },
  category?: Category
): string {
  if (category?.config.fields.length) {
    const parts = category.config.fields
      .filter((f) => f.showInLabel)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, 4)
      .map((f) => formatFieldValue(label.values[f.key], f.datatype))
      .filter(Boolean);
    if (parts.length) return parts.join(' · ');
  }
  return Object.values(label.values ?? {})
    .filter((v) => v !== null && v !== undefined && v !== '')
    .slice(0, 3)
    .map(String)
    .join(' · ');
}

export const DATATYPE_LABELS: Record<FieldDatatype, string> = {
  text: 'Text',
  number: 'Number',
  decimal: 'Decimal',
  currency: 'Currency',
  date: 'Date',
  dropdown: 'Dropdown',
  checkbox: 'Checkbox',
  multiline: 'Multiline Text',
  phone: 'Phone',
  email: 'Email',
};
