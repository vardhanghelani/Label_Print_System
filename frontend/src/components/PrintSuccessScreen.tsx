import { CheckCircle } from 'lucide-react';
import type { SuccessInfo } from '../stores/printStore';
import type { WastageStats } from '../lib/wastageStats';
import { WastageCounter } from './WastageCounter';

interface PrintSuccessScreenProps {
  info: SuccessInfo;
  wastage?: WastageStats;
  onPrintAgain: () => void;
  onBack: () => void;
}

export function PrintSuccessScreen({
  info,
  wastage,
  onPrintAgain,
  onBack,
}: PrintSuccessScreenProps) {
  const range =
    info.startPosition === info.endPosition
      ? `${info.startPosition}`
      : `${info.startPosition}–${info.endPosition}`;

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="card py-12">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-14 w-14 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">
          {info.isDemo ? 'Demo Complete!' : 'Labels Printed Successfully'}
        </h2>
        {info.isDemo && (
          <p className="mt-2 text-xl text-amber-700">You just saw how easy printing is!</p>
        )}
        <p className="mt-4 text-2xl font-semibold text-emerald-700">
          Printed: {info.labelCount} Label{info.labelCount !== 1 ? 's' : ''}
        </p>
        <p className="mt-2 text-xl text-slate-600">Stickers: {range}</p>

        {wastage && (
          <div className="mt-8 text-left">
            <WastageCounter stats={wastage} />
          </div>
        )}

        {!info.isDemo && (
          <div className="mt-8 rounded-2xl border-2 border-amber-200 bg-amber-50 px-5 py-4 text-left text-lg text-amber-900">
            <p className="font-bold">For exact sticker alignment when printing the PDF:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-base">
              <li>Set scale to <strong>100% / Actual size</strong> — never &quot;Fit to page&quot;</li>
              <li>Set paper size to <strong>110 × 197 mm</strong> (custom size)</li>
              <li>Set margins to <strong>None / 0</strong></li>
              <li>If text is slightly off, use <strong>Print Adjustment</strong> in the sidebar</li>
            </ul>
          </div>
        )}

        <div className="mt-10 flex flex-col gap-4">
          {!info.isDemo && (
            <button type="button" className="btn-xl w-full" onClick={onPrintAgain}>
              Print Again
            </button>
          )}
          <button type="button" className="btn-secondary w-full" onClick={onBack}>
            {info.isDemo ? 'Start Real Printing' : 'Back to Home'}
          </button>
        </div>
      </div>
    </div>
  );
}
