const RANK_MESSAGE = {
  2: 'So close! Runner-up.',
  3: 'Great run - podium finish!',
};

export default function WinnerBanner({ isWinner, rank, displayName, score }) {
  return (
    <div
      className={`rounded-[28px] border p-6 text-center ${
        isWinner
          ? 'border-amber-400/60 bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 shadow-[0_0_40px_rgba(251,191,36,0.15)]'
          : 'border-slate-800 bg-slate-900'
      }`}
    >
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${
          isWinner ? 'bg-gradient-to-b from-amber-300 to-amber-500 animate-pulse-glow' : 'bg-slate-800'
        }`}
      >
        🏆
      </div>

      <p className="mt-4 text-xs font-black uppercase tracking-[0.35em] text-emerald-400">Final Result</p>

      <p className="mt-1 text-3xl font-black text-white">
        {isWinner ? 'Champion!' : rank ? `#${rank} Finish` : 'Game Over'}
      </p>

      {displayName && (
        <p className="mt-1 text-lg font-bold italic text-emerald-400 [text-shadow:0_0_18px_rgba(52,211,153,0.45)]">
          {displayName}
        </p>
      )}

      {!isWinner && rank && (
        <p className="mt-1 text-sm text-slate-400">{RANK_MESSAGE[rank] || 'Thanks for playing!'}</p>
      )}

      <div className="mt-4 flex items-center justify-center gap-2">
        {rank && (
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-300">
            Rank #{rank}
          </span>
        )}
        {typeof score === 'number' && (
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-300">
            Score {score}
          </span>
        )}
      </div>
    </div>
  );
}
