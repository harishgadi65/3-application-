export default function WinnerBanner({ isWinner, rank, displayName }) {
  return (
    <div
      className={`rounded-2xl p-6 text-center ${
        isWinner ? 'bg-gradient-to-b from-yellow-400 to-amber-600' : 'bg-slate-800'
      }`}
    >
      <p className={`text-3xl font-black ${isWinner ? 'text-amber-950' : 'text-white'}`}>
        {isWinner ? 'You Won!' : rank ? `You placed #${rank}` : 'Game Over'}
      </p>
      {displayName ? (
        <p className={`mt-1 text-sm ${isWinner ? 'text-amber-900' : 'text-slate-400'}`}>
          {displayName}
        </p>
      ) : null}
    </div>
  );
}
