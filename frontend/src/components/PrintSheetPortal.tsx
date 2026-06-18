import { createPortal } from 'react-dom';
import type { ReactNode, RefObject } from 'react';

/** Renders print content as a direct child of document.body so @media print can hide #root cleanly. */
export function PrintSheetPortal({
  children,
  innerRef,
}: {
  children: ReactNode;
  innerRef?: RefObject<HTMLDivElement>;
}) {
  return createPortal(
    <div className="print-sheet-host" aria-hidden="true">
      <div ref={innerRef} className="print-area">
        {children}
      </div>
    </div>,
    document.body
  );
}
