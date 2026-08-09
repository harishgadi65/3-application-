import { useState } from 'react';
import { adApi } from '../lib/api.js';
import { useToast } from '@smartad/shared-ui';
import ConfirmDialog from './ConfirmDialog.jsx';

const POSITIONS = ['STARTUP', 'TOP', 'BOTTOM', 'LEFT', 'RIGHT'];
const POSITION_LABELS = {
  STARTUP: 'Starting screen',
  TOP: 'Top edge',
  BOTTOM: 'Bottom edge',
  LEFT: 'Left edge',
  RIGHT: 'Right edge',
};

export default function AdList({ ads = [], onChanged }) {
  if (ads.length === 0) {
    return (
      <div className="card">
        <p className="text-sm text-slate-400">
          No advertisements uploaded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} onChanged={onChanged} />
      ))}
    </div>
  );
}

function AdCard({ ad, onChanged }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [position, setPosition] = useState(ad.position);
  const [displayOrder, setDisplayOrder] = useState(ad.displayOrder ?? 0);
  const [isActive, setIsActive] = useState(ad.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await adApi.deleteAd(ad.id);
      toast('Advertisement deleted', { type: 'success' });
      setConfirmingDelete(false);
      onChanged?.();
    } catch (err) {
      toast(err.message || 'Failed to delete advertisement', { type: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await adApi.updateAd(ad.id, {
        position,
        displayOrder: Number(displayOrder),
        isActive,
      });
      toast('Advertisement updated', { type: 'success' });
      setEditing(false);
      onChanged?.();
    } catch (err) {
      toast(err.message || 'Failed to update advertisement', { type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card flex flex-col gap-3">
      <div className="aspect-video overflow-hidden rounded-md bg-slate-100">
        {ad.mediaType === 'VIDEO' ? (
          <video src={ad.mediaUrl || ad.url} className="h-full w-full object-cover" muted controls />
        ) : (
          <img
            src={ad.mediaUrl || ad.url}
            alt={ad.title}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div>
        <p className="truncate font-medium text-slate-900">{ad.title}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
          <span className="badge-slate">{ad.mediaType}</span>
          <span className="badge-indigo">{POSITION_LABELS[ad.position] || ad.position}</span>
          {ad.isActive === false && <span className="badge-rose">Inactive</span>}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <select
              className="input"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            >
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {POSITION_LABELS[p]}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              className="input"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
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
        <div className="flex gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={() => setEditing(true)}
          >
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
      )}

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this advertisement?"
        message={`"${ad.title}" will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
