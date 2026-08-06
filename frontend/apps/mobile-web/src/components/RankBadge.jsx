const TIER_STYLES = {
  1: 'bg-yellow-400 text-yellow-950',
  2: 'bg-slate-300 text-slate-900',
  3: 'bg-amber-600 text-amber-50',
};

export default function RankBadge({ rank }) {
  if (!rank) return null;
  const style = TIER_STYLES[rank] || 'bg-slate-700 text-slate-100';
  return (
    <span
      className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-lg font-bold ${style}`}
    >
      #{rank}
    </span>
  );
}
