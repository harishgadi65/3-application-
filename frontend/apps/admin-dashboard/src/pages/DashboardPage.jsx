import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionApi, screenApi, adApi, couponApi, gameApi } from '../lib/api.js';
import { LoadingSpinner } from '@smartad/shared-ui';
import StatsCard from '../components/StatsCard.jsx';
import CollapsibleSection from '../components/CollapsibleSection.jsx';
import {
  TicketIcon,
  CheckCircleIcon,
  OpenBoxIcon,
  PercentIcon,
  ControllerIcon,
  UserPlusIcon,
  UsersIcon,
  FlagIcon,
  ChartBarIcon,
  MonitorIcon,
  ChatBubbleIcon,
  AlertTriangleIcon,
  SearchIcon,
} from '../components/DashboardIcons.jsx';

const SESSION_STATUS_BADGE = {
  CREATED: 'badge-slate',
  WAITING: 'badge-amber',
  COUNTDOWN: 'badge-amber',
  PLAYING: 'badge-green',
  FINISHED: 'badge-slate',
  CANCELLED: 'badge-rose',
};

const PERIODS = [
  { key: 'TODAY', label: 'Today' },
  { key: 'YESTERDAY', label: 'Yesterday' },
  { key: 'WEEK', label: 'This week' },
  { key: 'MONTH', label: 'This month' },
];

// Illustrative only - no backend event tracking exists yet for coupon
// redemptions or per-game outcomes (only creation/assignment and session
// start/players are real). Kept as fixed, self-consistent numbers per
// period rather than random, so the "Sample data" label stays honest and
// the screen doesn't visibly shift on every render.
const COUPON_SAMPLE = {
  TODAY: { issued: 1248, redeemed: 786, issuedTrend: 12.9, redeemedTrend: 12.6, openTrend: 13.5, rateTrend: -0.3 },
  YESTERDAY: { issued: 1104, redeemed: 698, issuedTrend: 8.1, redeemedTrend: 9.4, openTrend: 6.2, rateTrend: 1.1 },
  WEEK: { issued: 6820, redeemed: 4290, issuedTrend: 15.4, redeemedTrend: 11.8, openTrend: 18.7, rateTrend: -1.9 },
  MONTH: { issued: 24310, redeemed: 15870, issuedTrend: 22.3, redeemedTrend: 19.2, openTrend: 24.6, rateTrend: -2.4 },
};

const GAME_SAMPLE = {
  TODAY: { played: 2052, newPlayers: 1012, repeated: 542, completed: 1730, minutes: 7584, playedTrend: 11.8, newTrend: 14.2, repeatedTrend: 7.6, completedTrend: 10.6, rateTrend: 1.2 },
  YESTERDAY: { played: 1836, newPlayers: 902, repeated: 481, completed: 1540, minutes: 6710, playedTrend: 6.4, newTrend: 9.7, repeatedTrend: 4.3, completedTrend: 8.1, rateTrend: 0.6 },
  WEEK: { played: 11480, newPlayers: 5230, repeated: 3140, completed: 9640, minutes: 41200, playedTrend: 16.9, newTrend: 13.5, repeatedTrend: 9.8, completedTrend: 12.4, rateTrend: -0.8 },
  MONTH: { played: 41870, newPlayers: 18240, repeated: 12960, completed: 34120, minutes: 152600, playedTrend: 21.7, newTrend: 17.8, repeatedTrend: 14.1, completedTrend: 15.9, rateTrend: -1.5 },
};

/** Deterministic pseudo-random int in [min, max] from a seed, so sample
 * per-row numbers stay stable across renders instead of jumping around. */
function seededInt(seed, min, max) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  const frac = x - Math.floor(x);
  return Math.floor(min + frac * (max - min));
}

function seedFromString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function timeAgo(dateString) {
  if (!dateString) return '—';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const AD_SLOT_KEYS = ['startupAds', 'topAds', 'bottomAds', 'leftAds', 'rightAds'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [screens, setScreens] = useState([]);
  const [groups, setGroups] = useState([]);
  const [ads, setAds] = useState([]);
  const [adTrashCount, setAdTrashCount] = useState(0);
  const [coupons, setCoupons] = useState([]);
  const [couponTrashCount, setCouponTrashCount] = useState(0);
  const [games, setGames] = useState([]);
  const [gameTrashCount, setGameTrashCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [period, setPeriod] = useState('TODAY');
  const [search, setSearch] = useState('');
  const loadingRef = useRef(false);

  const loadAll = useCallback(async (showSpinner) => {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      const [activeSessions, screenList, groupList, allAds, adTrash, allCoupons, couponTrash, gameList, gameTrash] = await Promise.all([
        sessionApi.listActiveSessions(),
        screenApi.listScreens(),
        screenApi.listGroups(),
        adApi.listAllAds(),
        adApi.listTrash(),
        couponApi.listAllCoupons(),
        couponApi.listTrash(),
        gameApi.listGames(),
        gameApi.listTrash(),
      ]);
      setSessions(Array.isArray(activeSessions) ? activeSessions : []);
      setScreens(Array.isArray(screenList) ? screenList : []);
      setGroups(Array.isArray(groupList) ? groupList : []);
      setAds(Array.isArray(allAds) ? allAds : []);
      setAdTrashCount(Array.isArray(adTrash) ? adTrash.length : 0);
      setCoupons(Array.isArray(allCoupons) ? allCoupons : []);
      setCouponTrashCount(Array.isArray(couponTrash) ? couponTrash.length : 0);
      setGames(Array.isArray(gameList) ? gameList : []);
      setGameTrashCount(Array.isArray(gameTrash) ? gameTrash.length : 0);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Live sessions are the one thing worth auto-refreshing - everything else
  // changes rarely enough that a manual refresh or full page load is enough.
  const refreshSessions = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const activeSessions = await sessionApi.listActiveSessions();
      setSessions(Array.isArray(activeSessions) ? activeSessions : []);
      setLastUpdated(new Date());
    } catch {
      // silent - the manual refresh / next full load will surface real errors
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadAll(true);
  }, [loadAll]);

  useEffect(() => {
    const interval = setInterval(refreshSessions, 8000);
    return () => clearInterval(interval);
  }, [refreshSessions]);

  const groupName = (id) => groups.find((g) => String(g.id) === String(id))?.name;
  const screenLabel = (screenId) => {
    const screen = screens.find((s) => String(s.id) === String(screenId));
    return screen ? `#${screen.screenNo} ${screen.displayCode}` : screenId ? `Screen ${screenId}` : '—';
  };
  const activeScreenIds = new Set(sessions.map((s) => s.screenId).filter(Boolean));

  const activeScreens = screens.filter((s) => s.status === 'ACTIVE').length;
  const pausedScreens = screens.filter((s) => s.status !== 'ACTIVE').length;

  const adPlacementCount = (screen) => AD_SLOT_KEYS.reduce((sum, key) => sum + (screen[key]?.length || 0), 0);
  const totalAdPlacements = screens.reduce((sum, screen) => sum + adPlacementCount(screen), 0);
  const fullyCoveredScreens = screens.filter((screen) => AD_SLOT_KEYS.every((key) => (screen[key]?.length || 0) > 0)).length;
  const needsAttentionScreens = screens.filter((screen) => screen.status !== 'ACTIVE' || adPlacementCount(screen) === 0).length;

  const filteredScreens = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return screens;
    return screens.filter(
      (screen) => String(screen.screenNo).includes(term) || screen.displayCode.toLowerCase().includes(term)
    );
  }, [screens, search]);

  const couponSample = COUPON_SAMPLE[period];
  const couponOpen = couponSample.issued - couponSample.redeemed;
  const couponRate = ((couponSample.redeemed / couponSample.issued) * 100).toFixed(1);

  const gameSample = GAME_SAMPLE[period];
  const gameCompletionRate = ((gameSample.completed / gameSample.played) * 100).toFixed(1);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Operations overview</p>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-slate-500">Monitor screens, sessions, and advertisement coverage.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="input w-64 pl-9"
              placeholder="Search dashboard"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="button" className="btn-secondary" onClick={() => navigate('/advertisements/screens')}>
            Add screen
          </button>
          <button type="button" className="btn-primary" onClick={() => navigate('/advertisements')}>
            Upload advertisement
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {lastUpdated && <p className="-mt-3 text-xs text-slate-400">Live data updated {timeAgo(lastUpdated.toISOString())}</p>}

      {/* Coupon performance (sample) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">Coupon performance</h2>
              <span className="badge-amber">Sample data</span>
            </div>
            <p className="text-xs text-slate-400">Temporary analytics preview; backend coupon tracking will replace these values later.</p>
          </div>
          <select className="input w-auto" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Coupons issued"
            value={couponSample.issued.toLocaleString()}
            icon={TicketIcon}
            accent="indigo"
            trend={{ direction: 'up', value: `${couponSample.issuedTrend}%` }}
            hint="Given to customers · previous period"
          />
          <StatsCard
            label="Coupons redeemed"
            value={couponSample.redeemed.toLocaleString()}
            icon={CheckCircleIcon}
            accent="emerald"
            trend={{ direction: 'up', value: `${couponSample.redeemedTrend}%` }}
            hint="Successfully used · previous period"
          />
          <StatsCard
            label="Open coupons"
            value={couponOpen.toLocaleString()}
            icon={OpenBoxIcon}
            accent="amber"
            trend={{ direction: 'up', value: `${couponSample.openTrend}%` }}
            hint="Available to redeem · previous period"
          />
          <StatsCard
            label="Redemption rate"
            value={`${couponRate}%`}
            icon={PercentIcon}
            accent="rose"
            trend={{ direction: couponSample.rateTrend >= 0 ? 'up' : 'down', value: `${Math.abs(couponSample.rateTrend)}%` }}
            hint="Redeemed ÷ issued · previous period"
          />
        </div>

        <CollapsibleSection title="Coupon details" subtitle="Hourly activity and client campaign performance">
          {coupons.length === 0 ? (
            <p className="text-sm text-slate-400">No coupons created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="py-2 pr-4">Client</th>
                    <th className="py-2 pr-4">Code</th>
                    <th className="py-2 pr-4">Issued</th>
                    <th className="py-2 pr-4">Redeemed</th>
                    <th className="py-2">Redemption rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map((coupon) => {
                    const seed = seedFromString(`coupon-${coupon.id}`);
                    const issued = seededInt(seed, 20, 300);
                    const redeemed = seededInt(seed + 1, 5, issued);
                    return (
                      <tr key={coupon.id}>
                        <td className="py-2 pr-4 text-slate-700">{coupon.clientName || '—'}</td>
                        <td className="py-2 pr-4 font-mono text-xs text-slate-500">{coupon.code}</td>
                        <td className="py-2 pr-4">{issued}</td>
                        <td className="py-2 pr-4">{redeemed}</td>
                        <td className="py-2">{((redeemed / issued) * 100).toFixed(0)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CollapsibleSection>
      </div>

      {/* Game performance (sample) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">Game performance</h2>
              <span className="badge-amber">Sample data</span>
            </div>
            <p className="text-xs text-slate-400">Temporary gameplay analytics preview for the selected coupon period.</p>
          </div>
          <span className="badge-indigo">{games.length} available games</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            label="Games played"
            value={gameSample.played.toLocaleString()}
            icon={ControllerIcon}
            accent="indigo"
            trend={{ direction: 'up', value: `${gameSample.playedTrend}%` }}
            hint="Sessions started · previous period"
          />
          <StatsCard
            label="New players"
            value={gameSample.newPlayers.toLocaleString()}
            icon={UserPlusIcon}
            accent="emerald"
            trend={{ direction: 'up', value: `${gameSample.newTrend}%` }}
            hint="First-time players · previous period"
          />
          <StatsCard
            label="Repeated players"
            value={gameSample.repeated.toLocaleString()}
            icon={UsersIcon}
            accent="indigo"
            trend={{ direction: 'up', value: `${gameSample.repeatedTrend}%` }}
            hint="Returning players · previous period"
          />
          <StatsCard
            label="Games completed"
            value={gameSample.completed.toLocaleString()}
            icon={FlagIcon}
            accent="amber"
            hint={`Total minutes played: ${gameSample.minutes.toLocaleString()} min`}
            trend={{ direction: 'up', value: `${gameSample.completedTrend}%` }}
          />
          <StatsCard
            label="Completion rate"
            value={`${gameCompletionRate}%`}
            icon={ChartBarIcon}
            accent="rose"
            trend={{ direction: gameSample.rateTrend >= 0 ? 'up' : 'down', value: `${Math.abs(gameSample.rateTrend)}%` }}
            hint="Completed ÷ played · previous period"
          />
        </div>

        <CollapsibleSection title="Game details" subtitle="Hourly activity and individual game performance">
          {games.length === 0 ? (
            <p className="text-sm text-slate-400">No games available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="py-2 pr-4">Game</th>
                    <th className="py-2 pr-4">Played</th>
                    <th className="py-2 pr-4">New players</th>
                    <th className="py-2 pr-4">Repeated players</th>
                    <th className="py-2">Completion rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {games.map((game) => {
                    const seed = seedFromString(`game-${game.gameType}`);
                    const played = seededInt(seed, 200, 2000);
                    const newPlayers = seededInt(seed + 1, 50, played);
                    const repeated = seededInt(seed + 2, 20, played - newPlayers + 20);
                    const completed = seededInt(seed + 3, played / 3, played);
                    return (
                      <tr key={game.gameType}>
                        <td className="py-2 pr-4 text-slate-700">{game.displayName}</td>
                        <td className="py-2 pr-4">{played}</td>
                        <td className="py-2 pr-4">{newPlayers}</td>
                        <td className="py-2 pr-4">{repeated}</td>
                        <td className="py-2">{((completed / played) * 100).toFixed(0)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CollapsibleSection>
      </div>

      {/* Platform operations (real data) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Platform operations</h2>
            <p className="text-xs text-slate-400">Live screen, session, and advertisement health.</p>
          </div>
          <span className="badge-indigo">{screens.length} total screens</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatsCard
            label="Active screens"
            value={activeScreens}
            icon={MonitorIcon}
            accent="emerald"
            hint={`${pausedScreens} offline`}
          />
          <StatsCard
            label="Assigned ads"
            value={totalAdPlacements}
            icon={ChatBubbleIcon}
            accent="amber"
            hint={`${fullyCoveredScreens} screens fully covered`}
          />
          <StatsCard
            label="Needs attention"
            value={needsAttentionScreens}
            icon={AlertTriangleIcon}
            accent="rose"
            hint="Configuration or connection"
          />
        </div>

        <CollapsibleSection
          title="Platform details"
          subtitle="Screen status, issues, advertisement coverage, and recent activity"
          defaultOpen
        >
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Live sessions</h3>
                <span className="text-xs text-slate-400">Auto-refreshes every 8s</span>
              </div>
              {sessions.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">No sessions are currently running.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Code</th>
                        <th className="px-3 py-2">Screen</th>
                        <th className="px-3 py-2">Game</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Players</th>
                        <th className="px-3 py-2">Started</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sessions.map((session) => (
                        <tr key={session.sessionCode || session.code}>
                          <td className="px-3 py-2 font-mono text-xs text-slate-700">{session.sessionCode || session.code}</td>
                          <td className="px-3 py-2">{screenLabel(session.screenId)}</td>
                          <td className="px-3 py-2">{session.gameType || '—'}</td>
                          <td className="px-3 py-2">
                            <span className={SESSION_STATUS_BADGE[session.status] || 'badge-slate'}>{session.status}</span>
                          </td>
                          <td className="px-3 py-2">
                            {session.currentPlayerCount ?? session.playerCount ?? 0}
                            {session.maxPlayers ? ` / ${session.maxPlayers}` : ''}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-500">{timeAgo(session.startedAt || session.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Screens</h3>
                <span className="text-xs text-slate-400">{filteredScreens.length} of {screens.length} shown</span>
              </div>
              {filteredScreens.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">No screens match this search.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredScreens.map((screen) => (
                    <div key={screen.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-slate-800">#{screen.screenNo} · {screen.displayCode}</p>
                        <p className="text-xs text-slate-400">
                          {screen.groupId ? groupName(screen.groupId) || 'Group' : 'Ungrouped'}
                          {screen.special ? ' · Special' : ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={screen.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'}>{screen.status}</span>
                        {activeScreenIds.has(screen.id) && <span className="badge-indigo">In session</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
