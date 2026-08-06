/**
 * FINISHED phase: winner callout + final rankings + stats, plus a note that
 * a new session will begin shortly.
 */
export default function WinnerScreen({ winner, rankings = [], stats }) {
  const sorted = [...rankings].sort((a, b) => a.rank - b.rank);
  const statEntries = stats && typeof stats === 'object' ? Object.entries(stats) : [];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-8 px-16 animate-fade-in">
      <p className="text-3xl uppercase tracking-[0.5em] text-amber-400 font-black">
        Game over
      </p>

      {winner && (
        <div className="flex flex-col items-center gap-2">
          <span className="text-8xl animate-pulse-glow">🏆</span>
          <h1 className="text-7xl font-black text-center">{winner.displayName}</h1>
          <p className="text-4xl font-black text-emerald-400">{winner.score} pts</p>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="grid grid-cols-3 gap-6 w-full max-w-5xl">
          {sorted.slice(0, 6).map((entry) => (
            <div
              key={entry.playerId}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center"
            >
              <p className="text-2xl font-black text-indigo-400">#{entry.rank}</p>
              <p className="text-2xl font-bold truncate">{entry.displayName}</p>
              <p className="text-3xl font-black text-emerald-400">{entry.score}</p>
            </div>
          ))}
        </div>
      )}

      {statEntries.length > 0 && (
        <div className="flex gap-12 text-2xl text-slate-300">
          {statEntries.map(([key, value]) => (
            <div key={key} className="text-center">
              <p className="uppercase tracking-[0.2em] text-slate-500 text-lg">{key}</p>
              <p className="text-3xl font-bold text-white">{String(value)}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-2xl text-slate-400 animate-pulse-glow">
        New session will begin shortly...
      </p>
    </div>
  );
}
