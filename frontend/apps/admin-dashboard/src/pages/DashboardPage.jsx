import { useCallback, useEffect, useState } from 'react';
import { sessionApi, adApi, gameApi } from '../lib/api.js';
import { LoadingSpinner } from '@smartad/shared-ui';
import StatsCard from '../components/StatsCard.jsx';

export default function DashboardPage() {
  const [sessions, setSessions] = useState([]);
  const [adCount, setAdCount] = useState(0);
  const [gameCount, setGameCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [activeSessions, ads, games] = await Promise.all([
        sessionApi.listActiveSessions(),
        adApi.listAds(),
        gameApi.listGames(),
      ]);
      setSessions(activeSessions || []);
      setAdCount((ads || []).length);
      setGameCount((games || []).length);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Overview of live sessions, advertisements, and available games.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatsCard
              label="Active sessions"
              value={sessions.length}
              accent="indigo"
            />
            <StatsCard label="Total ads" value={adCount} accent="amber" />
            <StatsCard
              label="Available game types"
              value={gameCount}
              accent="emerald"
            />
          </div>
        </>
      )}
    </div>
  );
}
