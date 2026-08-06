import { useEffect, useRef } from 'react';

const DEFAULT_GRID = { width: 30, height: 30 };
const FOOD_COLOR = '#fbbf24';
const GRID_LINE_COLOR = 'rgba(255,255,255,0.05)';
const DEAD_COLOR = '#4b5563';

/**
 * Renders the 30x30 SNAKE grid on a <canvas>. Redrawn on every incoming
 * game-update message (the backend pushes at a fixed low framerate, e.g.
 * ~5fps). Dead snakes are drawn faded/greyed.
 */
export default function SnakeArena({ state }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const grid = state?.grid || DEFAULT_GRID;
  const snakes = state?.snakes || {};
  const food = state?.food || [];

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const availableSize = Math.max(100, Math.min(rect.width, rect.height));
    const cell = Math.max(
      4,
      Math.floor(availableSize / Math.max(grid.width, grid.height, 1))
    );
    const pxWidth = cell * grid.width;
    const pxHeight = cell * grid.height;

    canvas.width = pxWidth * dpr;
    canvas.height = pxHeight * dpr;
    canvas.style.width = `${pxWidth}px`;
    canvas.style.height = `${pxHeight}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, pxWidth, pxHeight);

    // Background
    ctx.fillStyle = '#0b0d14';
    ctx.fillRect(0, 0, pxWidth, pxHeight);

    // Grid lines
    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = 1;
    for (let x = 0; x <= grid.width; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * cell, 0);
      ctx.lineTo(x * cell, pxHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= grid.height; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y * cell);
      ctx.lineTo(pxWidth, y * cell);
      ctx.stroke();
    }

    // Food
    ctx.fillStyle = FOOD_COLOR;
    food.forEach(([fx, fy]) => {
      const cx = fx * cell + cell / 2;
      const cy = fy * cell + cell / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(2, cell * 0.28), 0, Math.PI * 2);
      ctx.fill();
    });

    // Snakes
    Object.values(snakes).forEach((snake) => {
      const body = snake.body || [];
      const alive = snake.alive !== false;
      const color = alive ? snake.color || '#22d3ee' : DEAD_COLOR;

      ctx.globalAlpha = alive ? 1 : 0.45;
      body.forEach(([sx, sy], idx) => {
        const isHead = idx === 0;
        const pad = isHead ? 0 : cell * 0.08;
        ctx.fillStyle = color;
        ctx.fillRect(sx * cell + pad, sy * cell + pad, cell - pad * 2, cell - pad * 2);

        if (isHead) {
          ctx.fillStyle = alive ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)';
          ctx.fillRect(
            sx * cell + cell * 0.25,
            sy * cell + cell * 0.25,
            cell * 0.5,
            cell * 0.5
          );
        }
      });
      ctx.globalAlpha = 1;
    });
  }, [state, grid.width, grid.height]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center p-4">
      <canvas ref={canvasRef} className="rounded-2xl shadow-2xl" />
    </div>
  );
}
