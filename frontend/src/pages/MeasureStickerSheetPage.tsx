import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Ruler, ChevronLeft } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, LoadingSpinner } from '../components/Layout';
import { SheetRenderer } from '../components/render/SheetRenderer';
import { SheetPreviewFrame } from '../components/PreviewFrame';
import {
  buildInterlockPageConfig,
  DEFAULT_INTERLOCK_GEOMETRY,
  DEFAULT_INTERLOCK_PAGE,
  regenerateInterlockConfig,
  type InterlockSheetGeometry,
  type SectionGeometry,
} from '../lib/geometryBuilder';
import type { PageConfig } from '../types';
import { mmToPx, PREVIEW_SCALE } from '../lib/units';

const MEASURE_FIELDS: { key: keyof InterlockSheetGeometry | 'pageWidth' | 'pageHeight'; label: string; group: string }[] = [
  { key: 'pageWidth', label: 'Sheet Width (mm)', group: 'Sheet' },
  { key: 'pageHeight', label: 'Sheet Height (mm)', group: 'Sheet' },
  { key: 'stickerCount', label: 'Sticker Count', group: 'Sheet' },
  { key: 'topMargin', label: 'Top Margin (mm)', group: 'Margins' },
  { key: 'bottomMargin', label: 'Bottom Margin (mm)', group: 'Margins' },
  { key: 'leftMargin', label: 'Left Margin (mm)', group: 'Margins' },
  { key: 'rightMargin', label: 'Right Margin (mm)', group: 'Margins' },
  { key: 'broadWidth', label: 'Broad Width (mm)', group: 'Sticker' },
  { key: 'broadHeight', label: 'Broad Height (mm)', group: 'Sticker' },
  { key: 'tailWidth', label: 'Tail Width (mm)', group: 'Sticker' },
  { key: 'tailHeight', label: 'Tail Height (mm)', group: 'Sticker' },
  { key: 'verticalPitch', label: 'Vertical Pitch (mm)', group: 'Sticker' },
];

function SectionEditor({
  label,
  section,
  broadWidth,
  broadHeight,
  color,
  onChange,
}: {
  label: string;
  section: SectionGeometry;
  broadWidth: number;
  broadHeight: number;
  color: string;
  onChange: (s: SectionGeometry) => void;
}) {
  const scale = PREVIEW_SCALE * 3;
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'move' | 'se' | null>(null);
  const [start, setStart] = useState({ mx: 0, my: 0, section: section });

  const onMouseDown = (e: React.MouseEvent, mode: 'move' | 'se') => {
    e.stopPropagation();
    setDragging(mode);
    setStart({ mx: e.clientX, my: e.clientY, section: { ...section } });
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = (e.clientX - start.mx) / (scale * (96 / 25.4));
      const dy = (e.clientY - start.my) / (scale * (96 / 25.4));
      if (dragging === 'move') {
        onChange({
          ...start.section,
          x: Math.max(0, Math.min(broadWidth - start.section.width, start.section.x + dx)),
          y: Math.max(0, Math.min(broadHeight - start.section.height, start.section.y + dy)),
        });
      } else {
        onChange({
          ...start.section,
          width: Math.max(5, Math.min(broadWidth - start.section.x, start.section.width + dx)),
          height: Math.max(2, Math.min(broadHeight - start.section.y, start.section.height + dy)),
        });
      }
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, start, broadWidth, broadHeight, onChange, scale]);

  return (
    <div>
      <h4 className="mb-2 font-semibold">{label}</h4>
      <div className="mb-2 grid grid-cols-2 gap-2 text-sm">
        {(['x', 'y', 'width', 'height'] as const).map((k) => (
          <div key={k}>
            <label className="text-xs font-medium uppercase text-slate-500">{k}</label>
            <input
              type="number"
              step="0.1"
              className="input-field min-h-[40px] text-base"
              value={section[k]}
              onChange={(e) => onChange({ ...section, [k]: parseFloat(e.target.value) || 0 })}
            />
          </div>
        ))}
      </div>
      <div
        ref={canvasRef}
        className="relative mx-auto border-2 border-slate-400 bg-white"
        style={{ width: mmToPx(broadWidth, scale), height: mmToPx(broadHeight, scale) }}
      >
        <div
          className="absolute cursor-move border-2 border-dashed"
          style={{
            left: mmToPx(section.x, scale),
            top: mmToPx(section.y, scale),
            width: mmToPx(section.width, scale),
            height: mmToPx(section.height, scale),
            borderColor: color,
            backgroundColor: `${color}22`,
          }}
          onMouseDown={(e) => onMouseDown(e, 'move')}
        >
          <div
            className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize bg-slate-600"
            onMouseDown={(e) => onMouseDown(e, 'se')}
          />
          <span className="absolute left-1 top-0 text-xs font-bold" style={{ color }}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MeasureStickerSheetPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('Jewellery Tag Sheet');
  const [description, setDescription] = useState('');
  const [pageWidth, setPageWidth] = useState(DEFAULT_INTERLOCK_PAGE.pageWidth);
  const [pageHeight, setPageHeight] = useState(DEFAULT_INTERLOCK_PAGE.pageHeight);
  const [geometry, setGeometry] = useState<InterlockSheetGeometry>({ ...DEFAULT_INTERLOCK_GEOMETRY });

  const { data: template, isLoading } = useQuery({
    queryKey: ['template', id],
    queryFn: () => api.templates.get(id!),
    enabled: !isNew && !!id,
  });

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description ?? '');
      setPageWidth(template.config.pageWidth);
      setPageHeight(template.config.pageHeight);
      if (template.config.geometry) {
        setGeometry(template.config.geometry);
      }
    }
  }, [template]);

  const previewConfig: PageConfig = useMemo(
    () => buildInterlockPageConfig(pageWidth, pageHeight, geometry),
    [pageWidth, pageHeight, geometry]
  );

  const saveMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string; config: PageConfig }) =>
      isNew ? api.templates.create(payload) : api.templates.update(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      navigate('/admin/formats');
    },
  });

  const updateGeometry = (key: keyof InterlockSheetGeometry, value: number) => {
    setGeometry((g) => ({ ...g, [key]: value }));
  };

  const groups = [...new Set(MEASURE_FIELDS.map((f) => f.group))];

  if (!isNew && isLoading) return <LoadingSpinner />;

  return (
    <div>
      <Link to="/admin/formats" className="btn-secondary mb-6 inline-flex">
        <ChevronLeft className="h-5 w-5" />
        Back to Formats
      </Link>

      <PageHeader
        title="Measure Sticker Sheet"
        subtitle="Enter physical measurements — coordinates regenerate automatically"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const config = regenerateInterlockConfig(
            buildInterlockPageConfig(pageWidth, pageHeight, geometry)
          );
          saveMutation.mutate({ name, description, config });
        }}
        className="space-y-6"
      >
        <div className="card grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label-text">Template Name</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label-text">Description</label>
            <input className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        {groups.map((group) => (
          <div key={group} className="card">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Ruler className="h-5 w-5" />
              {group}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MEASURE_FIELDS.filter((f) => f.group === group).map(({ key, label }) => (
                <div key={key}>
                  <label className="label-text">{label}</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-field"
                    value={
                      key === 'pageWidth'
                        ? pageWidth
                        : key === 'pageHeight'
                          ? pageHeight
                          : (geometry[key as keyof InterlockSheetGeometry] as number)
                    }
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      if (key === 'pageWidth') setPageWidth(v);
                      else if (key === 'pageHeight') setPageHeight(v);
                      else updateGeometry(key as keyof InterlockSheetGeometry, v);
                    }}
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Section A & B (relative to broad area)</h3>
          <p className="mb-4 text-slate-600">
            Drag or resize each section on the broad printable area. All printing happens inside these regions.
          </p>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <SectionEditor
              label="Section A"
              section={geometry.sectionA}
              broadWidth={geometry.broadWidth}
              broadHeight={geometry.broadHeight}
              color="#db2777"
              onChange={(sectionA) => setGeometry((g) => ({ ...g, sectionA }))}
            />
            <SectionEditor
              label="Section B"
              section={geometry.sectionB}
              broadWidth={geometry.broadWidth}
              broadHeight={geometry.broadHeight}
              color="#16a34a"
              onChange={(sectionB) => setGeometry((g) => ({ ...g, sectionB }))}
            />
          </div>
        </div>

        <div className="card">
          <SheetPreviewFrame
            pageWidthMm={previewConfig.pageWidth}
            pageHeightMm={previewConfig.pageHeight}
            scale={PREVIEW_SCALE * 0.9}
            label={`Live Preview — ${previewConfig.stickerCount} stickers`}
          >
            <SheetRenderer
              pageConfig={previewConfig}
              layoutConfig={{ fields: [] }}
              calibration={{ horizontalOffset: 0, verticalOffset: 0, scaleX: 100, scaleY: 100 }}
              usedPositions={[]}
              printPositions={[]}
              positionLabelMap={[]}
              showGrid
              showPositionNumbers
              showPrintableArea
              scale={PREVIEW_SCALE * 0.9}
            />
          </SheetPreviewFrame>
        </div>

        <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
          <Save className="h-5 w-5" />
          {saveMutation.isPending ? 'Saving...' : 'Save & Generate Coordinates'}
        </button>
      </form>
    </div>
  );
}
