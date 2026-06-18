import type {
  Label,
  Template,
  Layout,
  PreviewData,
  LayoutConfig,
  LabelData,
} from '../types';
import { DEFAULT_CALIBRATION } from '../types';
import { buildInterlockPageConfig } from '../lib/geometryBuilder';

export const DEMO_TEMPLATE_CONFIG = buildInterlockPageConfig(137, 172, {
  stickerCount: 14,
  topMargin: 13,
  bottomMargin: 13,
  leftMargin: 5,
  rightMargin: 5,
  broadWidth: 62,
  broadHeight: 9,
  tailWidth: 61,
  tailHeight: 5,
  sectionA: { x: 0, y: 0, width: 31.1, height: 9 },
  sectionB: { x: 31.1, y: 0, width: 30.9, height: 9 },
  verticalPitch: 9,
});

export const DEMO_LAYOUT_CONFIG: LayoutConfig = {
  fields: [
    {
      id: 'd1',
      type: 'designNumber',
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
      id: 'd2',
      type: 'weight',
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
      id: 'd3',
      type: 'price',
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
      id: 'd4',
      type: 'purity',
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
};

export const DEMO_PRODUCTS: Label[] = [
  {
    _id: 'demo-1',
    name: 'Gold Ring R1001',
    data: { designNumber: 'R1001', weight: '4.350 gm', purity: '22KT', price: '₹56,000', productName: 'Gold Ring' },
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'demo-2',
    name: 'Diamond Necklace N2002',
    data: { designNumber: 'N2002', weight: '12.800 gm', purity: '18KT', price: '₹1,25,000', productName: 'Necklace' },
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'demo-3',
    name: 'Gold Bracelet B3003',
    data: { designNumber: 'B3003', weight: '8.200 gm', purity: '22KT', price: '₹78,500', productName: 'Bracelet' },
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'demo-4',
    name: 'Gold Earrings E4004',
    data: { designNumber: 'E4004', weight: '3.100 gm', purity: '22KT', price: '₹42,000', productName: 'Earrings' },
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'demo-5',
    name: 'Gold Chain C5005',
    data: { designNumber: 'C5005', weight: '6.500 gm', purity: '22KT', price: '₹65,000', productName: 'Chain' },
    createdAt: '',
    updatedAt: '',
  },
];

export const DEMO_TEMPLATE: Template = {
  _id: 'demo-template',
  name: 'Jewellery Tag Sheet 14 (Demo)',
  description: 'Interlocking jewellery sticker sheet — 14 stickers',
  config: DEMO_TEMPLATE_CONFIG,
  createdAt: '',
  updatedAt: '',
};

export const DEMO_LAYOUT: Layout = {
  _id: 'demo-layout',
  name: 'Jewellery Layout (Demo)',
  templateId: 'demo-template',
  config: DEMO_LAYOUT_CONFIG,
  createdAt: '',
  updatedAt: '',
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
      label: labels[i] ?? null,
    })),
    usedPositions: DEMO_USED_POSITIONS,
    mode: 'startFrom',
  };
}

export function getDemoLabelById(id: string): Label | undefined {
  return DEMO_PRODUCTS.find((p) => p._id === id);
}

export function getDemoLabelData(id: string): LabelData | null {
  return getDemoLabelById(id)?.data ?? null;
}
