export default function ScoreTable({ rankings = [] }) {
  const sorted = [...rankings].sort(
    (a, b) => (a.rank ?? 0) - (b.rank ?? 0)
  );

  if (sorted.length === 0) {
    return (
      <div className="card">
        <h3 className="mb-1 text-sm font-semibold text-slate-900">
          Leaderboard
        </h3>
        <p className="text-sm text-slate-400">
          Scores will appear once the game starts.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">
        Leaderboard
      </h3>
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th className="w-12">Rank</th>
              <th>Name</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry) => (
              <tr key={entry.playerId}>
                <td className="font-semibold text-slate-900">
                  #{entry.rank}
                </td>
                <td>{entry.displayName}</td>
                <td className="font-medium">{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
