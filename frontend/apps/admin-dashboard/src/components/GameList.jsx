import { useRef, useState } from 'react';
import { gameApi, sessionApi } from '../lib/api.js';
import { useToast } from '@smartad/shared-ui';
import ConfirmDialog from './ConfirmDialog.jsx';
import GamePreviewModal from './GamePreviewModal.jsx';

export default function GameList({ games = [], onChanged }) {
  if (games.length === 0) {
    return (
      <div className="card">
        <p className="text-sm text-slate-400">No games in the catalog yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((game) => (
        <GameCard key={game.gameType} game={game} onChanged={onChanged} />
      ))}
    </div>
  );
}

function GameCard({ game, onChanged }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(game.displayName);
  const [description, setDescription] = useState(game.description || '');
  const [defaultMaxPlayers, setDefaultMaxPlayers] = useState(game.defaultMaxPlayers);
  const [defaultDurationSeconds, setDefaultDurationSeconds] = useState(game.defaultDurationSeconds);
  const [isActive, setIsActive] = useState(game.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const packageInputRef = useRef(null);
  const [packageFile, setPackageFile] = useState(null);
  const [uploadingPackage, setUploadingPackage] = useState(false);
  const [previewSession, setPreviewSession] = useState(null);
  const [startingPreview, setStartingPreview] = useState(false);

  async function handlePreview() {
    setStartingPreview(true);
    try {
      const session = await sessionApi.createSession({ gameType: game.gameType });
      setPreviewSession(session);
    } catch (err) {
      toast(err.message || 'Failed to start a test session', { type: 'error' });
    } finally {
      setStartingPreview(false);
    }
  }

  async function handleRepeatPreview() {
    const oldCode = previewSession?.sessionCode;
    if (oldCode) {
      await sessionApi.endSession(oldCode).catch(() => {});
    }
    const session = await sessionApi.createSession({ gameType: game.gameType });
    setPreviewSession(session);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await gameApi.deleteGame(game.gameType);
      toast('Game moved to trash', { type: 'success' });
      setConfirmingDelete(false);
      onChanged?.();
    } catch (err) {
      toast(err.message || 'Failed to delete game', { type: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  async function handleUploadPackage() {
    if (!packageFile) return;
    setUploadingPackage(true);
    try {
      await gameApi.uploadGamePackage(game.gameType, packageFile);
      toast('Package uploaded', { type: 'success' });
      setPackageFile(null);
      if (packageInputRef.current) packageInputRef.current.value = '';
      onChanged?.();
    } catch (err) {
      toast(err.message || 'Failed to upload package', { type: 'error' });
    } finally {
      setUploadingPackage(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('displayName', displayName);
      formData.append('description', description);
      formData.append('defaultMaxPlayers', String(defaultMaxPlayers));
      formData.append('defaultDurationSeconds', String(defaultDurationSeconds));
      formData.append('isActive', String(isActive));

      await gameApi.updateGame(game.gameType, formData);
      toast('Game updated', { type: 'success' });
      setEditing(false);
      onChanged?.();
    } catch (err) {
      toast(err.message || 'Failed to update game', { type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100">
          {game.iconUrl ? (
            <img src={game.iconUrl} alt={game.displayName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-semibold text-slate-400">
              {game.displayName?.charAt(0) || '?'}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{game.displayName}</p>
          <p className="truncate text-xs text-slate-400">{game.gameType}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {game.playable ? (
          <span className="badge-indigo">Playable</span>
        ) : (
          <span className="badge-slate">No game code yet</span>
        )}
        {game.isActive === false && <span className="badge-rose">Inactive</span>}
        <span className="badge-slate">{game.defaultMaxPlayers} players</span>
        <span className="badge-slate">{game.defaultDurationSeconds}s</span>
      </div>

      {game.description && !editing && (
        <p className="text-sm text-slate-500">{game.description}</p>
      )}

      <div className="space-y-1.5 border-t border-slate-100 pt-3">
        <p className="text-xs font-medium text-slate-500">Game package</p>
        <p className="truncate text-xs text-slate-400">
          {game.packageUrl ? (
            <a href={game.packageUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
              📦 {game.packageFilename || 'Download package'}
            </a>
          ) : (
            'No package uploaded yet'
          )}
        </p>
        <div className="flex gap-2">
          <input
            ref={packageInputRef}
            type="file"
            className="input flex-1 text-xs"
            onChange={(e) => setPackageFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={handleUploadPackage}
            disabled={!packageFile || uploadingPackage}
          >
            {uploadingPackage ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        <p className="text-[11px] text-slate-400">
          For a game built outside this app - attaches the file for reference,
          it doesn&apos;t make the game playable on its own.
        </p>
      </div>

      {editing ? (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <input
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name"
          />
          <textarea
            className="input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={1}
              className="input"
              value={defaultMaxPlayers}
              onChange={(e) => setDefaultMaxPlayers(e.target.value)}
            />
            <input
              type="number"
              min={1}
              className="input"
              value={defaultDurationSeconds}
              onChange={(e) => setDefaultDurationSeconds(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
          {game.playable && (
            <button
              type="button"
              className="btn-primary w-full"
              onClick={handlePreview}
              disabled={startingPreview}
            >
              {startingPreview ? 'Starting…' : 'Preview'}
            </button>
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button
              type="button"
              className="btn-danger flex-1"
              onClick={() => setConfirmingDelete(true)}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      <GamePreviewModal
        game={game}
        session={previewSession}
        onClose={() => setPreviewSession(null)}
        onRepeat={handleRepeatPreview}
      />

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this game?"
        message={`"${game.displayName}" will be moved to the trash. You can restore it from there later.`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
