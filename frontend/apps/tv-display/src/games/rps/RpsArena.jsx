const CHOICE_EMOJI = { ROCK: '🪨', PAPER: '✋', SCISSORS: '✂️' };

const OUTCOME_STYLE = {
  WIN: 'border-emerald-400 bg-emerald-400/10 text-emerald-300',
  LOSE: 'border-white/10 bg-white/5 text-slate-400',
  TIE: 'border-amber-400 bg-amber-400/10 text-amber-300',
};

function PlayerCard({ player, revealing }) {
  if (!player) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-[clamp(16px,1.8vw,32px)] border-2 border-white/10 bg-white/5 p-[clamp(16px,2vw,36px)] text-slate-500">
        <span className="text-[clamp(32px,4vw,56px)]">⏳</span>
        <p className="text-[clamp(12px,1.1vw,17px)] font-bold uppercase tracking-wide">Waiting for opponent…</p>
      </div>
    );
  }
  const pickEmoji = player?.pick ? CHOICE_EMOJI[player.pick] : null;
  const outcomeClass = revealing ? OUTCOME_STYLE[player?.lastRoundOutcome] || 'border-white/10 bg-white/5' : 'border-white/10 bg-white/5';

  return (
    <div className={`flex flex-1 flex-col items-center gap-[clamp(10px,1.5vh,22px)] rounded-[clamp(16px,1.8vw,32px)] border-2 p-[clamp(16px,2vw,36px)] transition ${outcomeClass}`}>
      <p className="flex items-center gap-2 text-[clamp(16px,1.6vw,26px)] font-black uppercase tracking-wide text-white">
        {player?.computer && <span>🤖</span>}
        <span className="max-w-[16ch] truncate">{player?.displayName || '—'}</span>
      </p>
      <div className="flex h-[clamp(80px,10vw,160px)] w-[clamp(80px,10vw,160px)] items-center justify-center rounded-full bg-black/30 text-[clamp(48px,6vw,96px)]">
        {revealing ? pickEmoji || '❔' : player?.pick ? '✅' : '⏳'}
      </div>
      <p className="text-[clamp(12px,1.1vw,17px)] font-bold uppercase tracking-[0.2em] text-slate-400">
        {revealing ? player?.lastRoundOutcome || '' : player?.pick ? 'Ready' : 'Choosing…'}
      </p>
      <p className="text-[clamp(22px,2.4vw,38px)] font-black text-amber-400">{player?.roundsWon ?? 0}</p>
      <p className="text-[clamp(10px,0.9vw,14px)] uppercase tracking-widest text-slate-500">rounds won</p>
    </div>
  );
}

/**
 * Rock Paper Scissors TV view: both players' names and running round tally
 * always visible, a round counter, and either a "choosing" state (picks
 * hidden) or - once both have picked (or the timer runs out) - a reveal
 * with both emoji picks and the round's winner highlighted.
 */
export default function RpsArena({ state }) {
  const players = Object.values(state?.players || {});
  const revealing = state?.roundPhase === 'REVEAL';

  if (players.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-slate-500">
        Waiting for players...
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-[clamp(14px,2.5vh,32px)] overflow-hidden bg-gradient-to-b from-slate-950 to-black p-[clamp(16px,2.5vw,44px)]">
      <div className="text-center">
        <p className="text-[clamp(11px,1vw,16px)] font-bold uppercase tracking-[0.35em] text-cyan-400">
          Round {state?.currentRound ?? 1} of {state?.totalRounds ?? 6}
        </p>
        <p className="mt-1 text-[clamp(20px,2.2vw,36px)] font-black uppercase text-white">
          {revealing ? 'Reveal!' : 'Choose now!'}
        </p>
      </div>

      <div className="flex w-full max-w-4xl items-stretch gap-[clamp(12px,2vw,32px)]">
        <PlayerCard player={players[0]} revealing={revealing} />
        <div className="flex items-center justify-center text-[clamp(24px,2.6vw,42px)] font-black text-slate-600">VS</div>
        <PlayerCard player={players[1]} revealing={revealing} />
      </div>

      <p className="text-[clamp(12px,1.1vw,16px)] uppercase tracking-widest text-slate-500">
        {revealing ? 'Next round starting soon…' : `${state?.secondsRemaining ?? ''}s to choose`}
      </p>
    </div>
  );
}
