import { useCallback, useEffect, useMemo, useState } from 'react';
import { adApi, screenApi } from '../lib/api.js';
import { useToast } from '@smartad/shared-ui';
import ConfirmDialog from './ConfirmDialog.jsx';

const POSITION_LABELS = {
  STARTUP: 'Starting screen',
  TOP: 'Top edge',
  BOTTOM: 'Bottom edge',
  LEFT: 'Left edge',
  RIGHT: 'Right edge',
};

export default function AdTrashList({ ads = [], onChanged }) {
  const toast = useToast();
  const [screens, setScreens] = useState([]);
  const [groups, setGroups] = useState([]);

  const loadTargets = useCallback(async () => {
    try {
      const [screenList, groupList] = await Promise.all([
        screenApi.listScreens(),
        screenApi.listGroups(),
      ]);
      setScreens(Array.isArray(screenList) ? screenList : []);
      setGroups(Array.isArray(groupList) ? groupList : []);
    } catch (err) {
      toast(err.message || 'Failed to load screens', { type: 'error' });
    }
  }, [toast]);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

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
        <TrashedAdCard key={ad.id} ad={ad} screens={screens} groups={groups} onChanged={onChanged} />
      ))}
    </div>
  );
}

/** Collapses this ad's old (screen, position) assignments into readable,
 * deduped labels - e.g. every screen in "Area 1" with a Top-edge assignment
 * collapses into one "Area 1 · Top edge" chip instead of one per screen. */
function useAssignmentLabels(assignments, screens, groups) {
  return useMemo(() => {
    const labels = new Set();
    (assignments || []).forEach(({ screenId, position }) => {
      const screen = screens.find((s) => String(s.id) === String(screenId));
      const positionLabel = POSITION_LABELS[position] || position;
      const target = screen?.groupId
        ? groups.find((g) => String(g.id) === String(screen.groupId))?.name || 'Group'
        : screen
          ? `#${screen.screenNo} ${screen.displayCode}`
          : `Screen ${screenId}`;
      labels.add(`${target} · ${positionLabel}`);
    });
    return Array.from(labels);
  }, [assignments, screens, groups]);
}

function TrashedAdCard({ ad, screens, groups, onChanged }) {
  const toast = useToast();
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingPurge, setConfirmingPurge] = useState(false);
  const assignmentLabels = useAssignmentLabels(ad.assignments, screens, groups);

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

      {assignmentLabels.length > 0 && (
        <div className="border-t border-slate-100 pt-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Was playing on</p>
          <div className="flex flex-wrap gap-1">
            {assignmentLabels.map((label) => (
              <span key={label} className="badge-indigo">{label}</span>
            ))}
          </div>
        </div>
      )}

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
        message={`"${ad.title}" will be removed for good, including its old screen placement. This can't be undone.`}
        confirmLabel="Delete forever"
        danger
        busy={deleting}
        onConfirm={handlePurge}
        onCancel={() => setConfirmingPurge(false)}
      />
    </div>
  );
}
