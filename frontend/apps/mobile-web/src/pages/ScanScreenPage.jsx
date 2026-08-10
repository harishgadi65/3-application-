import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { screenApi } from '@smartad/api-client';
import { LoadingSpinner } from '@smartad/shared-ui';

/**
 * Landing point for a screen's "Scan to Play" QR (see tv-display's
 * ScreenIdlePage). Joins - or, for the first scanner, creates - that
 * screen's pending session, then hands off to the existing game-select
 * flow, restricted to that screen's assigned games.
 */
export default function ScanScreenPage() {
  const { displayCode } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    screenApi
      .joinScreenSession(displayCode)
      .then((session) => {
        if (cancelled) return;
        const code = session?.sessionCode ?? session?.code;
        if (!code) throw new Error('No session code returned');
        navigate(`/select/${code}`, { replace: true });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not join this screen.');
      });
    return () => {
      cancelled = true;
    };
  }, [displayCode, navigate]);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-2xl font-black text-white">Couldn&apos;t join</p>
        <p className="text-sm text-slate-400">{error}</p>
        <button type="button" className="btn-primary mt-2" onClick={() => navigate('/join', { replace: true })}>
          Enter a code instead
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <LoadingSpinner />
      <p className="text-sm text-slate-400">Connecting to screen {displayCode}…</p>
    </div>
  );
}
