const RANK_BADGE_CLASSES = {
  1: 'bg-yellow-400 text-black',
  2: 'bg-slate-300 text-black',
  3: 'bg-amber-600 text-white',
};

/**
 * PLAYING phase sidebar: live rankings pushed over
 * /topic/session/{code}/leaderboard.
 */
export default function LiveLeaderboard({ rankings = [] }) {
  const sorted = [...rankings].sort((a, b) => a.rank - b.rank);

  return (
    <div className="flex h-full w-full flex-col rounded-[clamp(12px,1.5vw,24px)] border border-white/10 bg-black/60 p-[clamp(10px,1.2vw,22px)] backdrop-blur">
      <p className="mb-[clamp(8px,1vh,16px)] shrink-0 text-[clamp(16px,1.5vw,28px)] font-black uppercase tracking-[0.15em] text-indigo-400">
        Leaderboard
      </p>
      <ol className="flex flex-col gap-3 overflow-hidden flex-1">
        {sorted.length === 0 && (
          <p className="text-[clamp(13px,1.2vw,20px)] text-slate-500">Scores will appear here</p>
        )}
        {sorted.slice(0, 8).map((entry) => (
          <li
            key={entry.playerId}
            className="flex items-center justify-between rounded-xl bg-white/5 px-[clamp(8px,0.8vw,14px)] py-[clamp(6px,0.8vh,12px)] animate-fade-in"
          >
            <span className="flex min-w-0 items-center gap-[clamp(6px,0.7vw,12px)] text-[clamp(13px,1.2vw,20px)] font-bold">
              <span
                className={`inline-flex size-[clamp(24px,2.2vw,38px)] shrink-0 items-center justify-center rounded-full text-[clamp(11px,1vw,18px)] font-black ${
                  RANK_BADGE_CLASSES[entry.rank] || 'bg-white/10 text-white'
                }`}
              >
                {entry.rank}
              </span>
              <span className="truncate">{entry.displayName}</span>
            </span>
            <span className="ml-2 shrink-0 text-[clamp(15px,1.5vw,26px)] font-black text-emerald-400">
              {entry.score}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
