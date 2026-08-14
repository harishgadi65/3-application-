import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authApi, screenApi } from '@smartad/api-client';
import { useToast } from '@smartad/shared-ui';

/**
 * Landing point for a screen's "Scan to Play" QR (see tv-display's
 * ScreenIdlePage). A brand-new scanner is sent straight to sign-in/
 * create-account (see LoginPage/RegisterPage, which navigate back here
 * once authenticated); only then is the code shown beside the QR on
 * the TV asked for, confirming the player is standing in front of the
 * right screen right now, before joining (or, for the first scanner,
 * creating) that screen's pending session and landing on the existing
 * game-select flow, restricted to that screen's assigned games.
 */
export default function ScanScreenPage() {
  const { displayCode } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [sessionCode, setSessionCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      navigate('/login', { replace: true, state: { returnTo: 'scan', displayCode } });
    }
  }, [displayCode, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading || !sessionCode.trim()) return;
    setLoading(true);
    try {
      const activeSession = await screenApi.getActiveSessionForScreen(displayCode);
      const expectedCode = activeSession?.sessionCode ?? activeSession?.code;
      if (!expectedCode || expectedCode.toUpperCase() !== sessionCode.trim().toUpperCase()) {
        toast('That code doesn\'t match what\'s shown on the screen. Please check and try again.', { type: 'error' });
        setLoading(false);
        return;
      }

      const session = await screenApi.joinScreenSession(displayCode);
      const code = session?.sessionCode ?? session?.code;
      if (!code) throw new Error('No session code returned');
      navigate(`/select/${code}`, { replace: true });
    } catch (err) {
      toast(err.message || 'Could not join this screen.', { type: 'error' });
      setLoading(false);
    }
  }

  if (!authApi.isAuthenticated()) return null;

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <div className="mx-auto w-full max-w-sm">
        <p className="text-center text-xs font-bold uppercase tracking-[0.35em] text-cyan-400">Screen {displayCode}</p>
        <h1 className="mt-2 text-center text-3xl font-black text-white">Join to Play</h1>
        <p className="mt-2 text-center text-sm text-slate-400">Enter the code shown beside the QR on the screen</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-300">Game session code</span>
            <input
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value)}
              className="input-field font-mono uppercase tracking-widest"
              placeholder="ZF6H2M"
              autoFocus
            />
          </label>
          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? 'Checking…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
