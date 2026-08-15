/**
 * Purely cosmetic demo reward - there is no real rewards backend for this
 * proof of concept, so a dummy offer is shown until the game-end message
 * carries a real `reward`/`coupon` payload from the backend. The coupon
 * code itself is never shown here (or on the generated share poster).
 */
export default function RewardCard({ points, offerTitle, provider }) {
  return (
    <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/15 to-emerald-500/5 p-5">
      <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-emerald-400">
        🎁 Reward earned {typeof points === 'number' ? `· +${points} points` : ''}
      </p>
      {offerTitle && <p className="mt-2 text-xl font-black text-white">{offerTitle}</p>}
      {provider && <p className="mt-1 text-sm text-slate-400">{provider} · code hidden</p>}
    </div>
  );
}
