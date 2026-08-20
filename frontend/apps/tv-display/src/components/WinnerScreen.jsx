import { useEffect, useMemo, useState } from 'react';

const RETURN_DELAY_SECONDS = 30;
const CIRCUMFERENCE = 2 * Math.PI * 45;

const REASON_LABELS = {
  LAST_STANDING: 'Last standing',
  TIME_EXPIRED: "Time's up",
  TARGET_REACHED: 'Target reached',
  ADMIN_ENDED: 'Ended by host',
};

const MEDAL_STYLES = {
  1: 'border-amber-400/60 bg-amber-400/10 text-amber-300',
  2: 'border-slate-300/40 bg-slate-300/10 text-slate-200',
  3: 'border-amber-700/50 bg-amber-700/10 text-amber-500',
};

const GAME_LABELS = {
  SNAKE: 'Snake',
  TAP_BLAST: 'Tap Blast Race',
  PLATFORM_DASH: 'Platform Dash',
  ROCK_PAPER_SCISSORS: 'Rock Paper Scissors',
};

function humanizeReason(reason) {
  if (!reason) return null;
  if (REASON_LABELS[reason]) return REASON_LABELS[reason];
  return reason
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Dummy demo reward until the game-end message carries a real one. */
const DUMMY_REWARD = { points: 100, offerTitle: '20% OFF your next visit', provider: 'Smart Play Rewards' };

const CONFETTI = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${(i * 0.7) % 6}s`,
  duration: `${5 + (i % 5)}s`,
  drift: `${((i % 5) - 2) * 40}px`,
  color: i % 2 === 0 ? '#fbbf24' : '#34d399',
  size: 8 + (i % 3) * 4,
}));

/**
 * FINISHED phase: three-column winner panel (reward / champion / score),
 * final standings, and a 30s return countdown - rebuilt to stay readable
 * inside the short, wide content area left over once ad zones take the
 * outer edges (see ScreenLayout). Background rays/confetti/trophy glow
 * are purely decorative, sit behind the content (z-index), and respect
 * prefers-reduced-motion via the .animate-* classes in index.css.
 */
export default function WinnerScreen({ winner, rankings = [], stats, gameType, reward, onComplete }) {
  const sorted = useMemo(() => [...rankings].sort((a, b) => a.rank - b.rank), [rankings]);
  const totalPlayers = stats?.totalPlayers ?? rankings.length;
  const reasonLabel = humanizeReason(stats?.reason);
  const gameLabel = GAME_LABELS[gameType] || gameType;
  const activeReward = reward || DUMMY_REWARD;

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

  const progress = secondsRemaining / RETURN_DELAY_SECONDS;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-[clamp(6px,1.4vh,18px)] overflow-y-auto overflow-x-hidden px-[clamp(16px,3vw,56px)] py-[clamp(8px,1.2vh,16px)] animate-fade-in">
      {/* Decorative background: rotating spotlight rays + falling confetti, always behind content */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="animate-spotlight absolute left-1/2 top-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2 opacity-30"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, rgba(251,191,36,0.35) 8deg, transparent 20deg, transparent 180deg, rgba(251,191,36,0.25) 188deg, transparent 200deg)',
          }}
        />
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="animate-confetti absolute top-0 block rounded-sm"
            style={{
              left: c.left,
              width: c.size,
              height: c.size,
              backgroundColor: c.color,
              animationDelay: c.delay,
              animationDuration: c.duration,
              '--drift': c.drift,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex h-full w-full max-w-6xl flex-col items-center justify-evenly gap-[clamp(14px,3vh,36px)] py-[clamp(14px,3.2vh,42px)]">
        {/* Winner panel: reward | champion | score */}
        <div className="grid w-full shrink-0 grid-cols-3 items-stretch gap-[clamp(12px,2vw,34px)] rounded-[clamp(18px,2.2vw,40px)] border border-amber-400/40 bg-black/40 p-[clamp(18px,2.4vw,42px)] shadow-[0_0_60px_rgba(251,191,36,0.12)]">
          <div className="flex flex-col items-start justify-center gap-2 border-r border-white/10 pr-[clamp(12px,1.6vw,24px)]">
            <p className="flex items-center gap-1.5 text-[clamp(15px,1.6vw,24px)] font-black uppercase tracking-[0.2em] text-emerald-400">
              🎁 Reward earned
            </p>
            {typeof activeReward.points === 'number' && (
              <p className="text-[clamp(24px,2.6vw,42px)] font-black text-white">+{activeReward.points} points</p>
            )}
            {activeReward.offerTitle && (
              <>
                <p className="mt-1 text-[clamp(13px,1.3vw,20px)] uppercase tracking-wide text-slate-400">
                  Coupon unlocked
                </p>
                <p className="text-[clamp(19px,2vw,32px)] font-bold text-amber-300">{activeReward.offerTitle}</p>
                {activeReward.provider && (
                  <p className="text-[clamp(13px,1.3vw,20px)] text-slate-500">{activeReward.provider}</p>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col items-center justify-center gap-2 px-[clamp(10px,1.6vw,22px)]">
            <span className="animate-trophy-float text-[clamp(54px,7vw,116px)]">🏆</span>
            <p className="text-[clamp(15px,1.6vw,24px)] font-black uppercase tracking-[0.3em] text-amber-400">
              Champion
            </p>
            <p className="max-w-full truncate text-[clamp(26px,3vw,48px)] font-black text-white">
              {winner?.displayName || '—'}
            </p>
            {reasonLabel && <p className="text-[clamp(15px,1.5vw,23px)] text-slate-400">{reasonLabel}</p>}
          </div>

          <div className="flex flex-col items-end justify-center gap-2 border-l border-white/10 pl-[clamp(12px,1.6vw,24px)] text-right">
            <p className="text-[clamp(15px,1.6vw,24px)] font-black uppercase tracking-[0.2em] text-slate-400">
              Final score
            </p>
            <p className="text-[clamp(46px,5.8vw,92px)] font-black text-amber-400">{winner?.score ?? 0}</p>
            <p className="text-[clamp(13px,1.3vw,20px)] uppercase tracking-wide text-slate-500">points</p>
          </div>
        </div>

        {/* Standings */}
        {sorted.length > 0 && (
          <div className="w-full max-w-4xl shrink-0 overflow-hidden rounded-[clamp(14px,1.6vw,26px)] border border-white/10 bg-white/5">
            <div className="flex items-center justify-between border-b border-white/10 px-[clamp(14px,1.8vw,30px)] py-[clamp(8px,1.4vh,18px)]">
              <p className="text-[clamp(15px,1.6vw,23px)] font-black uppercase tracking-[0.2em] text-white">
                Final standings
              </p>
              <p className="text-[clamp(14px,1.3vw,19px)] font-bold uppercase tracking-wide text-slate-500">Score</p>
            </div>
            {sorted.slice(0, 5).map((entry) => (
              <div
                key={entry.playerId}
                className={`flex items-center justify-between border-b border-white/5 px-[clamp(14px,1.8vw,30px)] py-[clamp(7px,1.3vh,16px)] last:border-b-0 ${
                  entry.rank === 1 ? 'bg-amber-400/10' : ''
                }`}
              >
                <div className="flex min-w-0 items-center gap-[clamp(10px,1.2vw,22px)]">
                  <span
                    className={`flex h-[clamp(26px,2.9vw,44px)] w-[clamp(26px,2.9vw,44px)] flex-shrink-0 items-center justify-center rounded-full border text-[clamp(14px,1.3vw,20px)] font-black ${
                      MEDAL_STYLES[entry.rank] || 'border-white/10 bg-white/5 text-slate-300'
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <span className="truncate text-[clamp(19px,1.9vw,30px)] font-bold text-white">
                    {entry.displayName}
                  </span>
                </div>
                <span className="text-[clamp(19px,1.9vw,30px)] font-black text-emerald-400">{entry.score}</span>
              </div>
            ))}
          </div>
        )}

        {/* Game label + Game Over */}
        <div className="shrink-0 text-center">
          {gameLabel && (
            <p className="text-[clamp(14px,1.3vw,20px)] font-bold uppercase tracking-[0.4em] text-slate-500">
              {gameLabel}
            </p>
          )}
          <p className="text-[clamp(32px,3.8vw,64px)] font-black uppercase tracking-[0.15em] text-amber-400">
            Game over
          </p>
        </div>

        {/* Countdown + meta */}
        <div className="flex w-full max-w-4xl shrink-0 items-center justify-between gap-[clamp(14px,2.3vw,38px)] rounded-[clamp(14px,1.6vw,26px)] border border-white/10 bg-black/30 px-[clamp(18px,2.4vw,40px)] py-[clamp(11px,1.8vh,22px)]">
          <div className="whitespace-nowrap text-left">
            <p className="text-[clamp(12px,1.1vw,17px)] uppercase tracking-[0.2em] text-slate-500">Total players</p>
            <p className="text-[clamp(20px,2vw,32px)] font-black text-white">{totalPlayers}</p>
          </div>
          <div className="whitespace-nowrap text-left">
            <p className="text-[clamp(12px,1.1vw,17px)] uppercase tracking-[0.2em] text-slate-500">Winning reason</p>
            <p className="text-[clamp(20px,2vw,32px)] font-black text-white whitespace-nowrap">{reasonLabel || '—'}</p>
          </div>
          <div className="flex shrink-0 items-center gap-[clamp(12px,1.6vw,24px)]">
            <svg width="clamp(56px, 5.8vw, 88px)" height="clamp(56px, 5.8vw, 88px)" viewBox="0 0 100 100" className="h-[clamp(56px,5.8vw,88px)] w-[clamp(56px,5.8vw,88px)] -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                style={{ transition: 'stroke-dashoffset 0.25s linear' }}
              />
            </svg>
            <div className="whitespace-nowrap text-left">
              <p className="text-[clamp(20px,2vw,32px)] font-black tabular-nums text-amber-400">
                Next game in {secondsRemaining}s
              </p>
              <p className="text-[clamp(12px,1.1vw,17px)] text-slate-500">Replay now or scan the next code</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
