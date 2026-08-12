import { NavLink, useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api.js';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/advertisements', label: 'Advertisements', icon: AdsIcon },
  { to: '/advertisements/screens', label: 'Screens', icon: ScreensIcon, child: true },
  { to: '/games', label: 'Games', icon: GamesIcon },
  { to: '/coupons', label: 'Coupons', icon: CouponsIcon },
  { to: '/config', label: 'Config', icon: ConfigIcon },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const identity = authApi.getIdentity ? authApi.getIdentity() : null;

  function handleLogout() {
    authApi.logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col bg-slate-900 text-slate-200">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold text-white">
          SA
        </div>
        <div>
          <p className="text-sm font-semibold text-white">SmartAd</p>
          <p className="text-xs text-slate-400">Admin Console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {/* eslint-disable-next-line no-unused-vars -- Icon is used as a JSX tag below */}
        {navItems.map(({ to, label, icon: Icon, child }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/advertisements'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors ${child ? 'ml-6 px-3 text-xs' : 'px-3'} ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 px-3 py-4">
        {identity && (
          <p className="mb-2 truncate px-3 text-xs text-slate-400">
            Signed in as{' '}
            <span className="font-medium text-slate-200">
              {identity.username || identity.displayName || 'admin'}
            </span>
          </p>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <LogoutIcon className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5 12 4l9 7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function AdsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h11l5 3v6l-5 3H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
      <path strokeLinecap="round" d="M8 15v3a2 2 0 0 0 4 0v-3" />
    </svg>
  );
}

function ScreensIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path strokeLinecap="round" d="M8 21h8M12 18v3" />
    </svg>
  );
}

function GamesIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="2" y="7" width="20" height="12" rx="4" />
      <path strokeLinecap="round" d="M8 11v4M6 13h4" />
      <circle cx="16" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="15" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CouponsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
      <path strokeLinecap="round" d="M9 6v12" strokeDasharray="2 2" />
    </svg>
  );
}

function ConfigIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function LogoutIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5" />
      <path strokeLinecap="round" d="M21 12H9" />
    </svg>
  );
}
