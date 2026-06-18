import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, Trash2, Save } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, LoadingSpinner } from '../components/Layout';
import type { CategoryFieldDefinition, FieldDatatype } from '../types';
import { slugifyFieldKey, DATATYPE_LABELS } from '../lib/category';
import { generateFieldId } from './CategoriesPage';

const DATATYPES = Object.keys(DATATYPE_LABELS) as FieldDatatype[];

function emptyField(order: number): CategoryFieldDefinition {
  return {
    id: generateFieldId(),
    name: '',
    key: '',
    datatype: 'text',
    required: false,
    showInSearch: false,
    showInLabel: true,
    visibleInForm: true,
    editable: true,
    readOnly: false,
    sortOrder: order,
    options: [],
  };
}

export default function CategoryEditPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<CategoryFieldDefinition[]>([emptyField(0)]);

  const { data: category, isLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: () => api.categories.get(id!),
    enabled: !isNew && !!id,
  });

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description ?? '');
      setFields(category.config.fields.length ? category.config.fields : [emptyField(0)]);
    }
  }, [category]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        description,
        config: {
          fields: fields
            .filter((f) => f.name.trim())
            .map((f, i) => ({
              ...f,
              key: f.key.trim() || slugifyFieldKey(f.name),
              sortOrder: i,
            })),
        },
      };
      return isNew ? api.categories.create(payload) : api.categories.update(id!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      navigate('/admin/categories');
    },
  });

  const updateField = (idx: number, patch: Partial<CategoryFieldDefinition>) => {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  if (!isNew && isLoading) return <LoadingSpinner />;

  return (
    <div>
      <Link to="/admin/categories" className="btn-secondary mb-6 inline-flex">
        <ChevronLeft className="h-5 w-5" />
        Back
      </Link>

      <PageHeader title={isNew ? 'New Category' : 'Edit Category'} subtitle="Add fields for this product type" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
        className="space-y-6"
      >
        <div className="card grid gap-4 md:grid-cols-2">
          <div>
            <label className="label-text">Category Name</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label-text">Description</label>
            <input className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Fields</h3>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setFields((f) => [...f, emptyField(f.length)])}
            >
              <Plus className="h-4 w-4" />
              Add Field
            </button>
          </div>

          {fields.map((field, idx) => (
            <div key={field.id} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 grid gap-3 md:grid-cols-3">
                <div>
                  <label className="label-text">Field Name</label>
                  <input
                    className="input-field"
                    value={field.name}
                    onChange={(e) =>
                      updateField(idx, {
                        name: e.target.value,
                        key: slugifyFieldKey(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="label-text">Key</label>
                  <input
                    className="input-field font-mono text-base"
                    value={field.key}
                    onChange={(e) => updateField(idx, { key: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-text">Data Type</label>
                  <select
                    className="input-field"
                    value={field.datatype}
                    onChange={(e) => updateField(idx, { datatype: e.target.value as FieldDatatype })}
                  >
                    {DATATYPES.map((dt) => (
                      <option key={dt} value={dt}>
                        {DATATYPE_LABELS[dt]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {field.datatype === 'dropdown' && (
                <div className="mb-3">
                  <label className="label-text">Options (comma separated)</label>
                  <input
                    className="input-field"
                    value={(field.options ?? []).join(', ')}
                    onChange={(e) =>
                      updateField(idx, {
                        options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-sm font-medium">
                {(
                  [
                    ['required', 'Required'],
                    ['showInSearch', 'Show In Search'],
                    ['showInLabel', 'Show In Label'],
                    ['visibleInForm', 'Visible In Form'],
                    ['editable', 'Editable'],
                    ['readOnly', 'Read Only'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field[key]}
                      onChange={(e) => updateField(idx, { [key]: e.target.checked })}
                    />
                    {label}
                  </label>
                ))}
              </div>

              <button
                type="button"
                className="btn-danger mt-3"
                onClick={() => setFields((f) => f.filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
          ))}
        </div>

        <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
          <Save className="h-5 w-5" />
          {saveMutation.isPending ? 'Saving...' : 'Save Category'}
        </button>
      </form>
    </div>
  );
}
