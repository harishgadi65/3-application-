/**
 * TAP_BLAST view: one vertical lane per player, a rocket sliding up a
 * 0-100% progress track. Flashes green/red briefly when a REACTION_FLASH
 * game-event is received for that player (see TVDisplayPage).
 */
export default function RocketTrack({ state, flashes = {} }) {
  const rockets = state?.rockets || {};
  const entries = Object.entries(rockets);

  if (entries.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-3xl text-slate-500 font-semibold">
        Waiting for players to launch...
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-stretch justify-center gap-8 p-10 overflow-hidden">
      {entries.map(([playerId, rocket]) => {
        const progress = Math.max(0, Math.min(100, rocket.launchProgress ?? 0));
        const color = rocket.color || '#22d3ee';
        const flash = flashes[playerId];

        return (
          <div key={playerId} className="flex flex-col items-center flex-1 max-w-[14rem] min-w-[9rem]">
            <p className="text-2xl font-black text-white mb-1 truncate w-full text-center">
              {rocket.displayName}
            </p>
            <p className="text-xl font-bold mb-3" style={{ color }}>
              {Math.round(progress)}%
            </p>
            <div className="relative flex-1 w-full min-h-[20rem] rounded-full border-2 border-white/15 bg-white/5 overflow-hidden">
              {flash && (
                <div
                  key={flash.key}
                  className={`absolute inset-0 z-10 rounded-full ${
                    flash.type === 'bad' ? 'animate-flash-red' : 'animate-flash-green'
                  }`}
                />
              )}
              <div
                className="absolute bottom-0 left-0 right-0 rounded-full transition-[height] duration-200 ease-out"
                style={{ height: `${progress}%`, backgroundColor: color, opacity: 0.35 }}
              />
              <div
                className="absolute left-1/2 -translate-x-1/2 text-7xl leading-none transition-[bottom] duration-200 ease-out"
                style={{ bottom: `calc(${progress}% - 1.9rem)` }}
              >
                🚀
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
