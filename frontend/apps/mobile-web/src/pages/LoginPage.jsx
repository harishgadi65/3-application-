import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '@smartad/api-client';
import { useToast } from '@smartad/shared-ui';

/**
 * Shared sign-in screen: reached directly (generic entry) or after a
 * screen QR scan (see ScanScreenPage), which passes state.returnTo so
 * a successful login sends the player back to /scan/:displayCode to
 * enter the session code (instead of /join) - now that they're signed
 * in, ScanScreenPage shows the code-entry step rather than redirecting.
 */
export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const scan = location.state?.returnTo === 'scan' ? location.state : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password || loading) return;
    setLoading(true);
    try {
      const res = await authApi.login({ identifier: identifier.trim(), password });
      authApi.setSession(res, 'USER');

      if (scan) {
        navigate(`/scan/${scan.displayCode}`, { replace: true });
        return;
      }

      navigate('/join', { replace: true });
    } catch (err) {
      toast(err.message || 'Login failed', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <div className="mx-auto w-full max-w-sm">
        {scan && (
          <p className="text-center text-xs font-bold uppercase tracking-[0.35em] text-cyan-400">
            Screen {scan.displayCode}
          </p>
        )}
        <h1 className="mt-2 text-center text-3xl font-black text-white">SmartAd Play</h1>
        <p className="mt-2 text-center text-sm text-slate-400">Sign in to join a session</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-300">Mobile number or email</span>
            <input
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="input-field"
              placeholder="9876543210 or you@example.com"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-300">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </label>
          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          New here?{' '}
          <Link to="/register" state={location.state} className="font-semibold text-emerald-400">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
