import { useCallback, useRef } from 'react';

const MIN_INTERVAL_MS = 120;
const SWIPE_THRESHOLD_PX = 24;

/**
 * Snake input: a full-screen swipe area plus a 4-button D-pad. Either
 * input publishes a DIRECTION action. Both paths funnel through
 * sendDirection(), which debounces so a held button or a jittery swipe
 * doesn't spam duplicate directions.
 */
export default function SnakeController({ onAction }) {
  const lastSentRef = useRef({ direction: null, time: 0 });
  const touchStartRef = useRef(null);

  const sendDirection = useCallback(
    (direction) => {
      const now = Date.now();
      const last = lastSentRef.current;
      if (last.direction === direction && now - last.time < MIN_INTERVAL_MS) return;
      lastSentRef.current = { direction, time: now };
      onAction({ type: 'DIRECTION', data: { direction } });
    },
    [onAction],
  );

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX && Math.abs(dy) < SWIPE_THRESHOLD_PX) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      sendDirection(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      sendDirection(dy > 0 ? 'DOWN' : 'UP');
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div
        className="flex flex-1 select-none items-center justify-center bg-slate-900/40 text-sm text-slate-500"
        style={{ touchAction: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        Swipe anywhere to steer
      </div>

      <div className="grid grid-cols-3 gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div />
        <button
          type="button"
          aria-label="Up"
          className="dpad-btn"
          onPointerDown={() => sendDirection('UP')}
        >
          ▲
        </button>
        <div />

        <button
          type="button"
          aria-label="Left"
          className="dpad-btn"
          onPointerDown={() => sendDirection('LEFT')}
        >
          ◀
        </button>
        <div className="flex items-center justify-center text-slate-600">●</div>
        <button
          type="button"
          aria-label="Right"
          className="dpad-btn"
          onPointerDown={() => sendDirection('RIGHT')}
        >
          ▶
        </button>

        <div />
        <button
          type="button"
          aria-label="Down"
          className="dpad-btn"
          onPointerDown={() => sendDirection('DOWN')}
        >
          ▼
        </button>
        <div />
      </div>
    </div>
  );
}
