const PHASE_COPY = {
  WAITING: { label: 'Waiting for players…', className: 'bg-slate-800 text-slate-300' },
  COUNTDOWN: { label: 'Get ready!', className: 'bg-indigo-600 text-white' },
  PLAYING: { label: 'Game on!', className: 'bg-emerald-600 text-white' },
  ENDED: { label: 'Game over', className: 'bg-slate-700 text-slate-200' },
};

export default function GameStatus({ phase, gameType }) {
  const copy = PHASE_COPY[phase] || PHASE_COPY.WAITING;
  return (
    <div
      className={`w-full px-4 py-3 text-center text-sm font-semibold pt-[max(0.75rem,env(safe-area-inset-top))] ${copy.className}`}
    >
      {copy.label}
      {gameType ? <span className="ml-2 opacity-80">· {gameType.replace(/_/g, ' ')}</span> : null}
    </div>
  );
}
