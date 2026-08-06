import { NavLink, useNavigate } from 'react-router-dom';
import { authApi } from '@smartad/api-client';

export default function BottomNav() {
  const navigate = useNavigate();

  const handleLogout = () => {
    authApi.logout();
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-semibold ${
      isActive ? 'text-emerald-400' : 'text-slate-400'
    }`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-800 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <NavLink to="/join" className={linkClass}>
        <span className="text-xl" aria-hidden="true">
          🎮
        </span>
        Play
      </NavLink>
      <NavLink to="/history" className={linkClass}>
        <span className="text-xl" aria-hidden="true">
          📜
        </span>
        History
      </NavLink>
      <button
        type="button"
        onClick={handleLogout}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-semibold text-slate-400 active:text-red-400"
      >
        <span className="text-xl" aria-hidden="true">
          🚪
        </span>
        Logout
      </button>
    </nav>
  );
}
