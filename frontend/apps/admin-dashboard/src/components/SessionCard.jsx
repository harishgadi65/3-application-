import { Link } from 'react-router-dom';
import { phaseBadgeClass } from '../lib/format.js';

export default function SessionCard({ session }) {
  const playerCount =
    session.playerCount ??
    (Array.isArray(session.players) ? session.players.length : 0);
  const maxPlayers = session.maxPlayers ?? '-';

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Session code
          </p>
          <p className="font-mono text-2xl font-bold text-slate-900">
            {session.code}
          </p>
        </div>
        <span className={phaseBadgeClass(session.phase)}>
          {session.phase || 'UNKNOWN'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="badge-indigo">{session.gameType}</span>
        <span className="text-sm text-slate-500">
          {playerCount}/{maxPlayers} players
        </span>
      </div>

      <Link
        to={`/sessions/${session.code}`}
        className="btn-secondary mt-1 w-full"
      >
        View session
      </Link>
    </div>
  );
}
