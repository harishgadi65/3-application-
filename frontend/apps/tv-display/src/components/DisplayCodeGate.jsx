import { useState } from 'react';

const STORAGE_KEY = 'smartad_display_code';

function sanitizeCode(value) {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16);
}

/** One-time registration for a physical TV/browser installation. */
export default function DisplayCodeGate({ children }) {
  const [savedCode, setSavedCode] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function register(event) {
    event.preventDefault();
    const normalized = sanitizeCode(code);
    if (normalized.length < 5) {
      setError('Enter the unique display code shown in the Admin Dashboard.');
      return;
    }
    localStorage.setItem(STORAGE_KEY, normalized);
    setSavedCode(normalized);
  }

  if (savedCode) return children;

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-[#050516] p-8 text-white">
      <div className="w-full max-w-xl rounded-[2rem] border border-cyan-400/30 bg-slate-950 p-10 shadow-[0_0_80px_rgba(0,229,255,0.12)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 text-3xl">▣</div>
        <p className="mt-6 text-center text-sm font-black uppercase tracking-[0.35em] text-cyan-400">TV setup</p>
        <h1 className="mt-3 text-center text-4xl font-black">Enter display code</h1>
        <p className="mx-auto mt-3 max-w-md text-center text-lg text-slate-400">
          Find the unique code in Admin → Advertisements → Screens. This is required only once on this TV browser.
        </p>

        <form onSubmit={register} className="mt-8">
          <input
            autoFocus
            value={code}
            onChange={(event) => { setCode(sanitizeCode(event.target.value)); setError(''); }}
            placeholder="DSP-0001"
            className="w-full rounded-xl border border-slate-700 bg-black px-5 py-4 text-center font-mono text-3xl font-black uppercase tracking-[0.22em] text-white outline-none focus:border-cyan-400"
          />
          {error && <p className="mt-3 text-center text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={code.length < 5}
            className="mt-5 w-full rounded-xl bg-cyan-400 px-5 py-4 text-lg font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Register this screen
          </button>
        </form>
      </div>
    </div>
  );
}
