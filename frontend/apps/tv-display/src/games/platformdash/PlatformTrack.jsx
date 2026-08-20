const EVENT_FLASH = {
  STOMP: 'animate-flash-green',
  COIN: 'animate-flash-green',
  STUMBLE: 'animate-flash-red',
  FELL: 'animate-flash-red',
  ELIMINATED: 'animate-flash-red',
  FINISH: '',
};

const HURT_EVENTS = new Set(['STUMBLE', 'FELL', 'ELIMINATED']);

/** A simple original critter - not modeled on any existing game's character. */
function Critter() {
  return (
    <div className="relative h-6 w-7 animate-critter-waddle">
      <div className="absolute inset-x-0 top-0 h-5 rounded-t-full rounded-b-md bg-gradient-to-b from-amber-700 to-amber-950" />
      <span className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full bg-white" />
      <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-white" />
      <span className="absolute left-1.5 top-1.5 h-0.5 w-0.5 rounded-full bg-black" />
      <span className="absolute right-1.5 top-1.5 h-0.5 w-0.5 rounded-full bg-black" />
    </div>
  );
}

function Coin() {
  return (
    <div className="h-5 w-5 animate-coin-spin rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.7)]" />
  );
}

/** The player's runner - an original blob character, distinct per player by color. */
function RunnerSprite({ color, jumping, hurt, eliminated }) {
  return (
    <div
      className={`relative h-8 w-7 ${eliminated ? 'opacity-40 grayscale' : jumping ? 'animate-runner-jump' : 'animate-runner-run'}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-6 rounded-t-full rounded-b-sm ${hurt ? 'animate-flash-red' : ''}`}
        style={{ backgroundColor: color }}
      />
      <span className="absolute left-1 top-1.5 h-1.5 w-1.5 rounded-full bg-white" />
      <span className="absolute right-1 top-1.5 h-1.5 w-1.5 rounded-full bg-white" />
      <span className="absolute left-1.5 top-2 h-0.5 w-0.5 rounded-full bg-black" />
      <span className="absolute right-1.5 top-2 h-0.5 w-0.5 rounded-full bg-black" />
      <span className="absolute -bottom-1 left-0.5 h-2 w-2 rounded-b-full bg-black/70" />
      <span className="absolute -bottom-1 right-0.5 h-2 w-2 rounded-b-full bg-black/70" />
    </div>
  );
}

function LivesHearts({ lives }) {
  return (
    <span className="flex gap-0.5 text-sm">
      {Array.from({ length: 3 }, (_, i) => (
        <span key={i} className={i < lives ? 'opacity-100' : 'opacity-20'}>
          ❤️
        </span>
      ))}
    </span>
  );
}

/**
 * PLATFORM_DASH view: an original side-scrolling runner. One ground-and-sky
 * lane per player, with critters to stomp, coins to grab, and pits to jump
 * over - a shared track, race to the flag.
 */
export default function PlatformTrack({ state }) {
  const track = state?.track || [];
  const trackLength = state?.trackLength || track.length || 1;
  const runners = state?.runners || {};
  const entries = Object.entries(runners);
  const tileWidthPct = 100 / trackLength;

  if (entries.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-3xl text-slate-500 font-semibold">
        Waiting for runners...
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-center gap-5 p-8 overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900">
      {entries.map(([playerId, runner]) => {
        const pct = Math.max(0, Math.min(100, (runner.position / trackLength) * 100));
        const color = runner.color || '#22d3ee';
        const flashClass = runner.lastEvent ? EVENT_FLASH[runner.lastEvent] : '';
        const jumping = (runner.jumpTicksRemaining ?? 0) > 0;
        const hurt = HURT_EVENTS.has(runner.lastEvent);

        return (
          <div key={playerId} className="flex items-center gap-4">
            <div className="w-24 flex-shrink-0 text-right">
              <p className="text-lg font-bold" style={{ color }}>
                {runner.coins ?? 0}🪙
              </p>
              <div className="mt-1 flex justify-end">
                <LivesHearts lives={runner.lives ?? 3} />
              </div>
              {runner.finished && <p className="mt-1 text-xs font-black uppercase text-emerald-400">Finished</p>}
              {runner.eliminated && <p className="mt-1 text-xs font-black uppercase text-red-400">Out</p>}
            </div>

            <div className="relative h-24 flex-1 min-w-0 overflow-hidden rounded-2xl border-2 border-white/10 shadow-inner">
              {/* Sky */}
              <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300/70 to-sky-100/20" />
              <div className="absolute left-[15%] top-2 h-3 w-8 rounded-full bg-white/60" />
              <div className="absolute left-[45%] top-4 h-2.5 w-6 rounded-full bg-white/50" />
              <div className="absolute left-[75%] top-1.5 h-3 w-7 rounded-full bg-white/60" />

              {/* Pit void, sits behind the segmented ground below */}
              <div className="absolute inset-x-0 bottom-0 h-8 bg-slate-950" />

              {/* Ground, one segment per tile - PIT tiles are gaps left transparent */}
              <div className="absolute inset-x-0 bottom-0 h-8 flex">
                {track.map((tile, i) => (
                  <div
                    key={i}
                    className={
                      tile === 'PIT'
                        ? ''
                        : 'h-full border-r border-lime-950/30 bg-gradient-to-b from-lime-600 to-lime-800'
                    }
                    style={{ width: `${tileWidthPct}%` }}
                  />
                ))}
              </div>

              {/* Coins and critters, each centered above its own tile */}
              {track.map((tile, i) => {
                if (tile !== 'COIN' && tile !== 'ENEMY') return null;
                return (
                  <div
                    key={i}
                    className="absolute bottom-8 -translate-x-1/2"
                    style={{ left: `${(i + 0.5) * tileWidthPct}%` }}
                  >
                    {tile === 'COIN' ? <Coin /> : <Critter />}
                  </div>
                );
              })}

              {/* Danger-ahead cue: pulses above the very next tile if it's a
              hazard the runner hasn't jumped for yet - reinforces the same
              cue now shown on the player's own mini-track. */}
              {(() => {
                const nextIndex = runner.position + 1;
                const nextTile = nextIndex < track.length ? track[nextIndex] : null;
                const nextIsHazard = nextTile === 'ENEMY' || nextTile === 'PIT';
                if (!nextIsHazard || jumping || runner.eliminated || runner.finished) return null;
                return (
                  <div
                    className="absolute bottom-16 -translate-x-1/2 animate-pulse text-lg font-black text-red-400"
                    style={{ left: `${(nextIndex + 0.5) * tileWidthPct}%` }}
                  >
                    !
                  </div>
                );
              })()}

              {/* Finish flag */}
              <div className="absolute bottom-8 right-2 flex flex-col items-center">
                <div
                  className="absolute -top-9 left-[3px] h-4 w-5 bg-red-500"
                  style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
                />
                <div className="h-9 w-1 bg-slate-200" />
              </div>

              {flashClass && <div className={`absolute inset-0 z-10 ${flashClass}`} />}

              {/* Runner */}
              <div
                className="absolute bottom-8 -translate-x-1/2 transition-[left] duration-150 ease-linear"
                style={{ left: `${pct}%` }}
              >
                <RunnerSprite color={color} jumping={jumping} hurt={hurt} eliminated={runner.eliminated} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
