import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionApi } from '../lib/api.js';
import { LoadingSpinner } from '@smartad/shared-ui';
import SessionCard from '../components/SessionCard.jsx';
import CreateSessionModal from '../components/CreateSessionModal.jsx';

const POLL_INTERVAL_MS = 5000;

export default function SessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const loadSessions = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const activeSessions = await sessionApi.listActiveSessions();
      setSessions(activeSessions || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(() => loadSessions({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadSessions]);

  function handleCreated(session) {
    setModalOpen(false);
    navigate(`/sessions/${session.code}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Sessions</h1>
          <p className="text-sm text-slate-500">
            All currently active game sessions. Refreshes automatically.
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
      ) : sessions.length === 0 ? (
        <div className="card text-center text-sm text-slate-400">
          No active sessions right now. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <SessionCard key={session.code} session={session} />
          ))}
        </div>
      )}

      <CreateSessionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
