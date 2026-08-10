import { useState } from 'react';
import { screenApi } from '@smartad/api-client';

const STORAGE_KEY = 'smartad_display_code';

function sanitizeCode(value) {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16);
}

/** One-time registration for a physical TV/browser installation - validates
 * the code against a real backend Screen before storing it. */
export default function DisplayCodeGate({ children }) {
  const [savedCode, setSavedCode] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  async function register(event) {
    event.preventDefault();
    const normalized = sanitizeCode(code);
    if (normalized.length < 5) {
      setError('Enter the unique display code shown in the Admin Dashboard.');
      return;
    }
    if (!password) {
      setError('Enter the TV setup password.');
      return;
    }
    setChecking(true);
    setError('');
    try {
      await screenApi.verifyTvSetup(normalized, password);
      localStorage.setItem(STORAGE_KEY, normalized);
      setSavedCode(normalized);
    } catch (err) {
      setError(err.message || 'No screen found with that code. Check the Admin Dashboard and try again.');
    } finally {
      setChecking(false);
    }
  }

  if (savedCode) return children;

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-[#050516] p-8 text-white">
      <div className="w-full max-w-xl rounded-[2rem] border border-cyan-400/30 bg-slate-950 p-10 shadow-[0_0_80px_rgba(0,229,255,0.12)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 text-3xl">▣</div>
        <p className="mt-6 text-center text-sm font-black uppercase tracking-[0.35em] text-cyan-400">TV setup</p>
        <h1 className="mt-3 text-center text-4xl font-black">Sign in this TV</h1>
        <p className="mx-auto mt-3 max-w-md text-center text-lg text-slate-400">
          Enter the TV setup password and the unique display code from Admin → Advertisements → Screens. This is required only once on this TV browser.
        </p>

        <form onSubmit={register} className="mt-8 space-y-4">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(event) => { setPassword(event.target.value); setError(''); }}
            placeholder="TV setup password"
            className="w-full rounded-xl border border-slate-700 bg-black px-5 py-4 text-center text-lg font-semibold text-white outline-none focus:border-cyan-400"
          />
          <input
            value={code}
            onChange={(event) => { setCode(sanitizeCode(event.target.value)); setError(''); }}
            placeholder="DSP-0001"
            className="w-full rounded-xl border border-slate-700 bg-black px-5 py-4 text-center font-mono text-3xl font-black uppercase tracking-[0.22em] text-white outline-none focus:border-cyan-400"
          />
          {error && <p className="text-center text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={code.length < 5 || !password || checking}
            className="w-full rounded-xl bg-cyan-400 px-5 py-4 text-lg font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {checking ? 'Checking...' : 'Register this screen'}
          </button>
        </form>
      </div>
    </div>
  );
}
