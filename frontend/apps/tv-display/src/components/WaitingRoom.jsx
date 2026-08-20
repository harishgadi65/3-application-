const ICONS = {
  SNAKE: '🐍',
  TAP_BLAST: '🚀',
  PLATFORM_DASH: '🏃',
  ROCK_PAPER_SCISSORS: '✊',
};

const DEFAULT_GAMES = [
  { type: 'SNAKE', label: 'Snake' },
  { type: 'TAP_BLAST', label: 'Tap Blast' },
];

/** Center panel shown inside the four-sided ad frame after a player joins.
 * `games` is the screen's own assigned games when this session came from a
 * screen scan; falls back to a generic pair for admin-created sessions. */
export default function WaitingRoom({ code, gameType, players = [], games }) {
  const gameOptions = games && games.length > 0 ? games : DEFAULT_GAMES;
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-50 p-[clamp(10px,2vw,36px)] text-slate-900">
      <div className="flex h-full w-full max-w-[1100px] flex-col items-center justify-center overflow-hidden rounded-[clamp(14px,1.5vw,24px)] border-2 border-lime-500 bg-white px-[clamp(18px,3vw,48px)] py-[clamp(12px,2vh,28px)] shadow-2xl">
        <p className="text-[clamp(10px,1vw,18px)] font-bold uppercase tracking-[0.3em] text-slate-400">
          Game session {code}
        </p>
        <h1 className="mt-[clamp(4px,1vh,12px)] text-[clamp(24px,3vw,48px)] font-black">Get ready to play</h1>

        <div
          className={`mt-[clamp(12px,2.5vh,36px)] grid min-h-0 w-full max-w-[900px] flex-1 gap-[clamp(12px,2vw,36px)] ${
            gameOptions.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'
          }`}
        >
          {gameOptions.map((game) => {
            const selected = game.type === gameType;
            return (
              <div
                key={game.type}
                className={`flex min-h-0 flex-col items-center justify-center rounded-[clamp(12px,1.5vw,24px)] border-[clamp(2px,0.25vw,4px)] transition ${
                  selected
                    ? 'border-lime-500 bg-lime-50 shadow-[0_0_45px_rgba(132,204,22,0.28)]'
                    : 'border-slate-200 bg-white opacity-55'
                }`}
              >
                <span className="text-[clamp(44px,6vh,80px)]" role="img" aria-label={game.label}>{ICONS[game.type] || '🎮'}</span>
                <p className="mt-[clamp(8px,1.5vh,20px)] text-[clamp(16px,1.7vw,28px)] font-black uppercase tracking-wider">{game.label}</p>
                {selected && (
                  <span className="mt-[clamp(6px,1vh,14px)] rounded-full bg-lime-500 px-4 py-1.5 text-[clamp(9px,0.7vw,13px)] font-black uppercase tracking-widest text-white">
                    Selected
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-[clamp(8px,1.5vh,20px)] text-[clamp(12px,1.2vw,20px)] font-semibold text-slate-500">
          {players.length} player{players.length === 1 ? '' : 's'} joined · Waiting for the host to start
        </p>
      </div>
    </div>
  );
}
