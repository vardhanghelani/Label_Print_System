import type { Category, Layout, LayoutField, LayoutSection } from '../types';
import { isJewelleryTemplate, type PageConfig } from '../types';

/** Jewellery broad printable area — must match geometryBuilder DEFAULT_INTERLOCK_GEOMETRY */
const JEWELLERY_BROAD_HEIGHT_MM = 14;
const JEWELLERY_BROAD_WIDTH_MM = 50;
const JEWELLERY_SECTION_WIDTH_MM = 25;
/** Vertical pitch per text line inside 14mm-tall broad area */
const JEWELLERY_LINE_PITCH_MM = 3.2;
const JEWELLERY_MAX_LINES = Math.min(
  4,
  Math.floor((JEWELLERY_BROAD_HEIGHT_MM - 0.4) / JEWELLERY_LINE_PITCH_MM)
);

/**
 * Duplicate each field into Section A and Section B with identical content.
 * Client spec: both 25×14 mm halves show the same text.
 */
export function duplicateFieldsToBothSections(fields: LayoutField[]): LayoutField[] {
  const sectionWidth = JEWELLERY_SECTION_WIDTH_MM - 1;
  const result: LayoutField[] = [];
  const handled = new Set<string>();

  for (const field of fields) {
    if (field.type === 'logo') {
      result.push(field);
      continue;
    }

    const identity = field.fieldKey ?? field.id;
    if (handled.has(identity)) continue;
    handled.add(identity);

    const base: LayoutField = {
      ...field,
      width: Math.min(field.width, sectionWidth),
      x: field.x ?? 0.5,
    };

    result.push({ ...base, id: `${field.id}_a`, section: 'A' as LayoutSection });
    result.push({ ...base, id: `${field.id}_b`, section: 'B' as LayoutSection });
  }

  return result;
}

function finalizeJewelleryFields(fields: LayoutField[], pageConfig?: PageConfig): LayoutField[] {
  if (pageConfig && isJewelleryTemplate(pageConfig)) {
    return duplicateFieldsToBothSections(fields);
  }
  return fields;
}

/**
 * Auto-place category showInLabel fields inside the 50×14mm broad sticker area.
 * Fields stack top-to-bottom; duplicated to A+B at finalize time.
 */
export function buildAutoLayoutFields(category: Category, pageConfig?: PageConfig): LayoutField[] {
  const jewellery = pageConfig ? isJewelleryTemplate(pageConfig) : true;
  const printable = category.config.fields
    .filter((f) => f.showInLabel)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (!printable.length) return [];

  const toPlace = jewellery ? printable.slice(0, JEWELLERY_MAX_LINES) : printable;

  const fields = toPlace.map((cf, i) => {
    let section: LayoutSection = 'full';
    let y = 0.3 + i * 4;
    let width = 28;
    let alignment: LayoutField['alignment'] = 'left';
    let fontSize = i === 0 ? 7 : 6;
    let height = 3.5;

    if (jewellery) {
      section = 'full';
      y = 0.2 + i * JEWELLERY_LINE_PITCH_MM;
      width = JEWELLERY_BROAD_WIDTH_MM - 1;
      height = JEWELLERY_LINE_PITCH_MM;
      fontSize = i === 0 ? 8 : 7;
      alignment = 'left';
    }

    return {
      id: `cat_${cf.id}`,
      type: 'categoryField' as const,
      fieldKey: cf.key,
      label: cf.name,
      categoryId: category._id,
      section,
      x: 0.5,
      y,
      width,
      height,
      fontSize,
      bold: i === 0,
      italic: false,
      alignment,
    };
  });

  return finalizeJewelleryFields(fields, pageConfig);
}

export { JEWELLERY_BROAD_HEIGHT_MM, JEWELLERY_BROAD_WIDTH_MM, JEWELLERY_MAX_LINES };

/**
 * Resolve print fields for a category:
 * 1) category.defaultLayoutId layout
 * 2) layout bound via config.categoryId
 * 3) auto-generated from category field definitions
 */
export function resolveLayoutFieldsForCategory(
  category: Category | undefined,
  layouts: Layout[] | undefined,
  templateId: string | undefined,
  pageConfig?: PageConfig
): LayoutField[] {
  if (!category) return [];

  if (category.defaultLayoutId && layouts?.length) {
    const byDefault = layouts.find((l) => l._id === category.defaultLayoutId);
    if (byDefault?.config.fields?.length) {
      return finalizeJewelleryFields(
        filterFieldsForCategory(byDefault.config.fields, category._id),
        pageConfig
      );
    }
  }

  if (layouts?.length && templateId) {
    const bound = layouts.find(
      (l) => l.templateId === templateId && l.config.categoryId === category._id
    );
    if (bound?.config.fields?.length) {
      return finalizeJewelleryFields(
        filterFieldsForCategory(bound.config.fields, category._id),
        pageConfig
      );
    }
  }

  return buildAutoLayoutFields(category, pageConfig);
}

/** Keep fields that belong to this category or have no categoryId */
function filterFieldsForCategory(fields: LayoutField[], categoryId: string): LayoutField[] {
  const scoped = fields.filter(
    (f) => !f.categoryId || f.categoryId === categoryId
  );
  return scoped.length ? scoped : fields;
}

export function createCategoryFieldsResolver(
  categoryMap: Map<string, Category>,
  layouts: Layout[] | undefined,
  templateId: string | undefined,
  pageConfig?: PageConfig
) {
  return (categoryId: string | undefined): LayoutField[] => {
    if (!categoryId) return [];
    return resolveLayoutFieldsForCategory(
      categoryMap.get(categoryId),
      layouts,
      templateId,
      pageConfig
    );
  };
}
