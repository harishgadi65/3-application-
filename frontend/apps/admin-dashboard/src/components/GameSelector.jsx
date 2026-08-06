import { useEffect, useState } from 'react';
import { gameApi, sessionApi } from '../lib/api.js';
import { useToast } from '@smartad/shared-ui';

/**
 * Fetches available game types and lets the admin pick one, tweak the
 * defaults, and create a session. Calls onCreated(session) once the
 * session has been created successfully.
 */
export default function GameSelector({ onCreated, onCancel }) {
  const toast = useToast();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [gameDurationSeconds, setGameDurationSeconds] = useState(60);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    gameApi
      .listGames()
      .then((list) => {
        if (cancelled) return;
        setGames(list || []);
        if (list && list.length > 0) {
          selectGame(list[0]);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load games');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function selectGame(game) {
    setSelectedType(game.gameType);
    setMaxPlayers(game.defaultMaxPlayers ?? 4);
    setGameDurationSeconds(game.defaultDurationSeconds ?? 60);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedType) return;
    setSubmitting(true);
    setError('');
    try {
      const session = await sessionApi.createSession({
        gameType: selectedType,
        maxPlayers: Number(maxPlayers),
        gameDurationSeconds: Number(gameDurationSeconds),
      });
      toast('Session created', { type: 'success' });
      onCreated?.(session);
    } catch (err) {
      setError(err.message || 'Failed to create session');
      toast(err.message || 'Failed to create session', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading game types...</p>;
  }

  if (error && games.length === 0) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="label">Game</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {games.map((game) => {
            const isSelected = game.gameType === selectedType;
            return (
              <button
                type="button"
                key={game.gameType}
                onClick={() => selectGame(game)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-white hover:border-indigo-300'
                }`}
              >
                <p className="font-semibold text-slate-900">
                  {game.displayName || game.gameType}
                </p>
                {game.description && (
                  <p className="mt-1 text-xs text-slate-500">
                    {game.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  Up to {game.defaultMaxPlayers} players &middot;{' '}
                  {game.defaultDurationSeconds}s
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="maxPlayers">
            Max players
          </label>
          <input
            id="maxPlayers"
            type="number"
            min={1}
            max={64}
            className="input"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="duration">
            Duration (seconds)
          </label>
          <input
            id="duration"
            type="number"
            min={10}
            max={3600}
            className="input"
            value={gameDurationSeconds}
            onChange={(e) => setGameDurationSeconds(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            className="btn-ghost"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn-primary"
          disabled={submitting || !selectedType}
        >
          {submitting ? 'Creating...' : 'Create session'}
        </button>
      </div>
    </form>
  );
}
