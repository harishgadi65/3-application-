import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { sessionApi } from '@smartad/api-client';
import { LoadingSpinner, useToast } from '@smartad/shared-ui';

/**
 * Rock Paper Scissors-only step shown right after joining, before the
 * match starts: play solo against the computer (starts immediately), or
 * wait for a friend to scan the same code (starts once they join - see
 * GamePlayPage's own WAITING-phase screen, which we navigate straight into
 * either way). If an earlier player already chose a mode (e.g. we're the
 * second player joining a multiplayer match), skip straight past this
 * screen - nothing to choose, just go watch/wait/play.
 */
export default function RpsModeSelectPage() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [checking, setChecking] = useState(true);
  const [choosing, setChoosing] = useState(null);
  const playerId = location.state?.playerId ?? null;

  function goToPlay() {
    navigate(`/play/${code}`, { replace: true, state: { playerId } });
  }

  useEffect(() => {
    let cancelled = false;
    async function checkExistingMode() {
      try {
        const session = await sessionApi.getSession(code);
        if (cancelled) return;
        if (session?.phase !== 'WAITING') {
          // Mode was already chosen and the match is already under way.
          goToPlay();
          return;
        }
        const mode = await sessionApi.getRpsMode(code);
        if (cancelled) return;
        if (mode) {
          // A first player already picked a mode (multiplayer, still
          // waiting for an opponent) - just go wait alongside them.
          goToPlay();
          return;
        }
        setChecking(false);
      } catch (err) {
        if (!cancelled) {
          toast(err.message || 'Could not load this session', { type: 'error' });
          setChecking(false);
        }
      }
    }
    checkExistingMode();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function choose(mode) {
    if (choosing) return;
    setChoosing(mode);
    try {
      await sessionApi.setRpsMode(code, mode);
      goToPlay();
    } catch (err) {
      toast(err.message || 'Could not start the game', { type: 'error' });
      setChoosing(null);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#050516] px-6 text-center text-white">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#050516] px-6 text-center text-white">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-400">Connected · {code}</p>
        <h1 className="mt-3 text-3xl font-black">Rock Paper Scissors</h1>
        <p className="mt-2 text-sm text-slate-400">How do you want to play?</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-4">
        <button
          type="button"
          onClick={() => choose('SOLO')}
          disabled={Boolean(choosing)}
          className="rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 p-6 text-left active:scale-[0.98] disabled:opacity-60"
        >
          <span className="text-4xl">🤖</span>
          <p className="mt-3 text-xl font-black uppercase">Play vs Computer</p>
          <p className="mt-1 text-sm text-slate-400">Starts right away, no waiting</p>
          {choosing === 'SOLO' && <p className="mt-2 text-xs font-bold uppercase text-emerald-400">Starting…</p>}
        </button>

        <button
          type="button"
          onClick={() => choose('MULTIPLAYER')}
          disabled={Boolean(choosing)}
          className="rounded-2xl border-2 border-cyan-500 bg-cyan-500/10 p-6 text-left active:scale-[0.98] disabled:opacity-60"
        >
          <span className="text-4xl">🧑‍🤝‍🧑</span>
          <p className="mt-3 text-xl font-black uppercase">Invite a Friend</p>
          <p className="mt-1 text-sm text-slate-400">They scan the same code to join</p>
          {choosing === 'MULTIPLAYER' && <p className="mt-2 text-xs font-bold uppercase text-cyan-400">Waiting for them to join…</p>}
        </button>
      </div>
    </div>
  );
}
