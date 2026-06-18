import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { PageConfig } from '../types';

let activePageSize = '137mm 172mm';

export function setPrintPageSize(pageWidth: number, pageHeight: number): void {
  activePageSize = `${pageWidth}mm ${pageHeight}mm`;
  injectPageSizeStyle(activePageSize);
}

function injectPageSizeStyle(pageSize: string): void {
  let styleEl = document.getElementById('dynamic-print-page-size') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-print-page-size';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `@media print { @page { size: ${pageSize}; margin: 0; } }`;
}

async function waitForPrintLayout(element?: HTMLElement | null): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  if (element) {
    void element.offsetHeight;
  }
}

export async function triggerBrowserPrint(
  element?: HTMLElement | null,
  pageSize?: string
): Promise<void> {
  if (pageSize) injectPageSizeStyle(pageSize);
  else injectPageSizeStyle(activePageSize);

  await waitForPrintLayout(element);

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener('afterprint', finish);
      clearTimeout(fallback);
      resolve();
    };

    // Must wait until the print dialog closes — otherwise React unmounts .print-area → blank PDF
    window.addEventListener('afterprint', finish);
    const fallback = setTimeout(finish, 60_000);
    window.print();
  });
}

/** PDF output uses exact millimeter page dimensions */
export async function exportToPdf(
  element: HTMLElement,
  pageConfig: PageConfig,
  filename = 'labels.pdf'
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 4,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const pdf = new jsPDF({
    orientation: pageConfig.pageWidth > pageConfig.pageHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageConfig.pageWidth, pageConfig.pageHeight],
  });

  pdf.addImage(
    canvas.toDataURL('image/png'),
    'PNG',
    0,
    0,
    pageConfig.pageWidth,
    pageConfig.pageHeight
  );
  pdf.save(filename);
}
