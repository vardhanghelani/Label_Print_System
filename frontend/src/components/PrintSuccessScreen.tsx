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
