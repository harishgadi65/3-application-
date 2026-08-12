import { useCallback, useEffect, useMemo, useState } from 'react';
import { couponApi, screenApi, gameApi } from '../lib/api.js';
import { useToast } from '@smartad/shared-ui';
import ConfirmDialog from './ConfirmDialog.jsx';

export default function CouponList({ coupons = [], onChanged }) {
  const toast = useToast();
  const [screens, setScreens] = useState([]);
  const [groups, setGroups] = useState([]);
  const [games, setGames] = useState([]);

  const loadTargets = useCallback(async () => {
    try {
      const [screenList, groupList, gameList] = await Promise.all([
        screenApi.listScreens(),
        screenApi.listGroups(),
        gameApi.listGames(),
      ]);
      setScreens(Array.isArray(screenList) ? screenList : []);
      setGroups(Array.isArray(groupList) ? groupList : []);
      setGames(Array.isArray(gameList) ? gameList : []);
    } catch (err) {
      toast(err.message || 'Failed to load screens/games', { type: 'error' });
    }
  }, [toast]);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  if (coupons.length === 0) {
    return (
      <div className="card">
        <p className="text-sm text-slate-400">No coupons created yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {coupons.map((coupon) => (
        <CouponCard key={coupon.id} coupon={coupon} screens={screens} groups={groups} games={games} onChanged={onChanged} />
      ))}
    </div>
  );
}

function CouponCard({ coupon, screens, groups, games, onChanged }) {
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [gameType, setGameType] = useState('');
  const [targetType, setTargetType] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [targetScreenId, setTargetScreenId] = useState('');

  const ungroupedScreens = useMemo(() => screens.filter((s) => !s.groupId), [screens]);

  const targetScreens = useMemo(() => {
    if (targetType === 'GROUP') {
      return screens.filter((s) => targetGroupId && String(s.groupId) === String(targetGroupId));
    }
    if (targetType === 'UNGROUPED' || targetType === 'SCREEN') {
      return screens.filter((s) => targetScreenId && String(s.id) === String(targetScreenId));
    }
    return [];
  }, [targetType, targetGroupId, targetScreenId, screens]);

  function updateTargetType(value) {
    setTargetType(value);
    setTargetGroupId('');
    setTargetScreenId('');
  }

  function toggleAssigning() {
    setAssigning((prev) => !prev);
    setGameType('');
    setTargetType('');
    setTargetGroupId('');
    setTargetScreenId('');
  }

  async function handleAssign() {
    if (!gameType) {
      toast('Please choose a game', { type: 'error' });
      return;
    }
    if (!targetType) {
      toast('Please choose who this should be assigned to', { type: 'error' });
      return;
    }
    if (targetType === 'GROUP' && !targetGroupId) {
      toast('Please choose a screen group', { type: 'error' });
      return;
    }
    if ((targetType === 'SCREEN' || targetType === 'UNGROUPED') && !targetScreenId) {
      toast('Please choose a screen', { type: 'error' });
      return;
    }
    if (targetScreens.length === 0) {
      toast('No screens match that target', { type: 'error' });
      return;
    }

    setSubmittingAssign(true);
    try {
      const screenIds = targetScreens.map((screen) => screen.id);
      await couponApi.assignCoupon(screenIds, gameType, coupon.id);
      toast(`Assigned to ${targetScreens.length} screen${targetScreens.length === 1 ? '' : 's'}`, { type: 'success' });
      setAssigning(false);
      onChanged?.();
    } catch (err) {
      toast(err.message || 'Failed to assign coupon', { type: 'error' });
    } finally {
      setSubmittingAssign(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await couponApi.deleteCoupon(coupon.id);
      toast('Coupon moved to trash', { type: 'success' });
      setConfirmingDelete(false);
      onChanged?.();
    } catch (err) {
      toast(err.message || 'Failed to delete coupon', { type: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="card flex flex-col gap-3">
      {coupon.imageUrl ? (
        <div className="aspect-video overflow-hidden rounded-md bg-slate-100">
          <img src={coupon.imageUrl} alt={coupon.title} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">
          No image
        </div>
      )}

      <div>
        <p className="truncate font-medium text-slate-900">{coupon.title}</p>
        {coupon.clientName && <p className="truncate text-xs text-slate-500">{coupon.clientName}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="badge-indigo font-mono">{coupon.code}</span>
          <span className="badge-slate">{coupon.discountDescription}</span>
          {coupon.isActive === false && <span className="badge-rose">Inactive</span>}
        </div>
      </div>

      {assigning && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <select className="input" value={gameType} onChange={(e) => setGameType(e.target.value)}>
            <option value="">Select game</option>
            {games.map((game) => (
              <option key={game.gameType} value={game.gameType}>{game.displayName}</option>
            ))}
          </select>
          <select className="input" value={targetType} onChange={(e) => updateTargetType(e.target.value)}>
            <option value="">Select target type</option>
            <option value="GROUP">Screen group</option>
            <option value="UNGROUPED">Ungrouped screens</option>
            <option value="SCREEN">Specific screen</option>
          </select>
          {targetType === 'GROUP' && (
            <select className="input" value={targetGroupId} onChange={(e) => setTargetGroupId(e.target.value)}>
              <option value="">Select group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          )}
          {targetType === 'SCREEN' && (
            <select className="input" value={targetScreenId} onChange={(e) => setTargetScreenId(e.target.value)}>
              <option value="">Select screen</option>
              {screens.map((screen) => (
                <option key={screen.id} value={screen.id}>#{screen.screenNo} — {screen.displayCode}</option>
              ))}
            </select>
          )}
          {targetType === 'UNGROUPED' && (
            <select className="input" value={targetScreenId} onChange={(e) => setTargetScreenId(e.target.value)}>
              <option value="">{ungroupedScreens.length === 0 ? 'No ungrouped screens' : 'Select screen'}</option>
              {ungroupedScreens.map((screen) => (
                <option key={screen.id} value={screen.id}>#{screen.screenNo} — {screen.displayCode}</option>
              ))}
            </select>
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-secondary flex-1" onClick={toggleAssigning} disabled={submittingAssign}>
              Cancel
            </button>
            <button type="button" className="btn-primary flex-1" onClick={handleAssign} disabled={submittingAssign}>
              {submittingAssign ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          className="btn-secondary flex-1"
          onClick={toggleAssigning}
        >
          {assigning ? 'Close' : 'Assign'}
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

      <ConfirmDialog
        open={confirmingDelete}
        title="Move this coupon to trash?"
        message={`"${coupon.title}" will stop being offered on every game/screen and move to the Trash tab, where it can be restored.`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
