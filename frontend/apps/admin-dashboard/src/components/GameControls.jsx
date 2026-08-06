import { useState } from 'react';
import { sessionApi } from '../lib/api.js';
import { useToast } from '@smartad/shared-ui';

export default function GameControls({ code, phase, playerCount }) {
  const toast = useToast();
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);

  const canStart = phase === 'WAITING' && playerCount >= 1;
  const canEnd = phase === 'COUNTDOWN' || phase === 'PLAYING';

  async function handleStart() {
    setStarting(true);
    try {
      await sessionApi.startSession(code);
      toast('Session started', { type: 'success' });
    } catch (err) {
      toast(err.message || 'Failed to start session', { type: 'error' });
    } finally {
      setStarting(false);
    }
  }

  async function handleEnd() {
    setEnding(true);
    try {
      await sessionApi.endSession(code);
      toast('Session ended', { type: 'success' });
    } catch (err) {
      toast(err.message || 'Failed to end session', { type: 'error' });
    } finally {
      setEnding(false);
    }
  }

  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">
        Game controls
      </h3>
      <div className="flex gap-3">
        <button
          type="button"
          className="btn-primary flex-1"
          onClick={handleStart}
          disabled={!canStart || starting}
        >
          {starting ? 'Starting...' : 'Start game'}
        </button>
        <button
          type="button"
          className="btn-danger flex-1"
          onClick={handleEnd}
          disabled={!canEnd || ending}
        >
          {ending ? 'Ending...' : 'End game'}
        </button>
      </div>
      {!canStart && phase === 'WAITING' && (
        <p className="mt-2 text-xs text-slate-400">
          Waiting for at least one player to join before you can start.
        </p>
      )}
    </div>
  );
}
