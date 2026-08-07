import { useEffect, useState } from 'react';

const RETURN_DELAY_SECONDS = 10;

/**
 * FINISHED phase: winner callout + final rankings + stats, plus a note that
 * a new session will begin shortly.
 */
export default function WinnerScreen({ winner, rankings = [], stats, onComplete }) {
  const sorted = [...rankings].sort((a, b) => a.rank - b.rank);
  const statEntries = stats && typeof stats === 'object' ? Object.entries(stats) : [];
  const [secondsRemaining, setSecondsRemaining] = useState(RETURN_DELAY_SECONDS);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(RETURN_DELAY_SECONDS - elapsed, 0);
      setSecondsRemaining(remaining);
      if (remaining === 0) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-[clamp(8px,1.8vh,24px)] overflow-hidden px-[clamp(16px,3vw,56px)] py-[clamp(10px,1.5vh,20px)] animate-fade-in">
      <p className="text-[clamp(16px,1.7vw,28px)] font-black uppercase tracking-[0.4em] text-amber-400">
        Game over
      </p>

      {winner && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-8xl animate-pulse-glow">🏆</span>
          <h1 className="max-w-[70vw] truncate text-center text-[clamp(28px,3.5vw,58px)] font-black">{winner.displayName}</h1>
          <p className="text-[clamp(20px,2vw,34px)] font-black text-emerald-400">{winner.score} pts</p>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="grid w-full max-w-5xl grid-cols-3 gap-[clamp(8px,1.2vw,20px)]">
          {sorted.slice(0, 6).map((entry) => (
            <div
              key={entry.playerId}
              className="rounded-[clamp(10px,1vw,16px)] border border-white/10 bg-white/5 p-[clamp(8px,1vw,16px)] text-center"
            >
              <p className="text-[clamp(13px,1.2vw,20px)] font-black text-indigo-400">#{entry.rank}</p>
              <p className="truncate text-[clamp(13px,1.2vw,20px)] font-bold">{entry.displayName}</p>
              <p className="text-[clamp(16px,1.5vw,26px)] font-black text-emerald-400">{entry.score}</p>
            </div>
          ))}
        </div>
      )}

      {statEntries.length > 0 && (
        <div className="flex gap-[clamp(16px,3vw,44px)] text-[clamp(12px,1.1vw,18px)] text-slate-300">
          {statEntries.map(([key, value]) => (
            <div key={key} className="text-center">
              <p className="text-[clamp(10px,0.8vw,14px)] uppercase tracking-[0.15em] text-slate-500">{key}</p>
              <p className="text-[clamp(15px,1.4vw,24px)] font-bold text-white">{String(value)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="text-center">
        <p className="text-[clamp(26px,2.8vw,46px)] font-black tabular-nums text-amber-400">
          {secondsRemaining}
        </p>
        <p className="mt-1 text-[clamp(11px,1vw,17px)] text-slate-400">
          Returning to the scan screen in {secondsRemaining} seconds
        </p>
      </div>
    </div>
  );
}
