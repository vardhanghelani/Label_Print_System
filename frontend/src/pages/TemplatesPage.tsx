import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Ruler } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, LoadingSpinner, EmptyState } from '../components/Layout';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Template } from '../types';
import { getTotalPositions, isInterlockTemplate } from '../types';

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: api.templates.list,
  });

  const deleteMutation = useMutation({
    mutationFn: api.templates.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setDeleteId(null);
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Sticker Formats"
        subtitle="Set up your sticker sheet sizes"
        action={
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/formats/new/measure" className="btn-secondary">
              <Ruler className="h-5 w-5" />
              Measure Sticker Sheet
            </Link>
            <Link to="/admin/formats/new" className="btn-primary">
              <Plus className="h-5 w-5" />
              New Grid Format
            </Link>
          </div>
        }
      />

      {!templates?.length ? (
        <EmptyState
          message="No templates yet. Measure your physical sticker sheet to get started."
          action={
            <Link to="/admin/formats/new/measure" className="btn-primary">
              Measure Sticker Sheet
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {templates.map((t: Template) => (
            <div key={t._id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{t.name}</h3>
                  {t.description && <p className="mt-1 text-slate-600">{t.description}</p>}
                  {isInterlockTemplate(t.config) && (
                    <span className="mt-2 inline-block rounded-lg bg-brand-100 px-2 py-1 text-sm font-semibold text-brand-800">
                      Interlock · {getTotalPositions(t.config)} stickers
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {isInterlockTemplate(t.config) && (
                    <Link
                      to={`/admin/formats/${t._id}/measure`}
                      className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"
                      title="Measure / edit geometry"
                    >
                      <Ruler className="h-5 w-5" />
                    </Link>
                  )}
                  <Link
                    to={`/admin/formats/${t._id}/edit`}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  >
                    <Pencil className="h-5 w-5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteId(t._id)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-600">
                <span>Page: {t.config.pageWidth} × {t.config.pageHeight} mm</span>
                <span>Total: {getTotalPositions(t.config)} stickers</span>
                {!isInterlockTemplate(t.config) && (
                  <>
                    <span>Grid: {t.config.rows} × {t.config.columns}</span>
                    <span>Sticker: {t.config.stickerWidth} × {t.config.stickerHeight} mm</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Sticker Format"
        message="Are you sure? Staff use this format for printing. Deleting it may cause problems."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
