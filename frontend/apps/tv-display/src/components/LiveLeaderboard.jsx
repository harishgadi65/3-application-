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
    <div className="bg-black/60 border border-white/10 rounded-3xl p-6 backdrop-blur w-full h-full flex flex-col">
      <p className="text-3xl font-black uppercase tracking-[0.2em] text-indigo-400 mb-4 shrink-0">
        Leaderboard
      </p>
      <ol className="flex flex-col gap-3 overflow-hidden flex-1">
        {sorted.length === 0 && (
          <p className="text-2xl text-slate-500">Scores will appear here</p>
        )}
        {sorted.slice(0, 8).map((entry) => (
          <li
            key={entry.playerId}
            className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 animate-fade-in"
          >
            <span className="flex items-center gap-3 text-2xl font-bold min-w-0">
              <span
                className={`inline-flex items-center justify-center shrink-0 w-10 h-10 rounded-full text-xl font-black ${
                  RANK_BADGE_CLASSES[entry.rank] || 'bg-white/10 text-white'
                }`}
              >
                {entry.rank}
              </span>
              <span className="truncate">{entry.displayName}</span>
            </span>
            <span className="text-3xl font-black text-emerald-400 shrink-0 ml-2">
              {entry.score}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
