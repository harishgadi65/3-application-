import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { sessionApi, authApi } from '@smartad/api-client';
import { LoadingSpinner, useToast } from '@smartad/shared-ui';
import WinnerBanner from '../components/WinnerBanner.jsx';
import RankBadge from '../components/RankBadge.jsx';
import RewardCard from '../components/RewardCard.jsx';

export default function ResultPage() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [results, setResults] = useState(location.state?.results ?? null);
  const [loading, setLoading] = useState(!location.state?.results);
  const [error, setError] = useState('');
  const playerId = location.state?.playerId ?? null;
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          clearInterval(timer);
          navigate('/join', { replace: true });
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  async function handlePlayAgain() {
    if (restarting) return;
    setRestarting(true);
    try {
      await sessionApi.replaySession(code);
      navigate(`/play/${code}`, { replace: true, state: { playerId } });
    } catch (err) {
      toast(err.message || 'Could not restart the game', { type: 'error' });
      setRestarting(false);
    }
  }

  useEffect(() => {
    if (results) return;
    let cancelled = false;
    setLoading(true);
    sessionApi
      .getResults(code)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load results');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code, results]);

  const rankings = results?.rankings || [];

  const self = useMemo(() => {
    if (playerId) {
      const byId = rankings.find((r) => r.playerId === playerId);
      if (byId) return byId;
    }
    // Fallback for a direct/refreshed load with no route state: match
    // on identity display name as a best effort.
    const identity = authApi.getIdentity?.();
    if (identity) {
      return (
        rankings.find(
          (r) => r.displayName === identity.displayName || r.displayName === identity.username,
        ) || null
      );
    }
    return null;
  }, [rankings, playerId]);

  const isWinner = self ? self.rank === 1 : false;
  const rewardPoints = isWinner ? 100 : Math.max(10, 50 - (self?.rank ?? 5) * 5);

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
        <LoadingSpinner />
        <p className="text-slate-400">Loading results…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-red-400">{error}</p>
        <button type="button" className="btn-primary" onClick={() => navigate('/join')}>
          Back to Join
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col gap-6 px-6 pt-[max(2rem,env(safe-area-inset-top))]">
      <WinnerBanner isWinner={isWinner} rank={self?.rank} displayName={self?.displayName} />

      <div className="overflow-hidden rounded-2xl bg-slate-900">
        <h2 className="border-b border-slate-800 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Final Standings
        </h2>
        <ul>
          {rankings.map((r) => (
            <li
              key={r.playerId}
              className={`flex items-center justify-between border-b border-slate-800 px-4 py-3 last:border-b-0 ${
                r.playerId === self?.playerId ? 'bg-emerald-500/10' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <RankBadge rank={r.rank} />
                <span className="font-medium text-white">{r.displayName}</span>
              </div>
              <span className="font-bold text-slate-200">{r.score}</span>
            </li>
          ))}
        </ul>
      </div>

      <RewardCard points={rewardPoints} />

      <p className="text-center font-mono text-sm text-slate-400">
        Scan screen returns in <span className="font-black text-amber-400">{secondsRemaining}</span>s
      </p>

      <button type="button" className="btn-primary" onClick={handlePlayAgain} disabled={restarting}>
        {restarting ? 'Restarting…' : '▶ Play Again'}
      </button>
    </div>
  );
}
