import { useRef, useState } from 'react';
import { gameApi } from '../lib/api.js';
import { useToast } from '@smartad/shared-ui';

const initialForm = {
  gameType: '',
  displayName: '',
  description: '',
  defaultMaxPlayers: 8,
  defaultDurationSeconds: 120,
};

export default function GameUploader({ onCreated }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const packageInputRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [icon, setIcon] = useState(null);
  const [gamePackage, setGamePackage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('gameType', form.gameType.trim().toUpperCase());
      formData.append('displayName', form.displayName);
      formData.append('description', form.description);
      formData.append('defaultMaxPlayers', String(form.defaultMaxPlayers));
      formData.append('defaultDurationSeconds', String(form.defaultDurationSeconds));
      if (icon) formData.append('icon', icon);
      if (gamePackage) formData.append('package', gamePackage);

      await gameApi.createGame(formData);
      toast('Game added to catalog', { type: 'success' });

      setForm(initialForm);
      setIcon(null);
      setGamePackage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (packageInputRef.current) packageInputRef.current.value = '';
      onCreated?.();
    } catch (err) {
      setError(err.message || 'Failed to create game');
      toast(err.message || 'Failed to create game', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Add game to catalog</h3>
        <p className="mt-1 text-xs text-slate-500">
          This adds catalog metadata only. It won&apos;t be playable in a session
          unless matching game code already exists for its game type.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="game-type">
          Game type (unique code)
        </label>
        <input
          id="game-type"
          type="text"
          className="input"
          value={form.gameType}
          onChange={(e) => updateField('gameType', e.target.value)}
          placeholder="e.g. TRIVIA_RUSH"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="game-name">
          Display name
        </label>
        <input
          id="game-name"
          type="text"
          className="input"
          value={form.displayName}
          onChange={(e) => updateField('displayName', e.target.value)}
          placeholder="Trivia Rush"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="game-description">
          Description
        </label>
        <textarea
          id="game-description"
          className="input"
          rows={2}
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Short description shown to admins"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="game-max-players">
            Max players
          </label>
          <input
            id="game-max-players"
            type="number"
            min={1}
            className="input"
            value={form.defaultMaxPlayers}
            onChange={(e) => updateField('defaultMaxPlayers', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="game-duration">
            Duration (seconds)
          </label>
          <input
            id="game-duration"
            type="number"
            min={1}
            className="input"
            value={form.defaultDurationSeconds}
            onChange={(e) => updateField('defaultDurationSeconds', e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="game-icon">
          Icon (optional)
        </label>
        <input
          id="game-icon"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="input"
          onChange={(e) => setIcon(e.target.files?.[0] || null)}
        />
      </div>

      <div>
        <label className="label" htmlFor="game-package">
          Game package (optional)
        </label>
        <input
          id="game-package"
          ref={packageInputRef}
          type="file"
          className="input"
          onChange={(e) => setGamePackage(e.target.files?.[0] || null)}
        />
        <p className="mt-1 text-xs text-slate-400">
          For a game built outside this app - attaches the file for safekeeping,
          it doesn&apos;t make the game playable on its own.
        </p>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? 'Adding...' : 'Add game'}
      </button>
    </form>
  );
}
