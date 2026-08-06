import SnakeArena from './snake/SnakeArena.jsx';
import RocketTrack from './tapblast/RocketTrack.jsx';

/**
 * Dispatches to the correct game view based on gameType. All game logic
 * lives on the backend - this only ever renders the pushed state.
 */
export default function GameRenderer({ gameType, state, reactionFlashes }) {
  if (!state) {
    return (
      <div className="w-full h-full flex items-center justify-center text-3xl text-slate-500 font-semibold">
        Loading game...
      </div>
    );
  }

  switch (gameType) {
    case 'SNAKE':
      return <SnakeArena state={state} />;
    case 'TAP_BLAST':
      return <RocketTrack state={state} flashes={reactionFlashes} />;
    default:
      return (
        <div className="w-full h-full flex items-center justify-center text-3xl text-slate-500 font-semibold">
          Unsupported game type: {String(gameType)}
        </div>
      );
  }
}
