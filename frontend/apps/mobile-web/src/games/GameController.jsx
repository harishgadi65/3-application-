import SnakeController from './snake/SnakeController.jsx';
import TapButton from './tapblast/TapButton.jsx';
import ReactionFlash from './tapblast/ReactionFlash.jsx';
import JumpButton from './platformdash/JumpButton.jsx';
import RpsPicker from './rps/RpsPicker.jsx';

/**
 * Dynamically swaps in the right on-screen controller for the active
 * game type. `onAction` publishes to /app/game/{code}/action.
 */
export default function GameController({ gameType, onAction, gameUpdateState, gameEvent, playerId }) {
  switch ((gameType || '').toUpperCase()) {
    case 'SNAKE':
      return <SnakeController onAction={onAction} />;

    case 'TAP_BLAST':
      return (
        <div className="relative flex h-full w-full flex-col">
          <TapButton onAction={onAction} gameUpdateState={gameUpdateState} playerId={playerId} />
          <ReactionFlash gameEvent={gameEvent} onAction={onAction} />
        </div>
      );

    case 'PLATFORM_DASH':
      return <JumpButton onAction={onAction} gameUpdateState={gameUpdateState} playerId={playerId} />;

    case 'ROCK_PAPER_SCISSORS':
      return <RpsPicker onAction={onAction} gameUpdateState={gameUpdateState} playerId={playerId} />;

    default:
      return (
        <div className="flex h-full items-center justify-center p-6 text-center text-slate-400">
          Waiting for game controls…
        </div>
      );
  }
}
