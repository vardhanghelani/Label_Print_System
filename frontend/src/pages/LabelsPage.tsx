import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, LoadingSpinner, EmptyState } from '../components/Layout';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Label, Category, CategoryFieldDefinition, ProductValues } from '../types';
import { formatFieldValue } from '../lib/category';

function productSummary(label: Label, category?: Category): string {
  if (!category) return label.name;
  const parts = category.config.fields
    .filter((f) => f.showInSearch || f.key === 'design_number' || f.key === 'price')
    .slice(0, 3)
    .map((f) => formatFieldValue(label.values[f.key], f.datatype))
    .filter(Boolean);
  return parts.join(' · ') || label.name;
}

export default function LabelsPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Label | null>(null);
  const [search, setSearch] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [values, setValues] = useState<ProductValues>({});

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.list,
  });

  const { data: labels, isLoading } = useQuery({
    queryKey: ['labels'],
    queryFn: () => api.labels.list(),
  });

  const selectedCategory = categories?.find((c) => c._id === categoryId);

  const filtered = useMemo(() => {
    if (!labels) return [];
    if (!search.trim()) return labels;
    return labels.filter((l) => {
      const cat = categories?.find((c) => c._id === l.categoryId);
      const keys = cat?.config.fields.filter((f) => f.showInSearch).map((f) => f.key) ?? [];
      const haystack = [l.name, ...keys.map((k) => l.values[k])].join(' ').toLowerCase();
      return haystack.includes(search.trim().toLowerCase());
    });
  }, [labels, search, categories]);

  const saveMutation = useMutation({
    mutationFn: (payload: { name: string; categoryId: string; values: ProductValues }) =>
      editing ? api.labels.update(editing._id, payload) : api.labels.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.labels.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      setDeleteId(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setName('');
    setCategoryId('');
    setValues({});
    setStep(1);
    setFormOpen(true);
  };

  const openEdit = (label: Label) => {
    setEditing(label);
    setName(label.name);
    setCategoryId(label.categoryId);
    setValues({ ...label.values });
    setStep(2);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setStep(1);
  };

  const renderFieldInput = (field: CategoryFieldDefinition) => {
    const val = values[field.key];
    const disabled = field.readOnly || !field.editable;
    const set = (v: string | number | boolean) => setValues({ ...values, [field.key]: v });

    if (field.datatype === 'dropdown') {
      return (
        <select
          className="input-field"
          value={String(val ?? '')}
          disabled={disabled}
          onChange={(e) => set(e.target.value)}
          required={field.required}
        >
          <option value="">Select...</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    }
    if (field.datatype === 'checkbox') {
      return (
        <label className="flex min-h-[52px] items-center gap-3">
          <input
            type="checkbox"
            checked={!!val}
            disabled={disabled}
            onChange={(e) => set(e.target.checked)}
          />
          <span>Yes</span>
        </label>
      );
    }
    if (field.datatype === 'multiline') {
      return (
        <textarea
          className="input-field min-h-[100px]"
          value={String(val ?? '')}
          disabled={disabled}
          onChange={(e) => set(e.target.value)}
          required={field.required}
        />
      );
    }
    return (
      <input
        type={field.datatype === 'number' || field.datatype === 'decimal' || field.datatype === 'currency' ? 'number' : 'text'}
        className="input-field"
        value={String(val ?? field.defaultValue ?? '')}
        disabled={disabled}
        onChange={(e) =>
          set(
            field.datatype === 'number' || field.datatype === 'decimal' || field.datatype === 'currency'
              ? parseFloat(e.target.value) || 0
              : e.target.value
          )
        }
        required={field.required}
      />
    );
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Label Data"
        subtitle="Products use category fields — no fixed columns"
        action={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-5 w-5" />
            Add Product
          </button>
        }
      />

      {labels?.length ? (
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            className="input-field pl-14"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      ) : null}

      {formOpen && (
        <div className="card mb-6">
          <h3 className="mb-4 text-2xl font-bold">{editing ? 'Edit Product' : 'Add Product'}</h3>

          {step === 1 && !editing && (
            <div>
              <p className="mb-4 text-lg text-slate-600">Step 1 — Select category</p>
              <div className="grid gap-3">
                {categories?.map((cat) => (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => {
                      setCategoryId(cat._id);
                      const defaults: ProductValues = {};
                      cat.config.fields.forEach((f) => {
                        if (f.defaultValue) defaults[f.key] = f.defaultValue;
                      });
                      setValues(defaults);
                      setStep(2);
                    }}
                    className="flex items-center justify-between rounded-xl border-2 border-slate-200 p-4 text-left hover:border-brand-400"
                  >
                    <span className="text-xl font-bold">{cat.name}</span>
                    <ChevronRight className="h-6 w-6" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedCategory && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate({ name, categoryId, values });
              }}
              className="space-y-5"
            >
              <p className="text-lg text-slate-600">
                Step 2 — {selectedCategory.name} fields
              </p>
              <div>
                <label className="label-text">Product Name</label>
                <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              {selectedCategory.config.fields
                .filter((f) => f.visibleInForm)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((field) => (
                  <div key={field.id}>
                    <label className="label-text">
                      {field.name}
                      {field.required && ' *'}
                    </label>
                    {renderFieldInput(field)}
                  </div>
                ))}
              <div className="flex gap-3">
                <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
                  Save Product
                </button>
                {!editing && (
                  <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                    Back
                  </button>
                )}
                <button type="button" className="btn-secondary" onClick={closeForm}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {!labels?.length ? (
        <EmptyState message="No products yet. Create a category first, then add products." />
      ) : (
        <div className="space-y-3">
          {filtered.map((label) => {
            const cat = categories?.find((c) => c._id === label.categoryId);
            return (
              <div key={label._id} className="card flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold">{label.name}</p>
                  <p className="truncate text-lg text-slate-600">
                    {cat?.name} · {productSummary(label, cat)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" className="btn-secondary" onClick={() => openEdit(label)}>
                    <Pencil className="h-5 w-5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-xl p-3 text-red-500 hover:bg-red-50"
                    onClick={() => setDeleteId(label._id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Product"
        message="Are you sure?"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
