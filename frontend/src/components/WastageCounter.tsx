import type { WastageStats } from '../lib/wastageStats';

interface WastageCounterProps {
  stats: WastageStats;
  compact?: boolean;
}

export function WastageCounter({ stats, compact = false }: WastageCounterProps) {
  if (compact) {
    return (
      <div className="rounded-2xl bg-emerald-50 px-5 py-4 text-lg">
        <p className="font-bold text-emerald-900">
          Stickers saved this month: {stats.stickersSavedThisMonth}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
      <h3 className="mb-4 text-xl font-bold text-emerald-900">Sticker Sheet Usage</h3>
      <dl className="space-y-3 text-lg">
        <div className="flex justify-between">
          <dt className="text-slate-700">Labels printing now</dt>
          <dd className="font-bold text-slate-900">{stats.labelsPrinting}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-700">Used on this sheet</dt>
          <dd className="font-bold text-slate-900">{stats.sheetUsed}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-700">Remaining on sheet</dt>
          <dd className="font-bold text-emerald-700">{stats.sheetRemaining}</dd>
        </div>
        <div className="mt-4 border-t border-emerald-200 pt-4">
          <div className="flex justify-between">
            <dt className="font-semibold text-emerald-800">Estimated stickers saved</dt>
            <dd className="text-2xl font-bold text-emerald-700">{stats.stickersSavedThisMonth}</dd>
          </div>
          <p className="mt-1 text-base text-emerald-700">this month by reusing partial sheets</p>
        </div>
      </dl>
    </div>
  );
}
