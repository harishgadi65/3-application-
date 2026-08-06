export default function PlayerTable({ players = [] }) {
  if (players.length === 0) {
    return (
      <div className="card">
        <h3 className="mb-1 text-sm font-semibold text-slate-900">Players</h3>
        <p className="text-sm text-slate-400">No players have joined yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">
        Players ({players.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Name</th>
              <th>Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.id}>
                <td className="font-medium text-slate-900">
                  {player.displayName}
                </td>
                <td>{player.score ?? 0}</td>
                <td>
                  <StatusBadge status={player.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const classes =
    {
      CONNECTED: 'badge-green',
      READY: 'badge-green',
      DISCONNECTED: 'badge-slate',
      LEFT: 'badge-rose',
    }[status] || 'badge-slate';

  return <span className={classes}>{status || 'UNKNOWN'}</span>;
}
