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
  /** Key used in product.values — auto-generated from name if omitted */
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

export interface CategoryConfig {
  fields: CategoryFieldDefinition[];
}

export interface CategoryDocument {
  name: string;
  description?: string;
  config: CategoryConfig;
  defaultLayoutId?: string;
}

/** Dynamic product values — keys match CategoryFieldDefinition.key */
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
