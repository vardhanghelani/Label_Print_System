import { connectDatabase, disconnectDatabase } from './config/database.js';
import { config } from './config/index.js';
import { Template } from './models/Template.js';
import { Layout } from './models/Layout.js';
import { Label } from './models/Label.js';
import { Settings } from './models/Settings.js';
import { User } from './models/User.js';
import { DEFAULT_CALIBRATION, buildInterlockPageConfig } from './types/index.js';

const SAMPLE_TEMPLATES = [
  {
    name: 'Jewellery Tag Sheet 14',
    description: 'Interlocking jewellery sticker sheet — 14 stickers (137×172 mm)',
    config: buildInterlockPageConfig(137, 172, {
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
    }),
  },
  {
    name: '48 Labels Per Sheet',
    description: 'Compact A4 sheet with 48 labels (6×8)',
    config: {
      pageWidth: 210,
      pageHeight: 297,
      rows: 8,
      columns: 6,
      stickerWidth: 30,
      stickerHeight: 20,
      horizontalGap: 2,
      verticalGap: 2,
      topMargin: 8,
      bottomMargin: 8,
      leftMargin: 6,
      rightMargin: 6,
      printableAreaWidth: 198,
      printableAreaHeight: 281,
    },
  },
  {
    name: 'Jewellery Tag Sheet',
    description: 'Large tag format for necklaces and bracelets',
    config: {
      pageWidth: 210,
      pageHeight: 297,
      rows: 4,
      columns: 3,
      stickerWidth: 60,
      stickerHeight: 40,
      horizontalGap: 5,
      verticalGap: 5,
      topMargin: 12,
      bottomMargin: 12,
      leftMargin: 10,
      rightMargin: 10,
      printableAreaWidth: 190,
      printableAreaHeight: 273,
    },
  },
  {
    name: 'Ring Tag Sheet',
    description: 'Small ring tags (8×12 grid)',
    config: {
      pageWidth: 210,
      pageHeight: 297,
      rows: 12,
      columns: 8,
      stickerWidth: 22,
      stickerHeight: 15,
      horizontalGap: 1.5,
      verticalGap: 1.5,
      topMargin: 8,
      bottomMargin: 8,
      leftMargin: 5,
      rightMargin: 5,
      printableAreaWidth: 200,
      printableAreaHeight: 281,
    },
  },
];

async function seed() {
  await connectDatabase(config.mongoUri);

  await Promise.all([
    Template.deleteMany({}),
    Layout.deleteMany({}),
    Label.deleteMany({}),
    Settings.deleteMany({}),
    User.deleteMany({}),
  ]);

  const templates = await Template.insertMany(SAMPLE_TEMPLATES);
  const defaultTemplate = templates[0];

  const defaultLayout = await Layout.create({
    name: 'Jewellery Tag Layout',
    templateId: defaultTemplate._id,
    config: {
      fields: [
        {
          id: 'f1',
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
          id: 'f2',
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
          id: 'f3',
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
          id: 'f4',
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
    },
  });

  await Label.insertMany([
    {
      name: 'Ring R1001',
      data: {
        designNumber: 'R1001',
        weight: '4.350 gm',
        purity: '22KT',
        price: '₹56,000',
        productName: 'Gold Ring',
      },
    },
    {
      name: 'Necklace N2002',
      data: {
        designNumber: 'N2002',
        weight: '12.800 gm',
        purity: '18KT',
        price: '₹1,25,000',
        productName: 'Diamond Necklace',
      },
    },
    {
      name: 'Bracelet B3003',
      data: {
        designNumber: 'B3003',
        weight: '8.200 gm',
        purity: '22KT',
        price: '₹78,500',
        productName: 'Gold Bracelet',
      },
    },
    {
      name: 'Earrings E4004',
      data: {
        designNumber: 'E4004',
        weight: '3.100 gm',
        purity: '22KT',
        price: '₹42,000',
        productName: 'Gold Earrings',
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
  console.log(`  Default layout: ${defaultLayout.name}`);
  console.log(`  Labels: 4`);

  await disconnectDatabase();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
