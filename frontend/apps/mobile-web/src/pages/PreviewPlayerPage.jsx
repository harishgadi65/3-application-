import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authApi, sessionApi } from '@smartad/api-client';
import { LoadingSpinner } from '@smartad/shared-ui';

const TESTER_MOBILE = 'preview-tester';
const TESTER_PASSWORD = 'preview-tester-pass-1';

async function ensureTesterSession() {
  try {
    const res = await authApi.register({
      displayName: 'Preview Tester',
      email: 'preview.tester@smartad.local',
      mobile: TESTER_MOBILE,
      age: 99,
      password: TESTER_PASSWORD,
    });
    authApi.setSession(res, 'USER');
  } catch {
    // Already exists from an earlier preview - sign in as the same tester.
    const res = await authApi.login({ identifier: TESTER_MOBILE, password: TESTER_PASSWORD });
    authApi.setSession(res, 'USER');
  }
}

/**
 * Reached only inside the admin dashboard's game-preview modal (embedded
 * in an iframe alongside a live view of /display/:code from tv-display).
 * Silently signs in as a single reusable "Preview Tester" account, joins
 * the given session, then hands off to the normal game-select flow -
 * which auto-starts straight into the game for screen-less sessions (see
 * GameSelectPage) - so the whole preview needs no real phone or account.
 */
export default function PreviewPlayerPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        await ensureTesterSession();
        if (cancelled) return;
        await sessionApi.joinSession(code);
        if (cancelled) return;
        navigate(`/select/${code}`, { replace: true });
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not connect the test player');
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [code, navigate]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#050516] px-6 text-center text-white">
      {error ? (
        <>
          <p className="text-lg font-semibold text-red-400">Preview failed</p>
          <p className="text-sm text-slate-400">{error}</p>
        </>
      ) : (
        <>
          <LoadingSpinner />
          <p className="text-sm text-slate-400">Connecting test player…</p>
        </>
      )}
    </div>
  );
}
