import { useMemo } from 'react';

/**
 * One giant full-width/height tap target for TAP_BLAST mashing.
 * Publishes a TAP action on every pointerdown, and shows a fill bar
 * for the player's own launch progress pulled from the latest
 * game-update (state.rockets, matched by playerId).
 */
export default function TapButton({ onAction, gameUpdateState, playerId }) {
  const progress = useMemo(() => {
    const rockets = gameUpdateState?.state?.rockets;
    if (!Array.isArray(rockets)) return 0;
    const mine = rockets.find((rocket) => rocket.playerId === playerId);
    if (!mine) return 0;
    const raw = mine.progress ?? mine.percent ?? 0;
    const pct = raw <= 1 ? raw * 100 : raw;
    return Math.max(0, Math.min(100, pct));
  }, [gameUpdateState, playerId]);

  const handlePointerDown = (e) => {
    e.preventDefault();
    onAction({ type: 'TAP', data: {} });
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="px-4 pt-3">
        <div className="h-4 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-center text-xs text-slate-400">
          Launch progress {Math.round(progress)}%
        </p>
      </div>

      <button
        type="button"
        onPointerDown={handlePointerDown}
        style={{ touchAction: 'manipulation' }}
        className="m-4 flex-1 select-none rounded-3xl bg-gradient-to-b from-amber-400 to-orange-600 text-3xl font-black text-white shadow-lg active:scale-[0.98] active:brightness-90"
      >
        TAP!
      </button>
    </div>
  );
}
