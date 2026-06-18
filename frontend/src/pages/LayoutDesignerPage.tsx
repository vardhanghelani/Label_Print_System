import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, LoadingSpinner } from '../components/Layout';
import type { LayoutField, FieldType, PageConfig } from '../types';
import { isJewelleryTemplate, resolveFieldValue, FIELD_TYPE_LABELS } from '../types';
import type { InterlockSheetGeometry } from '../lib/geometryBuilder';
import { mmToPx, PREVIEW_SCALE } from '../lib/units';

const ADDABLE_FIELDS: FieldType[] = [
  'designNumber',
  'category',
  'weight',
  'purity',
  'price',
  'makingCharge',
  'sku',
  'productName',
  'storeName',
  'notes',
  'customField1',
  'customField2',
  'customField3',
  'text',
  'staticBranding',
  'logo',
];

const SAMPLE_LABEL = {
  designNumber: 'R1001',
  category: 'Ring',
  weight: '4.350 gm',
  purity: '22KT',
  price: '₹56,000',
  makingCharge: '₹2,500',
  sku: 'SKU-1001',
  productName: 'Gold Ring',
  storeName: 'ABC Jewellers',
  notes: 'Hallmarked',
};

function generateId() {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function LayoutDesignerPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [fields, setFields] = useState<LayoutField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const { data: layout, isLoading: loadingLayout } = useQuery({
    queryKey: ['layout', id],
    queryFn: () => api.layouts.get(id!),
    enabled: !isNew && !!id,
  });

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: api.templates.list,
  });

  const { data: template } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => api.templates.get(templateId),
    enabled: !!templateId,
  });

  useEffect(() => {
    if (layout) {
      setName(layout.name);
      setTemplateId(layout.templateId);
      setFields(layout.config.fields);
    }
  }, [layout]);

  useEffect(() => {
    if (isNew && templates?.length && !templateId) {
      setTemplateId(templates[0]._id);
    }
  }, [isNew, templates, templateId]);

  const saveMutation = useMutation({
    mutationFn: (data: { name: string; templateId: string; config: { fields: LayoutField[] } }) =>
      isNew ? api.layouts.create(data) : api.layouts.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
      navigate('/admin/designs');
    },
  });

  const pageConfig: PageConfig | null = template?.config ?? null;
  const isJewellery = pageConfig ? isJewelleryTemplate(pageConfig) : false;
  const designScale = PREVIEW_SCALE * 2;
  const mmPerPx = 1 / (designScale * (96 / 25.4));
  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const sectionOffsetX = (field: LayoutField) => {
    if (!isJewellery || !pageConfig?.geometry) return 0;
    const geo = pageConfig.geometry as InterlockSheetGeometry;
    return field.section === 'B' ? geo.sectionA.x + geo.sectionA.width : 0;
  };

  const addField = (type: FieldType) => {
    if (!pageConfig) return;
    const newField: LayoutField = {
      id: generateId(),
      type,
      label: FIELD_TYPE_LABELS[type],
      section: isJewellery ? 'A' : 'full',
      x: 0.5,
      y: 0.5 + fields.length * 2,
      width: isJewellery ? 28 : pageConfig.stickerWidth - 4,
      height: isJewellery ? 3.5 : 6,
      fontSize: isJewellery ? 7 : 9,
      bold: false,
      italic: false,
      alignment: 'left',
      staticText: type === 'staticBranding' ? 'Your Brand' : type === 'text' ? 'Text' : undefined,
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<LayoutField>) => {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)));
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const field = fields.find((f) => f.id === fieldId);
    if (!field || !canvasRef.current || !pageConfig) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const pxX = mmToPx(field.x + sectionOffsetX(field), designScale);
    const pxY = mmToPx(field.y, designScale);
    setSelectedFieldId(fieldId);
    setDragging({
      id: fieldId,
      offsetX: e.clientX - rect.left - pxX,
      offsetY: e.clientY - rect.top - pxY,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !canvasRef.current || !pageConfig) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const pxX = e.clientX - rect.left - dragging.offsetX;
      const pxY = e.clientY - rect.top - dragging.offsetY;
      let mmX = Math.max(0, pxX * mmPerPx);
      const mmY = Math.max(0, pxY * mmPerPx);
      const field = fields.find((f) => f.id === dragging.id);
      if (field && isJewellery && field.section === 'B' && pageConfig?.geometry) {
        mmX = Math.max(0, mmX - (pageConfig.geometry.sectionA.x + pageConfig.geometry.sectionA.width));
      }
      updateField(dragging.id, { x: Math.round(mmX * 10) / 10, y: Math.round(mmY * 10) / 10 });
    },
    [dragging, pageConfig, fields, isJewellery, mmPerPx]
  );

  const handleMouseUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  if ((!isNew && loadingLayout) || !templates) return <LoadingSpinner />;

  const stickerW = pageConfig ? mmToPx(pageConfig.stickerWidth, designScale) : 200;
  const stickerH = pageConfig ? mmToPx(pageConfig.stickerHeight, designScale) : 120;

  return (
    <div>
      <PageHeader
        title={isNew ? 'New Label Design' : 'Edit Label Design'}
        subtitle="Drag items to position them on the sticker"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate({ name, templateId, config: { fields } });
        }}
      >
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card lg:col-span-1">
            <div className="mb-4">
              <label className="label-text">Layout Name</label>
              <input
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="label-text">Template</label>
              <select
                className="input-field"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                required
              >
                {templates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <h3 className="mb-2 font-semibold">Add Field</h3>
            <div className="flex flex-wrap gap-2">
              {ADDABLE_FIELDS.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addField(type)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                  disabled={!pageConfig}
                >
                  <Plus className="mr-1 inline h-3 w-3" />
                  {FIELD_TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            {selectedField && (
              <div className="mt-6 space-y-3 border-t pt-4">
                <h3 className="font-semibold">Selected: {selectedField.label}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label-text">X (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input-field"
                      value={selectedField.x}
                      onChange={(e) =>
                        updateField(selectedField.id, { x: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <label className="label-text">Y (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input-field"
                      value={selectedField.y}
                      onChange={(e) =>
                        updateField(selectedField.id, { y: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <label className="label-text">Width (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input-field"
                      value={selectedField.width}
                      onChange={(e) =>
                        updateField(selectedField.id, { width: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <label className="label-text">Height (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input-field"
                      value={selectedField.height}
                      onChange={(e) =>
                        updateField(selectedField.id, { height: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <label className="label-text">Font Size</label>
                    <input
                      type="number"
                      className="input-field"
                      value={selectedField.fontSize}
                      onChange={(e) =>
                        updateField(selectedField.id, { fontSize: parseFloat(e.target.value) || 8 })
                      }
                    />
                  </div>
                  <div>
                    <label className="label-text">Alignment</label>
                    <select
                      className="input-field"
                      value={selectedField.alignment}
                      onChange={(e) =>
                        updateField(selectedField.id, {
                          alignment: e.target.value as LayoutField['alignment'],
                        })
                      }
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  {isJewellery && (
                    <div className="col-span-2">
                      <label className="label-text">Section</label>
                      <select
                        className="input-field"
                        value={selectedField.section ?? 'A'}
                        onChange={(e) =>
                          updateField(selectedField.id, {
                            section: e.target.value as LayoutField['section'],
                          })
                        }
                      >
                        <option value="A">Section A (left broad)</option>
                        <option value="B">Section B (right broad)</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedField.bold}
                      onChange={(e) => updateField(selectedField.id, { bold: e.target.checked })}
                    />
                    Bold
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedField.italic}
                      onChange={(e) => updateField(selectedField.id, { italic: e.target.checked })}
                    />
                    Italic
                  </label>
                </div>
                {(selectedField.type === 'text' || selectedField.type === 'staticBranding') && (
                  <div>
                    <label className="label-text">Text Content</label>
                    <input
                      className="input-field"
                      value={selectedField.staticText ?? ''}
                      onChange={(e) =>
                        updateField(selectedField.id, { staticText: e.target.value })
                      }
                    />
                  </div>
                )}
                {selectedField.type === 'logo' && (
                  <div>
                    <label className="label-text">Logo URL</label>
                    <input
                      className="input-field"
                      value={selectedField.logoUrl ?? ''}
                      onChange={(e) =>
                        updateField(selectedField.id, { logoUrl: e.target.value })
                      }
                    />
                  </div>
                )}
                <button
                  type="button"
                  className="btn-danger w-full"
                  onClick={() => removeField(selectedField.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Field
                </button>
              </div>
            )}
          </div>

          <div className="card lg:col-span-2">
            <h3 className="mb-4 font-semibold">Sticker Preview (drag fields to move)</h3>
            {pageConfig ? (
              <div className="overflow-auto rounded-xl bg-slate-100 p-6">
                <div
                  ref={canvasRef}
                  className="relative mx-auto border-2 border-dashed border-slate-300 bg-white"
                  style={{ width: stickerW, height: stickerH }}
                  onClick={() => setSelectedFieldId(null)}
                >
                  {isJewellery && pageConfig?.geometry && (
                    <div
                      className="pointer-events-none absolute top-0 border-r border-dashed border-slate-400"
                      style={{
                        left: mmToPx(
                          pageConfig.geometry.sectionA.x + pageConfig.geometry.sectionA.width,
                          designScale
                        ),
                        height: '100%',
                      }}
                    />
                  )}
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className={`absolute cursor-move select-none border ${
                        selectedFieldId === field.id
                          ? 'border-brand-500 bg-brand-50/50'
                          : 'border-slate-300 bg-white/80'
                      }`}
                      style={{
                        left: mmToPx(field.x + sectionOffsetX(field), designScale),
                        top: mmToPx(field.y, designScale),
                        width: mmToPx(field.width, designScale),
                        height: mmToPx(field.height, designScale),
                        fontSize: field.fontSize * designScale * 0.35,
                        fontWeight: field.bold ? 'bold' : 'normal',
                        fontStyle: field.italic ? 'italic' : 'normal',
                        textAlign: field.alignment,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, field.id)}
                    >
                      <GripVertical className="absolute -left-1 top-0 h-full w-3 text-slate-400" />
                      <span className="block truncate px-1">
                        {(() => {
                          const val = resolveFieldValue(field, SAMPLE_LABEL);
                          if (val) return val;
                          if (field.type === 'text' || field.type === 'staticBranding') return field.staticText;
                          return `[${field.label}]`;
                        })()}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-center text-sm text-slate-500">
                  {isJewellery && pageConfig?.geometry
                    ? `Broad printable area: ${pageConfig.geometry.broadWidth} × ${pageConfig.geometry.broadHeight} mm (Section A + B)`
                    : `Sticker size: ${pageConfig.stickerWidth} × ${pageConfig.stickerHeight} mm`}
                </p>
              </div>
            ) : (
              <p className="text-slate-500">Select a template to design the layout.</p>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save Layout'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin/designs')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
