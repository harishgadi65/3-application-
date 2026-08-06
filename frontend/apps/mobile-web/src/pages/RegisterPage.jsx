import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@smartad/api-client';
import { useToast } from '@smartad/shared-ui';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      loading ||
      !form.username.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.displayName.trim()
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        displayName: form.displayName.trim(),
      });
      authApi.setSession(res, 'USER');
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
        <h1 className="text-center text-3xl font-black text-white">Create Account</h1>
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
            <span className="text-sm font-medium text-slate-300">Username</span>
            <input
              value={form.username}
              onChange={update('username')}
              autoComplete="username"
              className="input-field"
              placeholder="yourname"
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
          <Link to="/login" className="font-semibold text-emerald-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
