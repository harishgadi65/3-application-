import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'smartad_screens';
const PAGE_SIZE = 20;

function createDisplayCode(existing = []) {
  let code;
  do {
    code = `DSP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  } while (existing.includes(code));
  return code;
}

function demoScreens() {
  return Array.from({ length: 20 }, (_, index) => ({
    id: `screen-${index + 1}`,
    displayCode: `DSP-${String(index + 1).padStart(4, '0')}`,
    screenNo: index + 1,
    address: `http://localhost:5173?screen=${index + 1}`,
    width: index % 3 === 0 ? 1366 : 1920,
    height: index % 3 === 0 ? 768 : 1080,
    adsPlaying: (index % 5) + 1,
    status: index % 7 === 0 ? 'PAUSED' : 'ACTIVE',
    games: index % 2 === 0 ? ['SNAKE'] : ['TAP_BLAST'],
    adAssignments: { STARTUP: [''], TOP: [''], BOTTOM: [''], LEFT: [''], RIGHT: [''] },
    schedules: [],
  }));
}

function loadScreens() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) {
      const existingCodes = saved.map((screen) => screen.displayCode).filter(Boolean);
      return saved.map((screen) => ({
        ...screen,
        displayCode: screen.displayCode || createDisplayCode(existingCodes),
      }));
    }
  } catch {
    // Start with demo screens if local storage is unavailable or malformed.
  }
  return demoScreens();
}

const emptyForm = {
  screenNo: '',
  displayCode: '',
  address: 'http://localhost:5173',
  width: 1920,
  height: 1080,
  adsPlaying: 1,
  status: 'ACTIVE',
  games: [],
  adAssignments: { STARTUP: [''], TOP: [''], BOTTOM: [''], LEFT: [''], RIGHT: [''] },
  schedules: [],
};

export default function ScreensPanel({ ads = [], games = [] }) {
  const [screens, setScreens] = useState(loadScreens);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [controlTab, setControlTab] = useState('details');
  const [customGame, setCustomGame] = useState('');
  const [scheduleDraft, setScheduleDraft] = useState({ day: 'MONDAY', startTime: '09:00', endTime: '18:00', position: 'STARTUP', adId: '' });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(screens));
  }, [screens]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return screens.filter((screen) => {
      const matchesSearch =
        !term ||
        String(screen.screenNo).includes(term) ||
        screen.address.toLowerCase().includes(term) ||
        `${screen.width}x${screen.height}`.includes(term);
      return matchesSearch && (statusFilter === 'ALL' || screen.status === statusFilter);
    });
  }, [screens, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function openCreate() {
    const nextNo = screens.reduce((max, screen) => Math.max(max, Number(screen.screenNo) || 0), 0) + 1;
    setForm({
      ...emptyForm,
      screenNo: nextNo,
      displayCode: createDisplayCode(screens.map((screen) => screen.displayCode)),
    });
    setControlTab('details');
    setEditing('new');
  }

  function openControl(screen) {
    const savedAssignments = screen.adAssignments || {};
    const normalizedAssignments = Object.fromEntries(
      ['STARTUP', 'TOP', 'BOTTOM', 'LEFT', 'RIGHT'].map((position) => {
        const value = savedAssignments[position];
        if (Array.isArray(value)) return [position, value.length > 0 ? value.map(String) : ['']];
        return [position, value ? [String(value)] : ['']];
      }),
    );
    setForm({
      ...screen,
      games: Array.isArray(screen.games) ? screen.games : [],
      adAssignments: normalizedAssignments,
      schedules: Array.isArray(screen.schedules) ? screen.schedules : [],
    });
    setControlTab('details');
    setEditing(screen.id);
  }

  function saveScreen(event) {
    event.preventDefault();
    const next = {
      ...form,
      id: editing === 'new' ? `screen-${Date.now()}` : editing,
      screenNo: Number(form.screenNo),
      width: Number(form.width),
      height: Number(form.height),
      adsPlaying: Number(form.adsPlaying),
    };
    setScreens((current) =>
      editing === 'new'
        ? [...current, next]
        : current.map((screen) => (screen.id === editing ? next : screen)),
    );
    setEditing(null);
  }

  function removeScreen() {
    if (editing === 'new') return;
    setScreens((current) => current.filter((screen) => screen.id !== editing));
    setEditing(null);
  }

  function toggleGame(gameType) {
    setForm((current) => ({
      ...current,
      games: current.games.includes(gameType)
        ? current.games.filter((type) => type !== gameType)
        : [...current.games, gameType],
    }));
  }

  function addCustomGame() {
    const name = customGame.trim().toUpperCase().replace(/\s+/g, '_');
    if (!name || form.games.includes(name)) return;
    setForm((current) => ({ ...current, games: [...current.games, name] }));
    setCustomGame('');
  }

  function addSchedule() {
    if (!scheduleDraft.adId) return;
    setForm((current) => ({
      ...current,
      schedules: [
        ...current.schedules,
        { ...scheduleDraft, id: `schedule-${Date.now()}` },
      ],
    }));
  }

  function updateAdSlot(position, index, adId) {
    setForm((current) => ({
      ...current,
      adAssignments: {
        ...current.adAssignments,
        [position]: current.adAssignments[position].map((value, slotIndex) =>
          slotIndex === index ? adId : value,
        ),
      },
    }));
  }

  function addAdSlot(position) {
    setForm((current) => ({
      ...current,
      adAssignments: {
        ...current.adAssignments,
        [position]: [...current.adAssignments[position], ''],
      },
    }));
  }

  function removeAdSlot(position, index) {
    setForm((current) => {
      const remaining = current.adAssignments[position].filter((_, slotIndex) => slotIndex !== index);
      return {
        ...current,
        adAssignments: {
          ...current.adAssignments,
          [position]: remaining.length > 0 ? remaining : [''],
        },
      };
    });
  }

  const gameOptions = useMemo(() => {
    const registered = games.map((game) => ({
      type: game.gameType,
      label: game.displayName || game.gameType,
      registered: true,
    }));
    const custom = form.games
      .filter((type) => !registered.some((game) => game.type === type))
      .map((type) => ({ type, label: type.replace(/_/g, ' '), registered: false }));
    return [...registered, ...custom];
  }, [games, form.games]);

  const adName = (id) => ads.find((ad) => String(ad.id) === String(id))?.title || 'Unknown ad';

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[240px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
          <input
            type="search"
            className="input pl-9"
            placeholder="Search screen number, address, or size"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          />
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
        <button type="button" className="btn-secondary" onClick={() => { setSearch(''); setStatusFilter('ALL'); setPage(1); }}>
          Reset filters
        </button>
        <button type="button" className="btn-primary" onClick={openCreate}>+ Add screen</button>
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

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase text-slate-400">Address</dt>
                <dd className="mt-1 truncate font-mono text-xs text-slate-700" title={screen.address}>{screen.address}</dd>
              </div>
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
                  <dd className="mt-1 text-xl font-black text-indigo-600">{screen.adsPlaying}</dd>
                </div>
              </div>
            </dl>

            <div className="mt-auto grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
              <button type="button" className="btn-secondary" onClick={() => openControl(screen)}>Control</button>
              <button type="button" className="btn-primary" onClick={() => window.open(screen.address, '_blank', 'noopener,noreferrer')}>Open</button>
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
                ['games', `Games (${form.games.length})`],
                ['ads', 'Ads Controls'],
                ['schedule', `Schedule (${form.schedules.length})`],
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
              <label className="col-span-2 block">
                <span className="label">Unique display code</span>
                <input className="input bg-slate-50 font-mono font-bold tracking-wider text-slate-600" readOnly value={form.displayCode} />
                <span className="mt-1 block text-xs text-slate-400">Generated once for this screen and cannot be changed.</span>
              </label>
              <label className="col-span-2 block"><span className="label">Screen address</span><input className="input" type="url" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
              <label className="block"><span className="label">Width (px)</span><input className="input" type="number" min="320" required value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} /></label>
              <label className="block"><span className="label">Height (px)</span><input className="input" type="number" min="240" required value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} /></label>
              <label className="col-span-2 block"><span className="label">Number of ads playing</span><input className="input" type="number" min="0" required value={form.adsPlaying} onChange={(e) => setForm({ ...form, adsPlaying: e.target.value })} /></label>
            </div>}

            {controlTab === 'games' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Games assigned to this screen</p>
                  <p className="mt-1 text-sm text-slate-500">{form.games.length} game{form.games.length === 1 ? '' : 's'} available</p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {gameOptions.map((game) => (
                    <label key={game.type} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-3">
                      <span><span className="font-medium text-slate-800">{game.label}</span>{!game.registered && <span className="ml-2 text-xs text-amber-600">Custom</span>}</span>
                      <input type="checkbox" checked={form.games.includes(game.type)} onChange={() => toggleGame(game.type)} />
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className="input" value={customGame} onChange={(e) => setCustomGame(e.target.value)} placeholder="New game name" />
                  <button type="button" className="btn-secondary whitespace-nowrap" onClick={addCustomGame}>Add game</button>
                </div>
                <p className="text-xs text-slate-400">Custom names configure the screen catalog. A playable game still requires a registered game engine.</p>
              </div>
            )}

            {controlTab === 'ads' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ['STARTUP', 'Full-screen ad'],
                    ['TOP', 'Top-side ad'],
                    ['BOTTOM', 'Bottom-side ad'],
                    ['LEFT', 'Left-side ad'],
                    ['RIGHT', 'Right-side ad'],
                  ].map(([position, label]) => {
                    const choices = ads.filter((ad) => ad.position === position && ad.isActive !== false);
                    return (
                      <label key={position} className={position === 'STARTUP' ? 'block sm:col-span-2' : 'block'}>
                        <span className="label">{label}</span>
                        <div className="space-y-2">
                          {form.adAssignments[position].map((selectedAd, index) => (
                            <div key={`${position}-${index}`} className="flex items-center gap-2">
                              <select
                                className="input min-w-0 flex-1"
                                value={selectedAd}
                                onChange={(e) => updateAdSlot(position, index, e.target.value)}
                              >
                                <option value="">No advertisement</option>
                                {choices.map((ad) => <option key={ad.id} value={ad.id}>{ad.title}</option>)}
                              </select>
                              <button
                                type="button"
                                onClick={() => addAdSlot(position)}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-xl font-bold text-indigo-700 hover:bg-indigo-200"
                                aria-label={`Add another ${label}`}
                                title="Add another advertisement"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => removeAdSlot(position, index)}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-rose-100 text-xl font-bold text-rose-700 hover:bg-rose-200"
                                aria-label={`Remove ${label}`}
                                title="Remove this advertisement"
                              >
                                −
                              </button>
                            </div>
                          ))}
                        </div>
                      </label>
                    );
                  })}
                </div>
                <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-700">
                  Assign, replace, or remove the full-screen and four-side advertisements for this screen.
                </div>

              </div>
            )}

            {controlTab === 'schedule' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4">
                  <label><span className="label">Day</span><select className="input" value={scheduleDraft.day} onChange={(e) => setScheduleDraft({ ...scheduleDraft, day: e.target.value })}>{['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'].map((day) => <option key={day}>{day}</option>)}</select></label>
                  <label><span className="label">Position</span><select className="input" value={scheduleDraft.position} onChange={(e) => setScheduleDraft({ ...scheduleDraft, position: e.target.value })}>{['STARTUP','TOP','BOTTOM','LEFT','RIGHT'].map((position) => <option key={position}>{position}</option>)}</select></label>
                  <label><span className="label">Start time</span><input type="time" className="input" value={scheduleDraft.startTime} onChange={(e) => setScheduleDraft({ ...scheduleDraft, startTime: e.target.value })} /></label>
                  <label><span className="label">End time</span><input type="time" className="input" value={scheduleDraft.endTime} onChange={(e) => setScheduleDraft({ ...scheduleDraft, endTime: e.target.value })} /></label>
                  <label className="col-span-2"><span className="label">Advertisement</span><select className="input" value={scheduleDraft.adId} onChange={(e) => setScheduleDraft({ ...scheduleDraft, adId: e.target.value })}><option value="">Select advertisement</option>{ads.filter((ad) => ad.isActive !== false).map((ad) => <option key={ad.id} value={ad.id}>{ad.title} · {ad.position}</option>)}</select></label>
                  <button type="button" className="btn-primary col-span-2" onClick={addSchedule} disabled={!scheduleDraft.adId}>Add schedule</button>
                </div>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {form.schedules.length === 0 ? <p className="py-5 text-center text-sm text-slate-400">No ad schedules configured.</p> : form.schedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
                      <div><p className="font-semibold text-slate-800">{schedule.day} · {schedule.startTime}–{schedule.endTime}</p><p className="text-slate-500">{schedule.position} · {adName(schedule.adId)}</p></div>
                      <button type="button" className="text-rose-600 hover:text-rose-500" onClick={() => setForm((current) => ({ ...current, schedules: current.schedules.filter((item) => item.id !== schedule.id) }))}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6 flex items-center justify-between gap-3">
              <div>{editing !== 'new' && <button type="button" className="btn-danger" onClick={removeScreen}>Remove screen</button>}</div>
              <div className="flex gap-2"><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button><button type="submit" className="btn-primary">Save screen</button></div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
