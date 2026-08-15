import GameRenderer from '../games/GameRenderer.jsx';
import LiveLeaderboard from './LiveLeaderboard.jsx';

/**
 * PLAYING phase: the live game view plus a leaderboard sidebar overlay.
 */
export default function GameArea({ gameType, gameState, rankings, reactionFlashes, hideLeaderboard = false }) {
  return (
    <div className="flex h-full w-full gap-[clamp(8px,1.2vw,24px)] p-[clamp(8px,1.2vw,24px)]">
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-[clamp(12px,1.5vw,24px)] border border-white/10 bg-black/40">
        <GameRenderer gameType={gameType} state={gameState} reactionFlashes={reactionFlashes} />
      </div>
      {!hideLeaderboard && (
        <div className="w-[clamp(210px,22vw,360px)] shrink-0">
          <LiveLeaderboard rankings={rankings} />
        </div>
      )}
    </div>
  );
}
