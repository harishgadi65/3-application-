/**
 * Purely cosmetic demo reward — there is no real rewards backend for
 * this proof of concept, so the points are computed client-side.
 */
export default function RewardCard({ points = 50 }) {
  return (
    <div className="rounded-2xl border border-dashed border-emerald-500/50 bg-emerald-500/10 p-5 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400">Reward</p>
      <p className="mt-2 text-2xl font-bold text-white">You earned {points} points!</p>
      <p className="mt-1 text-sm text-slate-400">Redeem next visit</p>
    </div>
  );
}
