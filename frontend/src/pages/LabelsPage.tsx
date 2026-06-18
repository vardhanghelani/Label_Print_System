import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, LoadingSpinner, EmptyState } from '../components/Layout';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { filterLabels } from '../types';
import type { Label, LabelData } from '../types';

const EMPTY_LABEL: LabelData = {
  productName: '',
  designNumber: '',
  category: '',
  weight: '',
  purity: '',
  price: '',
  makingCharge: '',
  sku: '',
  notes: '',
  storeName: '',
};

const PRODUCT_FIELDS: { key: keyof LabelData; label: string }[] = [
  { key: 'designNumber', label: 'Design Number' },
  { key: 'category', label: 'Category' },
  { key: 'weight', label: 'Weight' },
  { key: 'purity', label: 'Purity' },
  { key: 'price', label: 'Price' },
  { key: 'makingCharge', label: 'Making Charge' },
  { key: 'sku', label: 'SKU' },
  { key: 'storeName', label: 'Store Name' },
  { key: 'notes', label: 'Notes' },
];

export default function LabelsPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Label | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [data, setData] = useState<LabelData>({ ...EMPTY_LABEL });

  const { data: labels, isLoading } = useQuery({
    queryKey: ['labels'],
    queryFn: api.labels.list,
  });

  const filtered = useMemo(() => filterLabels(search, labels ?? []), [search, labels]);

  const saveMutation = useMutation({
    mutationFn: (payload: { name: string; data: LabelData }) =>
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
    setData({ ...EMPTY_LABEL });
    setFormOpen(true);
  };

  const openEdit = (label: Label) => {
    setEditing(label);
    setName(label.name);
    setData({ ...EMPTY_LABEL, ...label.data });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Label Data"
        subtitle="Add product details for your stickers"
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
            className="input-field pl-14 text-xl"
            placeholder="Search design no, ring, necklace..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      ) : null}

      {formOpen && (
        <div className="card mb-6">
          <h3 className="mb-4 text-2xl font-bold">{editing ? 'Edit Product' : 'Add New Product'}</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate({ name, data });
            }}
            className="space-y-5"
          >
            <div>
              <label className="label-text">Product Name</label>
              <input
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Gold Ring R1001"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {PRODUCT_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label className="label-text">{label}</label>
                  <input
                    className="input-field"
                    value={data[key] ?? ''}
                    onChange={(e) => setData({ ...data, [key]: e.target.value })}
                    placeholder={label}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save Product'}
              </button>
              <button type="button" className="btn-secondary" onClick={closeForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!labels?.length ? (
        <EmptyState message="No products yet. Add your first product to start printing labels." />
      ) : (
        <div className="space-y-3">
          {filtered.map((label) => (
            <div key={label._id} className="card flex items-center justify-between gap-4">
              <div>
                <p className="text-xl font-bold">{label.name}</p>
                <p className="text-lg text-slate-600">
                  {label.data.designNumber} · {label.data.weight} · {label.data.price}
                </p>
              </div>
              <div className="flex gap-2">
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
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Product"
        message="Are you sure you want to delete this product?"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
