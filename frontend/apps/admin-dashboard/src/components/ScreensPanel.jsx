import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adApi, screenApi } from '../lib/api.js';
import { useToast, LoadingSpinner } from '@smartad/shared-ui';
import ScreenPreviewModal from './ScreenPreviewModal.jsx';

const PAGE_SIZE = 20;

const emptyForm = {
  screenNo: '',
  status: 'ACTIVE',
  special: false,
  width: 1920,
  height: 1080,
  groupId: '',
  startupAdId: '',
  topAdId: '',
  bottomAdId: '',
  leftAdId: '',
  rightAdId: '',
  gameTypes: [],
};

export default function ScreensPanel({ ads = [], games = [], onAdsChanged }) {
  const toast = useToast();
  const uploadInputRef = useRef(null);
  const uploadTargetRef = useRef(null);
  const [uploadingPosition, setUploadingPosition] = useState(null);
  const [previewingScreen, setPreviewingScreen] = useState(null);

  const [screens, setScreens] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [groupFilter, setGroupFilter] = useState('ALL');
  const [newGroupName, setNewGroupName] = useState('');
  const [renamingGroupId, setRenamingGroupId] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [controlTab, setControlTab] = useState('details');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [screenList, groupList] = await Promise.all([screenApi.listScreens(), screenApi.listGroups()]);
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
    loadAll();
  }, [loadAll]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return screens.filter((screen) => {
      const matchesSearch =
        !term ||
        String(screen.screenNo).includes(term) ||
        screen.displayCode.toLowerCase().includes(term) ||
        `${screen.width}x${screen.height}`.includes(term);
      const matchesGroup =
        groupFilter === 'ALL' ||
        (groupFilter === 'UNGROUPED' ? !screen.groupId : String(screen.groupId) === String(groupFilter));
      return matchesSearch && matchesGroup && (statusFilter === 'ALL' || screen.status === statusFilter);
    });
  }, [screens, search, statusFilter, groupFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function openCreate() {
    const nextNo = screens.reduce((max, screen) => Math.max(max, Number(screen.screenNo) || 0), 0) + 1;
    setForm({ ...emptyForm, screenNo: nextNo });
    setControlTab('details');
    setEditing('new');
  }

  function openControl(screen) {
    setForm({
      screenNo: screen.screenNo,
      status: screen.status,
      special: screen.special || false,
      width: screen.width,
      height: screen.height,
      groupId: screen.groupId ? String(screen.groupId) : '',
      startupAdId: screen.startupAd ? String(screen.startupAd.id) : '',
      topAdId: screen.topAd ? String(screen.topAd.id) : '',
      bottomAdId: screen.bottomAd ? String(screen.bottomAd.id) : '',
      leftAdId: screen.leftAd ? String(screen.leftAd.id) : '',
      rightAdId: screen.rightAd ? String(screen.rightAd.id) : '',
      gameTypes: screen.games.map((g) => g.gameType),
    });
    setControlTab('details');
    setEditing(screen.id);
  }

  async function addGroup() {
    const name = newGroupName.trim();
    if (!name) return;
    try {
      await screenApi.createGroup(name);
      setNewGroupName('');
      loadAll();
    } catch (err) {
      toast(err.message || 'Failed to create group', { type: 'error' });
    }
  }

  function startRenameGroup(group) {
    setRenamingGroupId(group.id);
    setRenameDraft(group.name);
  }

  async function commitRenameGroup() {
    const name = renameDraft.trim();
    const id = renamingGroupId;
    setRenamingGroupId(null);
    if (!name) return;
    try {
      await screenApi.renameGroup(id, name);
      loadAll();
    } catch (err) {
      toast(err.message || 'Failed to rename group', { type: 'error' });
    }
  }

  function buildPayload() {
    return {
      screenNo: Number(form.screenNo),
      status: form.status,
      special: form.special,
      width: Number(form.width),
      height: Number(form.height),
      groupId: form.groupId ? Number(form.groupId) : null,
      clearGroup: !form.groupId,
      startupAdId: form.startupAdId ? Number(form.startupAdId) : null,
      clearStartupAd: !form.startupAdId,
      topAdId: form.topAdId ? Number(form.topAdId) : null,
      clearTopAd: !form.topAdId,
      bottomAdId: form.bottomAdId ? Number(form.bottomAdId) : null,
      clearBottomAd: !form.bottomAdId,
      leftAdId: form.leftAdId ? Number(form.leftAdId) : null,
      clearLeftAd: !form.leftAdId,
      rightAdId: form.rightAdId ? Number(form.rightAdId) : null,
      clearRightAd: !form.rightAdId,
      gameTypes: form.gameTypes,
    };
  }

  async function saveScreen(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing === 'new') {
        await screenApi.createScreen(payload);
        toast('Screen added', { type: 'success' });
      } else {
        await screenApi.updateScreen(editing, payload);
        toast('Screen updated', { type: 'success' });
      }
      setEditing(null);
      loadAll();
    } catch (err) {
      toast(err.message || 'Failed to save screen', { type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function removeScreen() {
    if (editing === 'new') return;
    setRemoving(true);
    try {
      await screenApi.deleteScreen(editing);
      toast('Screen removed', { type: 'success' });
      setEditing(null);
      loadAll();
    } catch (err) {
      toast(err.message || 'Failed to remove screen', { type: 'error' });
    } finally {
      setRemoving(false);
    }
  }

  function toggleGame(gameType) {
    setForm((current) => ({
      ...current,
      gameTypes: current.gameTypes.includes(gameType)
        ? current.gameTypes.filter((type) => type !== gameType)
        : [...current.gameTypes, gameType],
    }));
  }

  const AD_FIELD_BY_POSITION = {
    STARTUP: 'startupAdId',
    TOP: 'topAdId',
    BOTTOM: 'bottomAdId',
    LEFT: 'leftAdId',
    RIGHT: 'rightAdId',
  };

  function setAdAssignment(position, adId) {
    setForm((current) => ({ ...current, [AD_FIELD_BY_POSITION[position]]: adId }));
  }

  function clearAdAssignment(position) {
    setAdAssignment(position, '');
  }

  function triggerUpload(position) {
    uploadTargetRef.current = position;
    setUploadingPosition(position);
    uploadInputRef.current?.click();
  }

  async function handleFileSelected(event) {
    const file = event.target.files?.[0];
    const position = uploadTargetRef.current;
    event.target.value = '';
    if (!file || !position) {
      setUploadingPosition(null);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^.]+$/, '') || 'Untitled ad');
      formData.append('mediaType', file.type.startsWith('video') ? 'VIDEO' : 'IMAGE');
      formData.append('position', position);
      formData.append('displayOrder', '0');

      const created = await adApi.uploadAd(formData);
      setAdAssignment(position, String(created.id));
      onAdsChanged?.();
      toast('Advertisement uploaded', { type: 'success' });
    } catch (err) {
      toast(err.message || 'Upload failed', { type: 'error' });
    } finally {
      setUploadingPosition(null);
      uploadTargetRef.current = null;
    }
  }

  const gameOptions = useMemo(() => {
    const registered = games.map((game) => ({
      type: game.gameType,
      label: game.displayName || game.gameType,
      registered: true,
    }));
    const custom = form.gameTypes
      .filter((type) => !registered.some((game) => game.type === type))
      .map((type) => ({ type, label: type.replace(/_/g, ' '), registered: false }));
    return [...registered, ...custom];
  }, [games, form.gameTypes]);

  const groupName = (id) => groups.find((group) => String(group.id) === String(id))?.name;

  const adsPlayingCount = (screen) =>
    [screen.startupAd, screen.topAd, screen.bottomAd, screen.leftAd, screen.rightAd].filter(Boolean).length;

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
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[240px] flex-1">
          <input
            type="search"
            className="input pr-11"
            placeholder="Search screen number, code, or size"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          />
          <button
            type="button"
            aria-label="Search"
            onClick={() => setPage(1)}
            className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ⌕
          </button>
        </div>
        <select
          className="input w-auto min-w-36"
          value={statusFilter}
          onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
        </select>
      </div>

      <div className="card flex flex-wrap items-center gap-2 p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Groups</span>
        <button
          type="button"
          onClick={() => { setGroupFilter('ALL'); setPage(1); }}
          className={groupFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => { setGroupFilter('UNGROUPED'); setPage(1); }}
          className={groupFilter === 'UNGROUPED' ? 'btn-primary' : 'btn-secondary'}
        >
          Ungrouped
        </button>
        {groups.map((group) =>
          renamingGroupId === group.id ? (
            <input
              key={group.id}
              autoFocus
              className="input w-auto"
              value={renameDraft}
              onChange={(event) => setRenameDraft(event.target.value)}
              onBlur={commitRenameGroup}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitRenameGroup();
                if (event.key === 'Escape') setRenamingGroupId(null);
              }}
            />
          ) : (
            <button
              key={group.id}
              type="button"
              onClick={() => { setGroupFilter(group.id); setPage(1); }}
              onDoubleClick={() => startRenameGroup(group)}
              title="Double-click to rename"
              className={String(groupFilter) === String(group.id) ? 'btn-primary' : 'btn-secondary'}
            >
              {group.name}
            </button>
          ),
        )}
        <div className="ml-auto flex items-center gap-2">
          <input
            className="input w-auto"
            placeholder="New group name"
            value={newGroupName}
            onChange={(event) => setNewGroupName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && addGroup()}
          />
          <button type="button" className="btn-secondary whitespace-nowrap" onClick={addGroup}>+ Add group</button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <p><span className="font-semibold text-slate-800">{filtered.length}</span> screens found</p>
        <p>Page {currentPage} of {pageCount}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        <button
          type="button"
          onClick={openCreate}
          className="flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-6 text-indigo-600 transition hover:border-indigo-400 hover:bg-indigo-50"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-3xl">+</span>
          <span className="mt-3 font-semibold">Add new screen</span>
          <span className="mt-1 text-xs text-indigo-400">Register another display</span>
        </button>

        {visible.map((screen) => (
          <article key={screen.id} className="card flex min-h-64 flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Screen number</p>
                <h3 className="mt-1 text-2xl font-black text-slate-900">#{screen.screenNo}</h3>
              </div>
              <span className={screen.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'}>
                {screen.status}
              </span>
            </div>

            {(screen.groupName || screen.special) && (
              <div className="flex flex-wrap items-center gap-2">
                {screen.groupName && <span className="badge-indigo">{screen.groupName}</span>}
                {screen.special && <span className="badge-amber">⭐ Special</span>}
              </div>
            )}

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase text-slate-400">Display code</dt>
                <dd className="mt-1 flex items-center justify-between gap-2">
                  <span className="font-mono text-base font-black tracking-wider text-indigo-700">{screen.displayCode}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                    onClick={() => navigator.clipboard?.writeText(screen.displayCode)}
                  >
                    Copy
                  </button>
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs font-medium uppercase text-slate-400">Screen size</dt>
                  <dd className="mt-1 font-semibold text-slate-800">{screen.width} × {screen.height}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-slate-400">Ads playing</dt>
                  <dd className="mt-1 text-xl font-black text-indigo-600">{adsPlayingCount(screen)}</dd>
                </div>
              </div>
            </dl>

            <div className="mt-auto grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
              <button type="button" className="btn-secondary" onClick={() => openControl(screen)}>Control</button>
              <button type="button" className="btn-primary" onClick={() => setPreviewingScreen(screen)}>Preview</button>
            </div>
          </article>
        ))}
      </div>

      {pageCount > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Screen pages">
          <button type="button" className="btn-secondary" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
            <button
              type="button"
              key={number}
              onClick={() => setPage(number)}
              className={number === currentPage ? 'btn-primary min-w-10' : 'btn-secondary min-w-10'}
            >
              {number}
            </button>
          ))}
          <button type="button" className="btn-secondary" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
        </nav>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form onSubmit={saveScreen} className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editing === 'new' ? 'Add new screen' : `Control screen #${form.screenNo}`}</h2>
              <button type="button" className="text-2xl text-slate-400" onClick={() => setEditing(null)} aria-label="Close">×</button>
            </div>

            <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200">
              {[
                ['details', 'Details'],
                ['games', `Games (${form.gameTypes.length})`],
                ['ads', 'Ads Controls'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setControlTab(value)}
                  className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold ${controlTab === value ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {controlTab === 'details' && <div className="grid grid-cols-2 gap-4">
              <label className="block"><span className="label">Screen number</span><input className="input" type="number" min="1" required value={form.screenNo} onChange={(e) => setForm({ ...form, screenNo: e.target.value })} /></label>
              <label className="block"><span className="label">Status</span><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="ACTIVE">Active</option><option value="PAUSED">Paused</option></select></label>
              {editing !== 'new' && (
                <label className="col-span-2 block">
                  <span className="label">Unique display code</span>
                  <input className="input bg-slate-50 font-mono font-bold tracking-wider text-slate-600" readOnly value={screens.find((s) => s.id === editing)?.displayCode || ''} />
                  <span className="mt-1 block text-xs text-slate-400">
                    Generated automatically and cannot be changed. Enter this on a TV device to connect it to this screen.
                  </span>
                </label>
              )}
              <label className="block"><span className="label">Width (px)</span><input className="input" type="number" min="320" required value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} /></label>
              <label className="block"><span className="label">Height (px)</span><input className="input" type="number" min="240" required value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} /></label>
              <label className="block">
                <span className="label">Group</span>
                <select className="input" value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })}>
                  <option value="">Ungrouped</option>
                  {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select>
              </label>
              <label className="flex items-end gap-2 pb-2">
                <input type="checkbox" checked={form.special} onChange={(e) => setForm({ ...form, special: e.target.checked })} />
                <span className="text-sm text-slate-700">⭐ Special screen</span>
              </label>
            </div>}

            {controlTab === 'games' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Games assigned to this screen</p>
                  <p className="mt-1 text-sm text-slate-500">{form.gameTypes.length} game{form.gameTypes.length === 1 ? '' : 's'} available</p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {gameOptions.map((game) => (
                    <label key={game.type} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-3">
                      <span><span className="font-medium text-slate-800">{game.label}</span>{!game.registered && <span className="ml-2 text-xs text-amber-600">Custom</span>}</span>
                      <input type="checkbox" checked={form.gameTypes.includes(game.type)} onChange={() => toggleGame(game.type)} />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {controlTab === 'ads' && (
              <div className="space-y-4">
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileSelected}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ['STARTUP', 'Full-screen ad'],
                    ['TOP', 'Top-side ad'],
                    ['BOTTOM', 'Bottom-side ad'],
                    ['LEFT', 'Left-side ad'],
                    ['RIGHT', 'Right-side ad'],
                  ].map(([position, label]) => {
                    const choices = ads.filter((ad) => ad.position === position && ad.isActive !== false);
                    const selectedAd = form[AD_FIELD_BY_POSITION[position]];
                    const isUploading = uploadingPosition === position;
                    return (
                      <label key={position} className={position === 'STARTUP' ? 'block sm:col-span-2' : 'block'}>
                        <span className="label">{label}</span>
                        <div className="relative">
                          <select
                            className="input min-w-0 appearance-none pr-16"
                            value={selectedAd}
                            disabled={isUploading}
                            onChange={(e) => setAdAssignment(position, e.target.value)}
                          >
                            <option value="">No advertisement</option>
                            {choices.map((ad) => <option key={ad.id} value={ad.id}>{ad.title}</option>)}
                          </select>
                          <div className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 text-slate-400">⌄</div>
                          <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 gap-1">
                            <button
                              type="button"
                              onClick={() => clearAdAssignment(position)}
                              disabled={!selectedAd || isUploading}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label={`Remove ${label}`}
                              title="Remove this advertisement"
                            >
                              −
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerUpload(position)}
                              disabled={isUploading}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label={`Upload a new ${label}`}
                              title="Upload a new advertisement"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        {isUploading && <p className="mt-1 text-xs text-indigo-500">Uploading…</p>}
                      </label>
                    );
                  })}
                </div>
                <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-700">
                  Pick an already-uploaded ad from the dropdown, use − to clear it, or + to browse and upload a new one straight into this slot.
                </div>
              </div>
            )}
            <div className="mt-6 flex items-center justify-between gap-3">
              <div>{editing !== 'new' && <button type="button" className="btn-danger" onClick={removeScreen} disabled={removing}>{removing ? 'Removing...' : 'Remove screen'}</button>}</div>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save screen'}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <ScreenPreviewModal
        screen={previewingScreen}
        groupName={previewingScreen ? groupName(previewingScreen.groupId) : null}
        onClose={() => setPreviewingScreen(null)}
      />
    </div>
  );
}
