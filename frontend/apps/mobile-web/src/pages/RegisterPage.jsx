import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '@smartad/api-client';
import { useToast } from '@smartad/shared-ui';

/**
 * Shared account-creation screen: reached directly (generic entry) or
 * after a screen QR scan (see ScanScreenPage), which passes state.returnTo
 * so a successful registration sends the player back to /scan/:displayCode
 * to enter the session code (instead of /join) - now that they're signed
 * in, ScanScreenPage shows the code-entry step rather than redirecting.
 */
export default function RegisterPage() {
  const [form, setForm] = useState({ displayName: '', email: '', mobile: '', age: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const scan = location.state?.returnTo === 'scan' ? location.state : null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      loading ||
      !form.displayName.trim() ||
      !form.email.trim() ||
      !form.mobile.trim() ||
      !form.age ||
      !form.password
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        age: Number(form.age),
        password: form.password,
      });
      authApi.setSession(res, 'USER');

      if (scan) {
        navigate(`/scan/${scan.displayCode}`, { replace: true });
        return;
      }

      navigate('/join', { replace: true });
    } catch (err) {
      toast(err.message || 'Registration failed', { type: 'error' });
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
        <h1 className="mt-2 text-center text-3xl font-black text-white">Create Account</h1>
        <p className="mt-2 text-center text-sm text-slate-400">Set up your player profile</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-300">Display name</span>
            <input
              value={form.displayName}
              onChange={update('displayName')}
              className="input-field"
              placeholder="Player One"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-300">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={update('email')}
              autoComplete="email"
              className="input-field"
              placeholder="you@example.com"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-300">Mobile number</span>
              <input
                type="tel"
                value={form.mobile}
                onChange={update('mobile')}
                autoComplete="tel"
                className="input-field"
                placeholder="9876543210"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-300">Age</span>
              <input
                type="number"
                min="1"
                value={form.age}
                onChange={update('age')}
                className="input-field"
                placeholder="18"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-300">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={update('password')}
              autoComplete="new-password"
              className="input-field"
              placeholder="••••••••"
            />
          </label>
          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="font-semibold text-emerald-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
