import { useCallback, useEffect, useMemo, useState } from 'react';
import { screenApi } from '../lib/api.js';
import { LoadingSpinner } from '@smartad/shared-ui';

const COLUMNS = [
  ['startupAd', 'Starting screen'],
  ['topAd', 'Top edge'],
  ['bottomAd', 'Bottom edge'],
  ['leftAd', 'Left edge'],
  ['rightAd', 'Right edge'],
];

export default function AdAssignmentsPanel() {
  const [screens, setScreens] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('ALL');

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

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Screen</th>
              <th className="px-4 py-3">Group</th>
              {COLUMNS.map(([key, label]) => (
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
                {COLUMNS.map(([key]) => (
                  <td key={key} className="px-4 py-3">
                    {screen[key] ? (
                      <span className="truncate text-slate-700" title={screen[key].title}>{screen[key].title}</span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                ))}
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
    </div>
  );
}
