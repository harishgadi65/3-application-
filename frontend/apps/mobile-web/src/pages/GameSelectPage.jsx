import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { sessionApi } from '@smartad/api-client';
import { useToast } from '@smartad/shared-ui';

const GAMES = [
  { type: 'SNAKE', label: 'Snake', icon: '🐍', description: 'Classic arcade survival' },
  { type: 'TAP_BLAST', label: 'Tap Blast', icon: '🚀', description: 'Fast tapping rocket race' },
];

export default function GameSelectPage() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [starting, setStarting] = useState(null);

  async function chooseGame(gameType) {
    if (starting) return;
    setStarting(gameType);
    try {
      await sessionApi.selectGame(code, gameType);
      navigate(`/play/${code}`, {
        replace: true,
        state: { playerId: location.state?.playerId ?? null },
      });
    } catch (err) {
      toast(err.message || 'Could not start this game', { type: 'error' });
      setStarting(null);
    }
  }

  return (
    <div className="min-h-dvh bg-[#050516] px-5 pb-8 pt-[max(2rem,env(safe-area-inset-top))] font-mono text-[#9bbc0f]">
      <div className="mx-auto max-w-sm">
        <p className="text-center text-xs font-bold uppercase tracking-[0.35em] text-cyan-400">Connected · {code}</p>
        <h1 className="mt-4 text-center text-3xl font-black uppercase">Choose a game</h1>
        <div className="mt-8 grid gap-5">
          {GAMES.map((game) => (
            <button
              key={game.type}
              type="button"
              disabled={Boolean(starting)}
              onClick={() => chooseGame(game.type)}
              className="rounded-2xl border-2 border-[#9bbc0f] bg-[#0f380f] p-6 text-left shadow-[0_0_24px_rgba(155,188,15,0.22)] active:scale-[0.98] disabled:opacity-60"
            >
              <span className="text-6xl">{game.icon}</span>
              <p className="mt-4 text-2xl font-black uppercase text-[#d7f25b]">{game.label}</p>
              <p className="mt-1 text-sm text-[#9bbc0f]">{game.description}</p>
              <p className="mt-5 text-xs font-black uppercase tracking-widest text-cyan-300">
                {starting === game.type ? 'Starting…' : 'Tap to play ▶'}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
