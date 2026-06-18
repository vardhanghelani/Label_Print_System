import type { Category, CategoryFieldDefinition } from '../types';
import { slugifyFieldKey, DATATYPE_LABELS } from '../lib/category';
import { PageHeader, LoadingSpinner } from '../components/Layout';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Pencil } from 'lucide-react';
import { api } from '../services/api';

export default function CategoriesPage() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.list,
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Define product categories and custom fields"
        action={
          <Link to="/admin/categories/new" className="btn-primary">
            <Plus className="h-5 w-5" />
            New Category
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {categories?.map((cat: Category) => (
          <div key={cat._id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{cat.name}</h3>
                {cat.description && <p className="mt-1 text-slate-600">{cat.description}</p>}
                <p className="mt-2 text-sm text-slate-500">{cat.config.fields.length} fields</p>
              </div>
              <Link to={`/admin/categories/${cat._id}`} className="rounded-lg p-2 hover:bg-slate-100">
                <Pencil className="h-5 w-5" />
              </Link>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {cat.config.fields.slice(0, 6).map((f: CategoryFieldDefinition) => (
                <span key={f.id} className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium">
                  {f.name}
                </span>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function generateFieldId() {
  return `fld_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export { slugifyFieldKey, DATATYPE_LABELS };
