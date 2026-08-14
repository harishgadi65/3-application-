import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { sessionApi, listGames } from '@smartad/api-client';
import { LoadingSpinner, useToast } from '@smartad/shared-ui';

const ICONS = {
  SNAKE: '🐍',
  TAP_BLAST: '🚀',
  PLATFORM_DASH: '🏃',
};

const DESCRIPTIONS = {
  SNAKE: 'Classic arcade survival',
  TAP_BLAST: 'Fast tapping rocket race',
  PLATFORM_DASH: 'Run, jump, and stomp your way to the flag',
};

export default function GameSelectPage() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [games, setGames] = useState(null);
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

  useEffect(() => {
    let cancelled = false;
    sessionApi
      .getSession(code)
      .then(async (session) => {
        if (cancelled) return;
        if (session?.screenGames?.length > 0) {
          setGames(session.screenGames.map((g) => ({ type: g.gameType, label: g.displayName })));
          return;
        }
        // Not started from a screen (e.g. an admin preview/test session, which
        // always targets exactly one gameType) - skip the picker entirely.
        if (session?.gameType) {
          // Leave `games` as null so the spinner keeps showing while we
          // auto-start and navigate away - never render "No games available".
          await chooseGame(session.gameType);
          return;
        }
        const catalog = await listGames();
        if (!cancelled) {
          setGames((Array.isArray(catalog) ? catalog : []).map((g) => ({ type: g.gameType, label: g.displayName })));
        }
      })
      .catch((err) => {
        if (!cancelled) toast(err.message || 'Failed to load games for this session', { type: 'error' });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div className="min-h-dvh bg-[#050516] px-5 pb-8 pt-[max(2rem,env(safe-area-inset-top))] font-mono text-[#9bbc0f]">
      <div className="mx-auto max-w-sm">
        <p className="text-center text-xs font-bold uppercase tracking-[0.35em] text-cyan-400">Connected · {code}</p>
        <h1 className="mt-4 text-center text-3xl font-black uppercase">Choose a game</h1>

        {games === null ? (
          <div className="mt-10 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : games.length === 0 ? (
          <p className="mt-10 text-center text-sm text-[#9bbc0f]">No games are available for this session.</p>
        ) : (
          <div className="mt-8 grid gap-5">
            {games.map((game) => (
              <button
                key={game.type}
                type="button"
                disabled={Boolean(starting)}
                onClick={() => chooseGame(game.type)}
                className="rounded-2xl border-2 border-[#9bbc0f] bg-[#0f380f] p-6 text-left shadow-[0_0_24px_rgba(155,188,15,0.22)] active:scale-[0.98] disabled:opacity-60"
              >
                <span className="text-6xl">{ICONS[game.type] || '🎮'}</span>
                <p className="mt-4 text-2xl font-black uppercase text-[#d7f25b]">{game.label}</p>
                <p className="mt-1 text-sm text-[#9bbc0f]">{DESCRIPTIONS[game.type] || 'Tap to start playing'}</p>
                <p className="mt-5 text-xs font-black uppercase tracking-widest text-cyan-300">
                  {starting === game.type ? 'Starting…' : 'Tap to play ▶'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
