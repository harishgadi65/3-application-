import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api.js';
import { useToast } from '@smartad/shared-ui';

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await authApi.adminLogin({ username, password });
      authApi.setSession(res, 'ADMIN');
      toast('Welcome back', { type: 'success' });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err.message || 'Invalid credentials';
      setError(message);
      toast(message, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            SA
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            SmartAd Admin
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to manage sessions and advertisements
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
