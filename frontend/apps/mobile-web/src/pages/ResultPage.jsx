import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { sessionApi, authApi } from '@smartad/api-client';
import { LoadingSpinner } from '@smartad/shared-ui';
import WinnerBanner from '../components/WinnerBanner.jsx';
import RankBadge from '../components/RankBadge.jsx';
import RewardCard from '../components/RewardCard.jsx';

export default function ResultPage() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [results, setResults] = useState(location.state?.results ?? null);
  const [loading, setLoading] = useState(!location.state?.results);
  const [error, setError] = useState('');
  const playerId = location.state?.playerId ?? null;

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

      <button type="button" className="btn-primary" onClick={() => navigate('/join')}>
        Play Again
      </button>
    </div>
  );
}
