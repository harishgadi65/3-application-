import { useEffect, useState } from 'react';
import { playerApi } from '@smartad/api-client';
import { LoadingSpinner } from '@smartad/shared-ui';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    playerApi
      .getMyHistory()
      .then((data) => {
        if (cancelled) return;
        setHistory(Array.isArray(data) ? data : data?.items || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load history');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-dvh px-6 pt-[max(2rem,env(safe-area-inset-top))]">
      <h1 className="text-2xl font-black text-white">Game History</h1>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <p className="mt-6 text-center text-red-400">{error}</p>
      ) : history.length === 0 ? (
        <p className="mt-6 text-center text-slate-400">You haven&apos;t played any games yet.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {history.map((item, idx) => (
            <li
              key={item.sessionCode ?? item.id ?? idx}
              className="rounded-2xl bg-slate-900 px-4 py-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">
                  {(item.gameType || 'Game').replace(/_/g, ' ')}
                </span>
                <span className="text-sm text-slate-400">
                  {item.playedAt || item.date
                    ? new Date(item.playedAt || item.date).toLocaleDateString()
                    : ''}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-400">Score: {item.score ?? '—'}</span>
                <span className="font-semibold text-emerald-400">
                  {item.rank ? `#${item.rank}` : ''}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
