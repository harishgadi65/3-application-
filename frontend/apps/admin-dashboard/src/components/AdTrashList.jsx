import { useState } from 'react';
import { adApi } from '../lib/api.js';
import { useToast } from '@smartad/shared-ui';
import ConfirmDialog from './ConfirmDialog.jsx';

export default function AdTrashList({ ads = [], onChanged }) {
  if (ads.length === 0) {
    return (
      <div className="card">
        <p className="text-sm text-slate-400">Trash is empty.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ads.map((ad) => (
        <TrashedAdCard key={ad.id} ad={ad} onChanged={onChanged} />
      ))}
    </div>
  );
}

function TrashedAdCard({ ad, onChanged }) {
  const toast = useToast();
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingPurge, setConfirmingPurge] = useState(false);

  async function handleRestore() {
    setRestoring(true);
    try {
      await adApi.restoreAd(ad.id);
      toast('Advertisement restored', { type: 'success' });
      onChanged?.();
    } catch (err) {
      toast(err.message || 'Failed to restore advertisement', { type: 'error' });
    } finally {
      setRestoring(false);
    }
  }

  async function handlePurge() {
    setDeleting(true);
    try {
      await adApi.permanentlyDeleteAd(ad.id);
      toast('Advertisement permanently deleted', { type: 'success' });
      setConfirmingPurge(false);
      onChanged?.();
    } catch (err) {
      toast(err.message || 'Failed to permanently delete advertisement', { type: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="card flex flex-col gap-3 opacity-75">
      <div className="aspect-video overflow-hidden rounded-md bg-slate-100">
        {ad.mediaType === 'VIDEO' ? (
          <video src={ad.mediaUrl} className="h-full w-full object-cover" muted />
        ) : (
          <img src={ad.mediaUrl} alt={ad.title} className="h-full w-full object-cover" />
        )}
      </div>

      <div>
        <p className="truncate font-medium text-slate-900">{ad.title}</p>
        {ad.clientName && <p className="truncate text-xs text-slate-500">{ad.clientName}</p>}
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
          <span className="badge-slate">{ad.mediaType}</span>
          <span className="badge-rose">In trash</span>
        </div>
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
        title="Permanently delete this advertisement?"
        message={`"${ad.title}" will be removed for good. This can't be undone.`}
        confirmLabel="Delete forever"
        danger
        busy={deleting}
        onConfirm={handlePurge}
        onCancel={() => setConfirmingPurge(false)}
      />
    </div>
  );
}
