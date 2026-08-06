import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@smartad/api-client';
import { useToast } from '@smartad/shared-ui';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password || loading) return;
    setLoading(true);
    try {
      const res = await authApi.login({ username: username.trim(), password });
      authApi.setSession(res, 'USER');
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
        <h1 className="text-center text-3xl font-black text-white">SmartAd Play</h1>
        <p className="mt-2 text-center text-sm text-slate-400">Sign in to join a session</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-300">Username</span>
            <input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="yourname"
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
          <Link to="/register" className="font-semibold text-emerald-400">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
