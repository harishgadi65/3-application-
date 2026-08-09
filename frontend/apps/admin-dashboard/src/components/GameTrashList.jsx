import { useState } from 'react';
import { gameApi } from '../lib/api.js';
import { useToast } from '@smartad/shared-ui';
import ConfirmDialog from './ConfirmDialog.jsx';

export default function GameTrashList({ games = [], onChanged }) {
  if (games.length === 0) {
    return (
      <div className="card">
        <p className="text-sm text-slate-400">Trash is empty.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((game) => (
        <TrashedGameCard key={game.gameType} game={game} onChanged={onChanged} />
      ))}
    </div>
  );
}

function TrashedGameCard({ game, onChanged }) {
  const toast = useToast();
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingPurge, setConfirmingPurge] = useState(false);

  async function handleRestore() {
    setRestoring(true);
    try {
      await gameApi.restoreGame(game.gameType);
      toast('Game restored', { type: 'success' });
      onChanged?.();
    } catch (err) {
      toast(err.message || 'Failed to restore game', { type: 'error' });
    } finally {
      setRestoring(false);
    }
  }

  async function handlePurge() {
    setDeleting(true);
    try {
      await gameApi.permanentlyDeleteGame(game.gameType);
      toast('Game permanently deleted', { type: 'success' });
      setConfirmingPurge(false);
      onChanged?.();
    } catch (err) {
      toast(err.message || 'Failed to permanently delete game', { type: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="card flex flex-col gap-3 opacity-75">
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
        <span className="badge-rose">In trash</span>
      </div>

      <div className="flex gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          className="btn-secondary flex-1"
          onClick={handleRestore}
          disabled={restoring || deleting}
        >
          {restoring ? 'Restoring...' : 'Restore'}
        </button>
        <button
          type="button"
          className="btn-danger flex-1"
          onClick={() => setConfirmingPurge(true)}
          disabled={restoring || deleting}
        >
          Delete forever
        </button>
      </div>

      <ConfirmDialog
        open={confirmingPurge}
        title="Permanently delete this game?"
        message={`"${game.displayName}" will be removed for good. This can't be undone.`}
        confirmLabel="Delete forever"
        danger
        busy={deleting}
        onConfirm={handlePurge}
        onCancel={() => setConfirmingPurge(false)}
      />
    </div>
  );
}
