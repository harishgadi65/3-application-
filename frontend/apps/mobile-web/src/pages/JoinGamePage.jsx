import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionApi } from '@smartad/api-client';
import { useToast } from '@smartad/shared-ui';
import QRScanner from '../components/QRScanner.jsx';

const CODE_LENGTH = 6;

function sanitizeCode(raw) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
}

/** Best-effort extraction of a 6-char code from a scanned QR payload,
 * which may be a bare code or a deep link like https://host/join?code=ABC123. */
function extractCode(raw) {
  try {
    const url = new URL(raw);
    const fromQuery = url.searchParams.get('code');
    if (fromQuery) return sanitizeCode(fromQuery);
    const lastSegment = url.pathname.split('/').filter(Boolean).pop();
    if (lastSegment) return sanitizeCode(lastSegment);
  } catch {
    // not a URL — fall through and treat raw as the code itself
  }
  return sanitizeCode(raw);
}

export default function JoinGamePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (code.length !== CODE_LENGTH || loading) return;
    setLoading(true);
    try {
      const result = await sessionApi.joinSession(code);
      const playerId = result?.playerId ?? result?.id ?? null;
      navigate(`/play/${code}`, { state: { playerId } });
    } catch (err) {
      toast(err.message || 'Could not join session', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (raw) => {
    setCode(extractCode(raw));
  };

  return (
    <div className="flex min-h-dvh flex-col px-6 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-sm flex-1">
        <h1 className="text-center text-2xl font-black text-white">Join a Game</h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enter the 6-character code shown on the TV screen
        </p>

        <form onSubmit={handleJoin} className="mt-8 flex flex-col gap-4">
          <input
            value={code}
            onChange={(e) => setCode(sanitizeCode(e.target.value))}
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            maxLength={CODE_LENGTH}
            placeholder="ABC123"
            className="input-field text-center text-3xl font-black tracking-[0.35em]"
          />
          <button
            type="submit"
            disabled={code.length !== CODE_LENGTH || loading}
            className="btn-primary"
          >
            {loading ? 'Joining…' : 'Join Session'}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3 text-slate-500">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-xs uppercase">or</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <div className="mt-6">
          <QRScanner onScan={handleScan} />
        </div>
      </div>
    </div>
  );
}
