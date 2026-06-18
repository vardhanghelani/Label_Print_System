import type { ReactNode } from 'react';
import type { WastageStats } from '../lib/wastageStats';
import { WastageCounter } from './WastageCounter';

interface PrintConfirmModalProps {
  open: boolean;
  storeName: string;
  labelCount: number;
  startPosition: number;
  endPosition: number;
  sheetFormat: string;
  error?: string;
  isDemo?: boolean;
  wastage?: WastageStats;
  stickerPreview?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PrintConfirmModal({
  open,
  storeName,
  labelCount,
  startPosition,
  endPosition,
  sheetFormat,
  error,
  isDemo,
  wastage,
  stickerPreview,
  onConfirm,
  onCancel,
}: PrintConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="card mx-auto my-8 w-full max-w-2xl">
        {isDemo && (
          <p className="demo-banner mb-4">Demo Mode — no paper will be used</p>
        )}
        <h2 className="text-3xl font-bold text-slate-900">Ready to Print?</h2>
        <p className="mt-2 text-xl text-slate-600">Please check these details.</p>

        {error && (
          <div className="mt-4 rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4 text-xl font-semibold text-red-700">
            {error}
          </div>
        )}

        {stickerPreview && <div className="my-6">{stickerPreview}</div>}

        <dl className="space-y-3 text-xl">
          <div className="flex justify-between rounded-2xl bg-slate-50 px-5 py-4">
            <dt className="text-slate-600">Store</dt>
            <dd className="font-bold">{storeName || 'Your Shop'}</dd>
          </div>
          <div className="flex justify-between rounded-2xl bg-slate-50 px-5 py-4">
            <dt className="text-slate-600">Labels</dt>
            <dd className="font-bold">{labelCount}</dd>
          </div>
          <div className="flex justify-between rounded-2xl bg-slate-50 px-5 py-4">
            <dt className="text-slate-600">Starting Sticker</dt>
            <dd className="font-bold">{startPosition}</dd>
          </div>
          <div className="flex justify-between rounded-2xl bg-slate-50 px-5 py-4">
            <dt className="text-slate-600">Ending Sticker</dt>
            <dd className="font-bold">{endPosition}</dd>
          </div>
          <div className="flex justify-between rounded-2xl bg-slate-50 px-5 py-4">
            <dt className="text-slate-600">Sticker Format</dt>
            <dd className="font-bold">{sheetFormat}</dd>
          </div>
        </dl>

        {wastage && !error && (
          <div className="mt-6">
            <WastageCounter stats={wastage} />
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <button type="button" className="btn-secondary flex-1" onClick={onCancel}>
            Go Back
          </button>
          <button
            type="button"
            className="btn-xl flex-1"
            onClick={onConfirm}
            disabled={!!error}
          >
            {isDemo ? 'FINISH DEMO' : 'PRINT NOW'}
          </button>
        </div>
      </div>
    </div>
  );
}
