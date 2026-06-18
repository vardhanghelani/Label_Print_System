import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { PageHeader, LoadingSpinner } from '../components/Layout';
import type { PageConfig } from '../types';
import { DEFAULT_PAGE_CONFIG, isJewelleryTemplate } from '../types';

const NUMERIC_CONFIG_KEYS = [
  'pageWidth',
  'pageHeight',
  'rows',
  'columns',
  'stickerWidth',
  'stickerHeight',
  'horizontalGap',
  'verticalGap',
  'topMargin',
  'bottomMargin',
  'leftMargin',
  'rightMargin',
  'printableAreaWidth',
  'printableAreaHeight',
  'stickerCount',
  'verticalPitch',
] as const;

type NumericConfigKey = (typeof NUMERIC_CONFIG_KEYS)[number];

const CONFIG_FIELDS: { key: NumericConfigKey; label: string; group: string }[] = [
  { key: 'pageWidth', label: 'Page Width (mm)', group: 'Page' },
  { key: 'pageHeight', label: 'Page Height (mm)', group: 'Page' },
  { key: 'rows', label: 'Rows', group: 'Grid' },
  { key: 'columns', label: 'Columns', group: 'Grid' },
  { key: 'stickerWidth', label: 'Sticker Width (mm)', group: 'Sticker' },
  { key: 'stickerHeight', label: 'Sticker Height (mm)', group: 'Sticker' },
  { key: 'horizontalGap', label: 'Horizontal Gap (mm)', group: 'Spacing' },
  { key: 'verticalGap', label: 'Vertical Gap (mm)', group: 'Spacing' },
  { key: 'topMargin', label: 'Top Margin (mm)', group: 'Margins' },
  { key: 'bottomMargin', label: 'Bottom Margin (mm)', group: 'Margins' },
  { key: 'leftMargin', label: 'Left Margin (mm)', group: 'Margins' },
  { key: 'rightMargin', label: 'Right Margin (mm)', group: 'Margins' },
  { key: 'printableAreaWidth', label: 'Printable Area Width (mm)', group: 'Printable' },
  { key: 'printableAreaHeight', label: 'Printable Area Height (mm)', group: 'Printable' },
  { key: 'stickerCount', label: 'Sticker Count', group: 'Jewellery' },
  { key: 'verticalPitch', label: 'Vertical Pitch (mm)', group: 'Jewellery' },
];

export default function TemplateDesignerPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState<PageConfig>({ ...DEFAULT_PAGE_CONFIG });

  const { data: template, isLoading } = useQuery({
    queryKey: ['template', id],
    queryFn: () => api.templates.get(id!),
    enabled: !isNew && !!id,
  });

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description ?? '');
      setConfig(template.config);
    }
  }, [template]);

  const saveMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; config: PageConfig }) =>
      isNew ? api.templates.create(data) : api.templates.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      navigate('/admin/formats');
    },
  });

  const updateConfig = (key: NumericConfigKey, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (!isNew && isLoading) return <LoadingSpinner />;

  const groups = [...new Set(CONFIG_FIELDS.map((f) => f.group))];

  return (
    <div>
      <PageHeader
        title={isNew ? 'New Sticker Format' : 'Edit Sticker Format'}
        subtitle="Set page and sticker sizes (all in millimeters)"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate({ name, description, config });
        }}
        className="space-y-6"
      >
        <div className="card">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="label-text">Template Name</label>
              <input
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Jewellery Tag Sheet"
              />
            </div>
            <div>
              <label className="label-text">Description</label>
              <input
                className="input-field"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
        </div>

        {isJewelleryTemplate(config) && (
          <div className="card border-2 border-amber-200 bg-amber-50">
            <h3 className="mb-2 text-lg font-semibold text-amber-900">Jewellery Interlock Sheet</h3>
            <p className="text-slate-700">
              This template has {config.stickerCount ?? config.stickers?.length ?? 14} individually
              addressable sticker positions. Sticker coordinates are defined in the template data
              and cannot be edited as a grid here.
            </p>
          </div>
        )}

        {groups.map((group) => (
          <div key={group} className="card">
            <h3 className="mb-4 text-lg font-semibold">{group}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CONFIG_FIELDS.filter((f) => f.group === group).map(({ key, label }) => (
                <div key={key}>
                  <label className="label-text">{label}</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-field"
                    value={config[key] ?? ''}
                    onChange={(e) => updateConfig(key, parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save Template'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin/formats')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
