import type { Label, PreviewData, ProductValues, Category } from '../types';
import { DEFAULT_CALIBRATION } from '../types';
import {
  JEWELLERY_TEMPLATE,
  JEWELLERY_LAYOUT,
  JEWELLERY_SHEET_CONFIG,
  JEWELLERY_LAYOUT_CONFIG,
} from './jewellerySheet';

export const DEMO_CATEGORY_ID = 'demo-ring';

/** Category-driven demo — no hardcoded jewellery field keys */
export const DEMO_CATEGORY: Category = {
  _id: DEMO_CATEGORY_ID,
  name: 'Demo Ring',
  description: 'Demo category for quick print preview',
  config: {
    fields: [
      {
        id: 'df1',
        name: 'Item Code',
        key: 'item_code',
        datatype: 'text',
        required: false,
        showInSearch: true,
        showInLabel: true,
        visibleInForm: true,
        editable: true,
        readOnly: false,
        sortOrder: 0,
      },
      {
        id: 'df2',
        name: 'Weight',
        key: 'weight',
        datatype: 'number',
        required: false,
        showInSearch: false,
        showInLabel: true,
        visibleInForm: true,
        editable: true,
        readOnly: false,
        sortOrder: 1,
      },
      {
        id: 'df3',
        name: 'Price',
        key: 'price',
        datatype: 'currency',
        required: false,
        showInSearch: true,
        showInLabel: true,
        visibleInForm: true,
        editable: true,
        readOnly: false,
        sortOrder: 2,
      },
    ],
  },
  createdAt: '',
  updatedAt: '',
};

export const DEMO_TEMPLATE_CONFIG = JEWELLERY_SHEET_CONFIG;
export const DEMO_LAYOUT_CONFIG = JEWELLERY_LAYOUT_CONFIG;

export const DEMO_PRODUCTS: Label[] = [
  {
    _id: 'demo-1',
    name: 'Gold Ring R1001',
    categoryId: DEMO_CATEGORY_ID,
    values: { item_code: 'R1001', weight: '4.350', price: '56000' },
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'demo-2',
    name: 'Pendant P2002',
    categoryId: DEMO_CATEGORY_ID,
    values: { item_code: 'P2002', weight: '12.800', price: '125000' },
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'demo-3',
    name: 'Chain C3003',
    categoryId: DEMO_CATEGORY_ID,
    values: { item_code: 'C3003', weight: '8.200', price: '78500' },
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'demo-4',
    name: 'Ring E4004',
    categoryId: DEMO_CATEGORY_ID,
    values: { item_code: 'E4004', weight: '3.100', price: '42000' },
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'demo-5',
    name: 'Chain C5005',
    categoryId: DEMO_CATEGORY_ID,
    values: { item_code: 'C5005', weight: '6.500', price: '65000' },
    createdAt: '',
    updatedAt: '',
  },
];

export const DEMO_TEMPLATE = {
  ...JEWELLERY_TEMPLATE,
  name: `${JEWELLERY_TEMPLATE.name} (Demo)`,
};

export const DEMO_LAYOUT = {
  ...JEWELLERY_LAYOUT,
  name: `${JEWELLERY_LAYOUT.name} (Demo)`,
};

export const DEMO_USED_POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8];
export const DEMO_START_POSITION = 9;
export const DEMO_SELECTED_IDS = ['demo-1', 'demo-2', 'demo-3', 'demo-4'];
export const DEMO_PRINT_POSITIONS = [9, 10, 11, 12];

export function buildDemoPreview(): PreviewData {
  const labels = DEMO_SELECTED_IDS.map((id) => DEMO_PRODUCTS.find((p) => p._id === id)!);

  return {
    template: DEMO_TEMPLATE,
    layout: DEMO_LAYOUT,
    calibration: { ...DEFAULT_CALIBRATION },
    printPositions: DEMO_PRINT_POSITIONS,
    positionLabelMap: DEMO_PRINT_POSITIONS.map((pos, i) => ({
      position: pos,
      label: labels[i]?.values ?? null,
      categoryId: DEMO_CATEGORY_ID,
    })),
    usedPositions: DEMO_USED_POSITIONS,
    mode: 'startFrom',
  };
}

export function getDemoLabelById(id: string): Label | undefined {
  return DEMO_PRODUCTS.find((p) => p._id === id);
}

export function getDemoLabelData(id: string): ProductValues | null {
  return getDemoLabelById(id)?.values ?? null;
}

export function productDisplayLine(label: Label): string {
  return categoryFieldSummary(label, DEMO_CATEGORY);
}

function categoryFieldSummary(label: Label, category: Category): string {
  const parts = category.config.fields
    .filter((f) => f.showInLabel)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 3)
    .map((f) => label.values[f.key])
    .filter(Boolean)
    .map(String);
  return parts.join(' · ') || label.name;
}
