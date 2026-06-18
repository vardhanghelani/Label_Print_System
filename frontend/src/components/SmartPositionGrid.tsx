import { resolveStickers } from '../lib/geometryBuilder';
import type { PageConfig } from '../types';
import { getTotalPositions, computePrintPositions, isJewelleryTemplate } from '../types';
import { useEffect, useState } from 'react';

interface SmartPositionGridProps {
  config: PageConfig;
  usedPositions: number[];
  startFromPosition: number;
  labelCount: number;
  onStartFromChange: (pos: number) => void;
  onToggleUsed: (pos: number) => void;
  markUsedMode?: boolean;
}

export function SmartPositionGrid({
  config,
  usedPositions,
  startFromPosition,
  labelCount,
  onStartFromChange,
  onToggleUsed,
  markUsedMode = false,
}: SmartPositionGridProps) {
  const [animatingPositions, setAnimatingPositions] = useState<number[]>([]);
  const total = getTotalPositions(config);
  const positions = Array.from({ length: total }, (_, i) => i + 1);
  const isJewellery = isJewelleryTemplate(config);

  const printPositions = computePrintPositions('startFrom', labelCount, config, {
    startFromPosition,
    usedPositions,
  });

  const printSet = new Set(printPositions);
  const usedSet = new Set(usedPositions);

  useEffect(() => {
    if (markUsedMode || labelCount === 0) {
      setAnimatingPositions([]);
      return;
    }
    setAnimatingPositions(printPositions);
    const timer = setTimeout(() => setAnimatingPositions([]), 1200);
    return () => clearTimeout(timer);
  }, [startFromPosition, labelCount, markUsedMode, printPositions.join(',')]);

  const handleClick = (pos: number) => {
    if (markUsedMode) {
      onToggleUsed(pos);
      return;
    }
    if (!usedSet.has(pos)) {
      onStartFromChange(pos);
    }
  };

  const getStyle = (pos: number) => {
    const isUsed = usedSet.has(pos);
    const isSelected = printSet.has(pos);
    const isAnimating = animatingPositions.includes(pos);

    if (isUsed) return 'bg-slate-300 border-slate-400 text-slate-600 cursor-pointer';
    if (isSelected) {
      return isAnimating
        ? 'sticker-pop bg-emerald-400 border-emerald-600 text-white shadow-lg'
        : 'bg-emerald-400 border-emerald-600 text-white shadow-lg scale-105';
    }
    return 'bg-white border-slate-300 text-slate-800 hover:bg-blue-100 hover:border-blue-500';
  };

  const endPosition = printPositions[printPositions.length - 1];

  const buttonSize = isJewellery
    ? 'h-12 w-full max-w-[120px] text-lg sm:h-14 sm:text-xl'
    : 'h-20 w-20 sm:h-[88px] sm:w-[88px] sm:text-3xl text-2xl';

  return (
    <div>
      {labelCount > 0 && !markUsedMode && printPositions.length > 0 && (
        <div className="mb-5 rounded-2xl bg-emerald-50 px-6 py-5 text-center text-2xl font-bold text-emerald-800">
          Printing {printPositions.length} label{printPositions.length !== 1 ? 's' : ''} starting
          from sticker #{startFromPosition}
          {endPosition && endPosition !== startFromPosition && (
            <span className="block text-xl font-semibold text-emerald-700">
              → Stickers {printPositions.join(', ')}
            </span>
          )}
        </div>
      )}

      {labelCount > 0 && printPositions.length < labelCount && !markUsedMode && (
        <div className="mb-5 rounded-2xl border-2 border-amber-300 bg-amber-50 px-6 py-4 text-xl font-semibold text-amber-900">
          Only {printPositions.length} empty sticker{printPositions.length !== 1 ? 's' : ''} available,
          but you selected {labelCount} products. Please select fewer products or use a new sheet.
        </div>
      )}

      {isJewellery && (
        <p className="mb-3 text-center text-base font-medium text-slate-600">
          14 stickers in order — tap where you want to start printing
        </p>
      )}

      <div
        className={
          isJewellery
            ? 'mx-auto flex max-w-[140px] flex-col gap-1'
            : 'inline-grid gap-4'
        }
        style={
          isJewellery
            ? undefined
            : { gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))` }
        }
      >
        {positions.map((pos) => {
          const isSelected = printSet.has(pos);
          const animDelay = isSelected
            ? `${printPositions.indexOf(pos) * 80}ms`
            : undefined;
          const sticker = resolveStickers(config).find((s) => s.stickerNumber === pos);
          const sideHint =
            isJewellery && sticker
              ? sticker.orientation === 'broad-left'
                ? '← print'
                : 'print →'
              : null;

          return (
            <button
              key={pos}
              type="button"
              disabled={!markUsedMode && usedSet.has(pos)}
              onClick={() => handleClick(pos)}
              style={animDelay ? { animationDelay: animDelay } : undefined}
              className={`flex ${buttonSize} items-center justify-center gap-1 rounded-2xl border-2 font-bold transition-all ${getStyle(pos)}`}
            >
              <span>{pos}</span>
              {sideHint && !usedSet.has(pos) && (
                <span className="text-xs font-normal opacity-70">{sideHint}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PositionLegend() {
  return (
    <div className="mb-4 flex flex-wrap gap-5 text-lg font-semibold">
      <span className="flex items-center gap-3">
        <span className="inline-block h-7 w-7 rounded border-2 border-slate-300 bg-white" />
        Empty
      </span>
      <span className="flex items-center gap-3">
        <span className="inline-block h-7 w-7 rounded border-2 border-slate-400 bg-slate-300" />
        Already Used
      </span>
      <span className="flex items-center gap-3">
        <span className="inline-block h-7 w-7 rounded border-2 border-emerald-600 bg-emerald-400" />
        Will Print
      </span>
    </div>
  );
}
