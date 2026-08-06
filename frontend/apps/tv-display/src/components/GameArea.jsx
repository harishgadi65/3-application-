import GameRenderer from '../games/GameRenderer.jsx';
import LiveLeaderboard from './LiveLeaderboard.jsx';

/**
 * PLAYING phase: the live game view plus a leaderboard sidebar overlay.
 */
export default function GameArea({ gameType, gameState, rankings, reactionFlashes }) {
  return (
    <div className="w-full h-full flex gap-6 p-6">
      <div className="flex-1 min-w-0 min-h-0 bg-black/40 rounded-3xl border border-white/10 overflow-hidden relative">
        <GameRenderer gameType={gameType} state={gameState} reactionFlashes={reactionFlashes} />
      </div>
      <div className="w-[26rem] shrink-0">
        <LiveLeaderboard rankings={rankings} />
      </div>
    </div>
  );
}
