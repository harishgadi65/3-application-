import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionApi, adApi, gameApi } from '../lib/api.js';
import { LoadingSpinner } from '@smartad/shared-ui';
import StatsCard from '../components/StatsCard.jsx';
import SessionCard from '../components/SessionCard.jsx';
import CreateSessionModal from '../components/CreateSessionModal.jsx';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [adCount, setAdCount] = useState(0);
  const [gameCount, setGameCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

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

  function handleCreated(session) {
    setModalOpen(false);
    navigate(`/sessions/${session.code}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Overview of live sessions, advertisements, and available games.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setModalOpen(true)}
        >
          + Create session
        </button>
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

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Active sessions
              </h2>
              {sessions.length > 0 && (
                <button
                  type="button"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  onClick={() => navigate('/sessions')}
                >
                  View all
                </button>
              )}
            </div>

            {sessions.length === 0 ? (
              <div className="card text-center text-sm text-slate-400">
                No active sessions right now. Create one to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sessions.slice(0, 6).map((session) => (
                  <SessionCard key={session.code} session={session} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <CreateSessionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
