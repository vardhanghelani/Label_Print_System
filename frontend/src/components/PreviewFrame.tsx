import { useEffect, useRef, useState, type ReactNode } from 'react';

interface PreviewFrameProps {
  /** Rendered content width in px (unscaled) */
  contentWidth: number;
  /** Rendered content height in px (unscaled) */
  contentHeight: number;
  children: ReactNode;
  className?: string;
  maxHeight?: number;
  label?: string;
}

/** Scales preview content to fit inside its card — prevents overflow and horizontal scroll */
export function PreviewFrame({
  contentWidth,
  contentHeight,
  children,
  className = '',
  maxHeight = 480,
  label,
}: PreviewFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const pad = 16;
      const availW = Math.max(1, el.clientWidth - pad * 2);
      const availH = Math.max(1, Math.min(maxHeight, el.clientHeight) - pad * 2);
      const sx = availW / contentWidth;
      const sy = availH / contentHeight;
      setScale(Math.min(1, sx, sy));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [contentWidth, contentHeight, maxHeight]);

  const scaledH = contentHeight * scale;

  return (
    <div className={`preview-frame ${className}`} ref={containerRef} style={{ maxHeight }}>
      {label && <p className="preview-frame-label">{label}</p>}
      <div
        className="preview-frame-inner"
        style={{ height: scaledH + 8, minHeight: Math.min(120, scaledH + 8) }}
      >
        <div
          className="preview-frame-content"
          style={{
            width: contentWidth,
            height: contentHeight,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

interface SheetPreviewFrameProps {
  pageWidthMm: number;
  pageHeightMm: number;
  scale?: number;
  children: ReactNode;
  label?: string;
  maxHeight?: number;
}

export function SheetPreviewFrame({
  pageWidthMm,
  pageHeightMm,
  scale = 2,
  children,
  label,
  maxHeight = 520,
}: SheetPreviewFrameProps) {
  const MM_TO_PX = 96 / 25.4;
  const w = pageWidthMm * MM_TO_PX * scale;
  const h = pageHeightMm * MM_TO_PX * scale;

  return (
    <PreviewFrame contentWidth={w} contentHeight={h} label={label} maxHeight={maxHeight}>
      {children}
    </PreviewFrame>
  );
}
