import { useCallback, useEffect, useMemo, useState } from 'react';
import { couponApi, screenApi, gameApi } from '../lib/api.js';
import { useToast, LoadingSpinner } from '@smartad/shared-ui';
import ConfirmDialog from './ConfirmDialog.jsx';

export default function CouponAssignmentsPanel({ onCouponsChanged }) {
  const toast = useToast();
  const [screens, setScreens] = useState([]);
  const [groups, setGroups] = useState([]);
  const [games, setGames] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [removingKey, setRemovingKey] = useState(null);
  const [confirmingRemoval, setConfirmingRemoval] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [screenList, groupList, gameList, assignmentList] = await Promise.all([
        screenApi.listScreens(),
        screenApi.listGroups(),
        gameApi.listGames(),
        couponApi.listAssignments(),
      ]);
      setScreens(Array.isArray(screenList) ? screenList : []);
      setGroups(Array.isArray(groupList) ? groupList : []);
      setGames(Array.isArray(gameList) ? gameList : []);
      setAssignments(Array.isArray(assignmentList) ? assignmentList : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load coupon assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const screenById = (id) => screens.find((s) => String(s.id) === String(id));
  const groupName = (id) => groups.find((g) => String(g.id) === String(id))?.name;
  const gameLabel = (type) => games.find((g) => g.gameType === type)?.displayName || type;

  // One row per (screen, game) pair that currently has at least one coupon.
  const rows = useMemo(() => {
    const byKey = new Map();
    assignments.forEach((a) => {
      const key = `${a.screenId}:${a.gameType}`;
      if (!byKey.has(key)) {
        byKey.set(key, { screenId: a.screenId, gameType: a.gameType, coupons: [] });
      }
      byKey.get(key).coupons.push(a.coupon);
    });
    return Array.from(byKey.values()).sort((a, b) => {
      const screenA = screenById(a.screenId)?.screenNo ?? 0;
      const screenB = screenById(b.screenId)?.screenNo ?? 0;
      return screenA - screenB || a.gameType.localeCompare(b.gameType);
    });
  }, [assignments, screens]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const screen = screenById(row.screenId);
      if (!screen) return false;
      const matchesSearch =
        !term ||
        String(screen.screenNo).includes(term) ||
        screen.displayCode.toLowerCase().includes(term);
      const matchesGroup =
        groupFilter === 'ALL' ||
        (groupFilter === 'UNGROUPED' ? !screen.groupId : String(screen.groupId) === String(groupFilter));
      return matchesSearch && matchesGroup;
    });
  }, [rows, screens, search, groupFilter]);

  async function removeCoupon(screenId, gameType, couponId) {
    const key = `${screenId}:${gameType}:${couponId}`;
    setRemovingKey(key);
    try {
      await couponApi.deleteCoupon(couponId);
      toast('Coupon moved to trash', { type: 'success' });
      setConfirmingRemoval(null);
      load();
      onCouponsChanged?.();
    } catch (err) {
      toast(err.message || 'Failed to remove coupon', { type: 'error' });
    } finally {
      setRemovingKey(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <input
          type="search"
          className="input max-w-xs flex-1"
          placeholder="Search screen number or code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input w-auto min-w-40" value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
          <option value="ALL">All groups</option>
          <option value="UNGROUPED">Ungrouped</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
        <p className="ml-auto text-sm text-slate-500">
          <span className="font-semibold text-slate-800">{filtered.length}</span> assignment{filtered.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Screen</th>
              <th className="px-4 py-3">Group</th>
              <th className="px-4 py-3">Game</th>
              <th className="px-4 py-3">Coupons</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((row) => {
              const screen = screenById(row.screenId);
              return (
                <tr key={`${row.screenId}:${row.gameType}`}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">#{screen.screenNo}</p>
                    <p className="font-mono text-xs text-slate-400">{screen.displayCode}</p>
                  </td>
                  <td className="px-4 py-3">
                    {screen.groupId ? (
                      <span className="badge-indigo">{groupName(screen.groupId) || screen.groupId}</span>
                    ) : (
                      <span className="text-xs text-slate-400">Ungrouped</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-slate">{gameLabel(row.gameType)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-[16rem] flex-wrap gap-1">
                      {row.coupons.map((coupon) => {
                        const removeKey = `${row.screenId}:${row.gameType}:${coupon.id}`;
                        const removing = removingKey === removeKey;
                        return (
                          <span
                            key={coupon.id}
                            className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                          >
                            <span className="max-w-[9rem] truncate" title={`${coupon.title} (${coupon.code})`}>
                              {coupon.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => setConfirmingRemoval({ screenId: row.screenId, gameType: row.gameType, couponId: coupon.id, title: coupon.title })}
                              disabled={removing}
                              className="text-rose-500 hover:text-rose-700 disabled:opacity-40"
                              aria-label={`Delete ${coupon.title}`}
                              title="Delete this coupon"
                            >
                              {removing ? '…' : '×'}
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                  No coupon assignments match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(confirmingRemoval)}
        title="Delete this coupon?"
        message={confirmingRemoval ? `"${confirmingRemoval.title}" will stop being offered everywhere and move to the Trash tab, where it can be restored.` : ''}
        confirmLabel="Delete"
        danger
        busy={Boolean(confirmingRemoval) && removingKey === `${confirmingRemoval.screenId}:${confirmingRemoval.gameType}:${confirmingRemoval.couponId}`}
        onConfirm={() => removeCoupon(confirmingRemoval.screenId, confirmingRemoval.gameType, confirmingRemoval.couponId)}
        onCancel={() => setConfirmingRemoval(null)}
      />
    </div>
  );
}
