const TILE_ICON = {
  ENEMY: '👾',
  COIN: '🪙',
};

const EVENT_STYLE = {
  STOMP: 'animate-flash-green',
  STUMBLE: 'animate-flash-red',
  COIN: 'animate-flash-green',
  FINISH: '',
};

/**
 * PLATFORM_DASH view: one horizontal lane per player. A runner icon slides
 * left-to-right along a shared track of enemy/coin tiles toward the finish
 * flag. Flashes green on a stomp/coin, red on a stumble.
 */
export default function PlatformTrack({ state }) {
  const track = state?.track || [];
  const trackLength = state?.trackLength || track.length || 1;
  const runners = state?.runners || {};
  const entries = Object.entries(runners);

  if (entries.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-3xl text-slate-500 font-semibold">
        Waiting for runners...
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-center gap-6 p-10 overflow-hidden">
      {entries.map(([playerId, runner]) => {
        const pct = Math.max(0, Math.min(100, (runner.position / trackLength) * 100));
        const color = runner.color || '#22d3ee';
        const flashClass = runner.lastEvent ? EVENT_STYLE[runner.lastEvent] : '';

        return (
          <div key={playerId} className="flex items-center gap-4">
            <div className="w-24 flex-shrink-0 text-right">
              <p className="text-lg font-bold" style={{ color }}>
                {runner.coins ?? 0}🪙
              </p>
              {runner.finished && <p className="text-xs font-semibold text-emerald-400">FINISHED</p>}
            </div>

            <div className="relative h-14 flex-1 min-w-0 rounded-full border-2 border-white/15 bg-white/5 overflow-hidden">
              {track.map((tile, i) => {
                const icon = TILE_ICON[tile];
                if (!icon) return null;
                return (
                  <span
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-xl opacity-70"
                    style={{ left: `${(i / trackLength) * 100}%` }}
                  >
                    {icon}
                  </span>
                );
              })}

              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-2xl">🏁</span>

              {flashClass && <div className={`absolute inset-0 z-10 rounded-full ${flashClass}`} />}

              <div
                className={`absolute top-1/2 -translate-y-1/2 text-3xl leading-none transition-[left] duration-150 ease-linear ${
                  runner.stumbleTicksRemaining > 0 ? 'animate-bounce' : ''
                }`}
                style={{ left: `${pct}%` }}
              >
                🏃
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
