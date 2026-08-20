import { useEffect, useMemo, useState } from 'react';

const EVENT_LABEL = {
  STOMP: { text: 'STOMP! +8', color: 'text-emerald-400' },
  STUMBLE: { text: 'Ouch, stumbled!', color: 'text-red-400' },
  FELL: { text: 'Fell in a pit!', color: 'text-red-400' },
  ELIMINATED: { text: 'Out of lives!', color: 'text-red-500' },
  CLEARED: { text: 'Cleared the gap!', color: 'text-emerald-400' },
  COIN: { text: 'Coin! +5', color: 'text-amber-400' },
  FINISH: { text: 'FINISHED!', color: 'text-emerald-400' },
};

const HURT_EVENTS = new Set(['STUMBLE', 'FELL', 'ELIMINATED']);

// How many tiles behind/ahead of the runner the mini-track window shows.
// The player is jumping completely blind without this - the track and
// obstacles only ever existed on the shared TV screen before.
const LOOKBEHIND = 1;
const LOOKAHEAD = 6;
const WINDOW_SIZE = LOOKBEHIND + LOOKAHEAD + 1;

function MiniRunner({ color, jumping, hurt }) {
  return (
    <div
      className={`relative h-7 w-6 transition-transform duration-150 ${jumping ? '-translate-y-3' : ''}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-5 rounded-t-full rounded-b-sm ${hurt ? 'animate-flash-red' : ''}`}
        style={{ backgroundColor: color || '#22d3ee' }}
      />
      <span className="absolute left-1 top-1 h-1 w-1 rounded-full bg-white" />
      <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-white" />
    </div>
  );
}

/**
 * Live windowed view of the shared track (same `state.track`/`state.runners`
 * payload the TV screen already renders in full) so the player can actually
 * see what's coming and time their jump, instead of reacting to a text
 * label after the fact.
 */
function MiniTrack({ track, trackLength, runner }) {
  const position = runner?.position ?? 0;
  const visibleStart = Math.max(0, Math.min(position - LOOKBEHIND, Math.max(trackLength - WINDOW_SIZE, 0)));
  const runnerSlot = position - visibleStart;
  const jumping = (runner?.jumpTicksRemaining ?? 0) > 0;
  const hurt = HURT_EVENTS.has(runner?.lastEvent);

  const tiles = Array.from({ length: WINDOW_SIZE }, (_, i) => {
    const idx = visibleStart + i;
    return { idx, tile: idx < trackLength ? track[idx] || 'EMPTY' : 'BEYOND' };
  });

  return (
    <div className="relative mx-4 mt-3 h-20 overflow-hidden rounded-2xl border-2 border-white/10 shadow-inner">
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300/70 to-sky-100/30" />
      <div className="absolute inset-0 flex">
        {tiles.map(({ idx, tile }, i) => {
          const distance = i - runnerSlot;
          const isHazard = tile === 'ENEMY' || tile === 'PIT';
          return (
            <div key={idx} className="relative h-full flex-1 border-r border-white/5">
              {tile !== 'PIT' && (
                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-lime-600 to-lime-800" />
              )}
              {idx === trackLength - 1 && (
                <div className="absolute bottom-8 right-0 -translate-y-full text-lg">🏁</div>
              )}
              {tile === 'COIN' && (
                <div className="absolute bottom-9 left-1/2 h-3.5 w-3.5 -translate-x-1/2 animate-coin-spin rounded-full bg-gradient-to-br from-yellow-300 to-amber-500" />
              )}
              {tile === 'ENEMY' && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-critter-waddle text-base leading-none">
                  👾
                </div>
              )}
              {isHazard && distance === 1 && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 animate-pulse text-sm font-black text-red-400">
                  !
                </div>
              )}
              {isHazard && distance === 2 && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-sm font-black text-amber-300">!</div>
              )}
              {i === runnerSlot && !runner?.finished && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                  <MiniRunner color={runner?.color} jumping={jumping} hurt={hurt} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
      <MiniTrack track={gameUpdateState?.state?.track || []} trackLength={trackLength} runner={runner} />

      <div className="px-4 pt-3">
        <div className="h-4 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-150"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
          <span>
            {runner?.eliminated ? 'Out of lives' : runner?.finished ? 'Finished!' : `${Math.round(progressPct)}% to the flag`}
          </span>
          <span className="flex items-center gap-2">
            <span className="flex gap-0.5">
              {Array.from({ length: 3 }, (_, i) => (
                <span key={i} className={i < (runner?.lives ?? 3) ? 'opacity-100' : 'opacity-20'}>
                  ❤️
                </span>
              ))}
            </span>
            <span>{runner?.coins ?? 0}🪙</span>
          </span>
        </div>
      </div>

      {label && (
        <p className={`text-center text-sm font-bold ${label.color}`}>{label.text}</p>
      )}

      <button
        type="button"
        onPointerDown={handlePointerDown}
        disabled={runner?.eliminated || runner?.finished}
        style={{ touchAction: 'manipulation' }}
        className="m-4 flex-1 select-none rounded-3xl bg-gradient-to-b from-sky-400 to-blue-600 text-3xl font-black text-white shadow-lg active:scale-[0.98] active:brightness-90 disabled:opacity-40"
      >
        {runner?.eliminated ? 'OUT' : runner?.finished ? 'DONE' : 'JUMP!'}
      </button>
    </div>
  );
}
