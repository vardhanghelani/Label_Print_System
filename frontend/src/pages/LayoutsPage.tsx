import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, LoadingSpinner, EmptyState } from '../components/Layout';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Layout, Template } from '../types';

export default function LayoutsPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: layouts, isLoading: loadingLayouts } = useQuery({
    queryKey: ['layouts'],
    queryFn: () => api.layouts.list(),
  });

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: api.templates.list,
  });

  const templateMap = new Map(templates?.map((t: Template) => [t._id, t.name]));

  const deleteMutation = useMutation({
    mutationFn: api.layouts.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
      setDeleteId(null);
    },
  });

  if (loadingLayouts) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Label Design"
        subtitle="Design how information appears on each sticker"
        action={
          <Link to="/admin/designs/new" className="btn-primary">
            <Plus className="h-5 w-5" />
            New Layout
          </Link>
        }
      />

      {!layouts?.length ? (
        <EmptyState
          message="No layouts yet. Create a layout for your sticker template."
          action={
            <Link to="/admin/designs/new" className="btn-primary">
              Create Design
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {layouts.map((l: Layout) => (
            <div key={l._id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{l.name}</h3>
                  <p className="mt-1 text-slate-600">
                    Template: {templateMap.get(l.templateId) ?? 'Unknown'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/admin/designs/${l._id}/edit`}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  >
                    <Pencil className="h-5 w-5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteId(l._id)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                {l.config.fields.length} field{l.config.fields.length !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Layout"
        message="Are you sure you want to delete this layout?"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
