import { useMemo } from 'react';

const CHOICES = [
  { value: 'ROCK', emoji: '🪨', label: 'Rock' },
  { value: 'PAPER', emoji: '✋', label: 'Paper' },
  { value: 'SCISSORS', emoji: '✂️', label: 'Scissors' },
];

const OUTCOME_LABEL = {
  WIN: { text: 'You won this round!', color: 'text-emerald-400' },
  LOSE: { text: 'You lost this round', color: 'text-red-400' },
  TIE: { text: "It's a tie!", color: 'text-amber-400' },
};

/**
 * Rock Paper Scissors controller: three big pick buttons during the
 * CHOOSING phase (locks in a CHOOSE action, then waits), a reveal card
 * during REVEAL showing both picks and the round result. Round tally and
 * opponent name come straight from the shared game state - same payload
 * the TV renders in full.
 */
export default function RpsPicker({ onAction, gameUpdateState, playerId }) {
  const state = gameUpdateState?.state;
  const players = state?.players || {};

  const self = playerId != null ? players[String(playerId)] : null;
  const opponentEntry = useMemo(
    () => Object.entries(players).find(([id]) => id !== String(playerId)),
    [players, playerId],
  );
  const opponent = opponentEntry?.[1] || null;

  if (!state) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">Loading game…</div>
    );
  }

  const isChoosing = state.roundPhase === 'CHOOSING';
  const hasPicked = Boolean(self?.pick);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-6 py-4 text-center">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
          Round {state.currentRound} of {state.totalRounds}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          You {self?.roundsWon ?? 0} — {opponent?.roundsWon ?? 0} {opponent?.displayName || 'Opponent'}
        </p>
      </div>

      {isChoosing ? (
        <>
          <p className="text-lg font-black text-white">
            {hasPicked ? `Waiting for ${opponent?.displayName || 'opponent'}…` : 'Choose your move!'}
          </p>
          <div className="grid w-full max-w-xs grid-cols-3 gap-3">
            {CHOICES.map((choice) => (
              <button
                key={choice.value}
                type="button"
                disabled={hasPicked}
                onClick={() => onAction({ type: 'CHOOSE', data: { choice: choice.value } })}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition active:scale-95 disabled:opacity-40 ${
                  self?.pick === choice.value
                    ? 'border-emerald-400 bg-emerald-500/20'
                    : 'border-slate-700 bg-slate-800/60'
                }`}
              >
                <span className="text-4xl">{choice.emoji}</span>
                <span className="text-xs font-bold uppercase text-slate-300">{choice.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex w-full max-w-xs flex-col items-center gap-4">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex flex-1 flex-col items-center gap-1">
              <span className="text-6xl">{CHOICES.find((c) => c.value === self?.pick)?.emoji || '❓'}</span>
              <span className="text-xs font-bold uppercase text-slate-400">You</span>
            </div>
            <span className="text-2xl font-black text-slate-500">VS</span>
            <div className="flex flex-1 flex-col items-center gap-1">
              <span className="text-6xl">{CHOICES.find((c) => c.value === opponent?.pick)?.emoji || '❓'}</span>
              <span className="truncate text-xs font-bold uppercase text-slate-400">
                {opponent?.displayName || 'Opponent'}
              </span>
            </div>
          </div>
          {self?.lastRoundOutcome && (
            <p className={`text-lg font-black ${OUTCOME_LABEL[self.lastRoundOutcome]?.color || 'text-white'}`}>
              {OUTCOME_LABEL[self.lastRoundOutcome]?.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
