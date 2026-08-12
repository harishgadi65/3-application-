import { useCallback, useEffect, useMemo, useState } from 'react';
import { adApi, screenApi } from '../lib/api.js';
import { useToast, LoadingSpinner } from '@smartad/shared-ui';
import ConfirmDialog from './ConfirmDialog.jsx';

const COLUMNS = [
  ['startupAds', 'STARTUP', 'Starting screen'],
  ['topAds', 'TOP', 'Top edge'],
  ['bottomAds', 'BOTTOM', 'Bottom edge'],
  ['leftAds', 'LEFT', 'Left edge'],
  ['rightAds', 'RIGHT', 'Right edge'],
];
const AD_LIST_KEYS = COLUMNS.map(([key]) => key);

export default function AdAssignmentsPanel({ onAdsChanged }) {
  const toast = useToast();
  const [screens, setScreens] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [removingClient, setRemovingClient] = useState(null);
  const [confirmingClient, setConfirmingClient] = useState(null);
  const [removingAdKey, setRemovingAdKey] = useState(null);
  const [confirmingAd, setConfirmingAd] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [screenList, groupList] = await Promise.all([
        screenApi.listScreens(),
        screenApi.listGroups(),
      ]);
      setScreens(Array.isArray(screenList) ? screenList : []);
      setGroups(Array.isArray(groupList) ? groupList : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load screens');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groupName = (id) => groups.find((g) => String(g.id) === String(id))?.name;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return screens.filter((screen) => {
      const matchesSearch =
        !term ||
        String(screen.screenNo).includes(term) ||
        screen.displayCode.toLowerCase().includes(term);
      const matchesGroup =
        groupFilter === 'ALL' ||
        (groupFilter === 'UNGROUPED' ? !screen.groupId : String(screen.groupId) === String(groupFilter));
      return matchesSearch && matchesGroup;
    });
  }, [screens, search, groupFilter]);

  // Every client currently showing up somewhere in the filtered screens'
  // playlists, so a group can be cleared of one sponsor's ads in one go.
  const clientsInView = useMemo(() => {
    const counts = new Map();
    filtered.forEach((screen) => {
      AD_LIST_KEYS.forEach((key) => {
        (screen[key] || []).forEach((ad) => {
          if (!ad.clientName) return;
          counts.set(ad.clientName, (counts.get(ad.clientName) || 0) + 1);
        });
      });
    });
    return Array.from(counts.entries())
      .map(([clientName, count]) => ({ clientName, count }))
      .sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [filtered]);

  async function trashAd(adId) {
    const key = confirmingAd ? `${confirmingAd.screenId}:${confirmingAd.position}:${adId}` : String(adId);
    setRemovingAdKey(key);
    try {
      await adApi.deleteAd(adId);
      toast('Advertisement moved to trash', { type: 'success' });
      setConfirmingAd(null);
      load();
      onAdsChanged?.();
    } catch (err) {
      toast(err.message || 'Failed to remove advertisement', { type: 'error' });
    } finally {
      setRemovingAdKey(null);
    }
  }

  async function removeClient(clientName) {
    setRemovingClient(clientName);
    try {
      await adApi.deleteAdsByClient(clientName);
      toast(`${clientName}'s ads moved to trash`, { type: 'success' });
      setConfirmingClient(null);
      load();
      onAdsChanged?.();
    } catch (err) {
      toast(err.message || 'Failed to remove advertisements', { type: 'error' });
    } finally {
      setRemovingClient(null);
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
          <span className="font-semibold text-slate-800">{filtered.length}</span> screen{filtered.length === 1 ? '' : 's'}
        </p>
      </div>

      {clientsInView.length > 0 && (
        <div className="card flex flex-wrap items-center gap-2 p-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Clients in this view</span>
          {clientsInView.map(({ clientName, count }) => (
            <span key={clientName} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm">
              <span className="font-medium text-slate-700">{clientName}</span>
              <span className="text-xs text-slate-400">{count} ad{count === 1 ? '' : 's'}</span>
              <button
                type="button"
                onClick={() => setConfirmingClient(clientName)}
                disabled={removingClient === clientName}
                className="text-xs font-semibold text-rose-600 hover:text-rose-500 disabled:opacity-50"
              >
                Remove all
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Screen</th>
              <th className="px-4 py-3">Group</th>
              {COLUMNS.map(([key, , label]) => (
                <th key={key} className="px-4 py-3">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((screen) => (
              <tr key={screen.id}>
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
                {COLUMNS.map(([key, position]) => {
                  const list = screen[key] || [];
                  return (
                    <td key={key} className="px-4 py-3">
                      {list.length === 0 ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <div className="flex max-w-[12rem] flex-wrap gap-1">
                          {list.map((ad) => {
                            const removeKey = `${screen.id}:${position}:${ad.id}`;
                            const removing = removingAdKey === removeKey;
                            return (
                              <span
                                key={ad.id}
                                className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                              >
                                <span className="max-w-[8rem] truncate" title={ad.title}>{ad.title}</span>
                                <button
                                  type="button"
                                  onClick={() => setConfirmingAd({ screenId: screen.id, position, adId: ad.id, title: ad.title })}
                                  disabled={removing}
                                  className="text-rose-500 hover:text-rose-700 disabled:opacity-40"
                                  aria-label={`Delete ${ad.title}`}
                                  title="Delete this advertisement"
                                >
                                  {removing ? '…' : '×'}
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={2 + COLUMNS.length} className="px-4 py-8 text-center text-sm text-slate-400">
                  No screens match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(confirmingClient)}
        title="Remove this client's ads?"
        message={confirmingClient ? `Every ad from "${confirmingClient}" will stop playing on all screens and move to the Trash tab, where it can be restored.` : ''}
        confirmLabel="Remove all"
        danger
        busy={removingClient === confirmingClient}
        onConfirm={() => removeClient(confirmingClient)}
        onCancel={() => setConfirmingClient(null)}
      />

      <ConfirmDialog
        open={Boolean(confirmingAd)}
        title="Delete this advertisement?"
        message={confirmingAd ? `"${confirmingAd.title}" will stop playing everywhere and move to the Trash tab, where it can be restored.` : ''}
        confirmLabel="Delete"
        danger
        busy={Boolean(confirmingAd) && removingAdKey === `${confirmingAd.screenId}:${confirmingAd.position}:${confirmingAd.adId}`}
        onConfirm={() => trashAd(confirmingAd.adId)}
        onCancel={() => setConfirmingAd(null)}
      />
    </div>
  );
}
