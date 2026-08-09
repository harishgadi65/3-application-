import { useEffect, useMemo, useState } from 'react';

const EVENT_LABEL = {
  STOMP: { text: 'STOMP! +8', color: 'text-emerald-400' },
  STUMBLE: { text: 'Ouch, stumbled!', color: 'text-red-400' },
  COIN: { text: 'Coin! +5', color: 'text-amber-400' },
  FINISH: { text: 'FINISHED!', color: 'text-emerald-400' },
};

/**
 * One giant full-width/height tap target for PLATFORM_DASH. Publishes a
 * JUMP action on every pointerdown - the backend arms a short jump window
 * so timing doesn't need to be frame-perfect. Shows the player's own
 * progress/coins pulled from the latest game-update, matched by playerId.
 */
export default function JumpButton({ onAction, gameUpdateState, playerId }) {
  const [flash, setFlash] = useState(null);

  const runner = useMemo(() => {
    const runners = gameUpdateState?.state?.runners;
    return runners && playerId != null ? runners[String(playerId)] : null;
  }, [gameUpdateState, playerId]);

  const trackLength = gameUpdateState?.state?.trackLength || 1;
  const progressPct = runner ? Math.max(0, Math.min(100, (runner.position / trackLength) * 100)) : 0;

  useEffect(() => {
    if (!runner?.lastEvent) return;
    setFlash({ event: runner.lastEvent, key: Date.now() });
    const timer = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runner?.lastEvent, gameUpdateState]);

  const handlePointerDown = (e) => {
    e.preventDefault();
    onAction({ type: 'JUMP', data: {} });
  };

  const label = flash ? EVENT_LABEL[flash.event] : null;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="px-4 pt-3">
        <div className="h-4 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-150"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
          <span>{runner?.finished ? 'Finished!' : `${Math.round(progressPct)}% to the flag`}</span>
          <span>{runner?.coins ?? 0}🪙</span>
        </div>
      </div>

      {label && (
        <p className={`text-center text-sm font-bold ${label.color}`}>{label.text}</p>
      )}

      <button
        type="button"
        onPointerDown={handlePointerDown}
        style={{ touchAction: 'manipulation' }}
        className="m-4 flex-1 select-none rounded-3xl bg-gradient-to-b from-sky-400 to-blue-600 text-3xl font-black text-white shadow-lg active:scale-[0.98] active:brightness-90"
      >
        JUMP!
      </button>
    </div>
  );
}
