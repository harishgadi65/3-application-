export default function ScoreDisplay({ score = 0 }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        Score
      </span>
      <span className="text-4xl font-black tabular-nums text-white">{score}</span>
    </div>
  );
}
