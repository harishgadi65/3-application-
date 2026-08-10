import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authApi, screenApi } from '@smartad/api-client';
import { useToast } from '@smartad/shared-ui';

/**
 * Landing point for a screen's "Scan to Play" QR (see tv-display's
 * ScreenIdlePage). No login/registration - just enough details to identify
 * the player (mobile, email, age) plus the unique game session code shown
 * beside the QR on the TV (confirms they're joining the screen they're
 * actually standing in front of), then joins (or, for the first scanner,
 * creates) that screen's pending session and hands off to the existing
 * game-select flow, restricted to that screen's assigned games.
 */
export default function ScanScreenPage() {
  const { displayCode } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ mobile: '', email: '', age: '', sessionCode: '' });
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading || !form.mobile.trim() || !form.email.trim() || !form.age || !form.sessionCode.trim()) return;
    setLoading(true);
    try {
      const activeSession = await screenApi.getActiveSessionForScreen(displayCode);
      const expectedCode = activeSession?.sessionCode ?? activeSession?.code;
      if (!expectedCode || expectedCode.toUpperCase() !== form.sessionCode.trim().toUpperCase()) {
        toast('That code doesn\'t match what\'s shown on the screen. Please check and try again.', { type: 'error' });
        setLoading(false);
        return;
      }

      const auth = await authApi.guestJoin({
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        age: Number(form.age),
      });
      authApi.setSession(auth, 'USER');

      const session = await screenApi.joinScreenSession(displayCode);
      const code = session?.sessionCode ?? session?.code;
      if (!code) throw new Error('No session code returned');
      navigate(`/select/${code}`, { replace: true });
    } catch (err) {
      toast(err.message || 'Could not join this screen.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <div className="mx-auto w-full max-w-sm">
        <p className="text-center text-xs font-bold uppercase tracking-[0.35em] text-cyan-400">Screen {displayCode}</p>
        <h1 className="mt-2 text-center text-3xl font-black text-white">Join to Play</h1>
        <p className="mt-2 text-center text-sm text-slate-400">Enter your details to start playing</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-300">Game session code (shown beside the QR on the screen)</span>
            <input
              value={form.sessionCode}
              onChange={update('sessionCode')}
              className="input-field font-mono uppercase tracking-widest"
              placeholder="ZF6H2M"
            />
          </label>
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
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-300">Age</span>
            <input
              type="number"
              min="1"
              value={form.age}
              onChange={update('age')}
              className="input-field"
              placeholder="25"
            />
          </label>
          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? 'Joining…' : 'Start Playing'}
          </button>
        </form>
      </div>
    </div>
  );
}
