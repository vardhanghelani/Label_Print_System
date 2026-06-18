import type { Category, Layout, LayoutField, LayoutSection } from '../types';
import { isJewelleryTemplate, type PageConfig } from '../types';

/** Auto-place category showInLabel fields on jewellery section A / B */
export function buildAutoLayoutFields(category: Category, pageConfig?: PageConfig): LayoutField[] {
  const jewellery = pageConfig ? isJewelleryTemplate(pageConfig) : true;
  const printable = category.config.fields
    .filter((f) => f.showInLabel)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (!printable.length) return [];

  const half = Math.ceil(printable.length / 2);

  return printable.map((cf, i) => {
    let section: LayoutSection = 'full';
    let y = 0.3 + i * 4;
    let width = 28;
    let alignment: LayoutField['alignment'] = 'left';

    if (jewellery) {
      const inA = i < half;
      section = inA ? 'A' : 'B';
      const idxInSection = inA ? i : i - half;
      y = 0.3 + idxInSection * 4.2;
      width = inA ? 30 : 29.5;
      alignment = inA ? 'left' : i === half ? 'center' : 'right';
    }

    return {
      id: `cat_${cf.id}`,
      type: 'categoryField',
      fieldKey: cf.key,
      label: cf.name,
      categoryId: category._id,
      section,
      x: 0.5,
      y,
      width,
      height: 3.5,
      fontSize: i === 0 ? 7 : 6,
      bold: i === 0,
      italic: false,
      alignment,
    };
  });
}

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
      return filterFieldsForCategory(byDefault.config.fields, category._id);
    }
  }

  if (layouts?.length && templateId) {
    const bound = layouts.find(
      (l) => l.templateId === templateId && l.config.categoryId === category._id
    );
    if (bound?.config.fields?.length) {
      return filterFieldsForCategory(bound.config.fields, category._id);
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
