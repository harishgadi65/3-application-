import { useEffect, useRef, useState } from 'react';

const NATIVE_WIDTH = 1280;
const NATIVE_HEIGHT = 800;

/**
 * Renders an iframe at a generous fixed "native" resolution (comfortably
 * larger than any real game view's minimum layout needs) and scales the
 * whole thing down with a CSS transform to fit whatever space is actually
 * available. This is a zoom-out, not a redesign - the embedded page itself
 * never finds out its viewport is small, so nothing inside it clips,
 * without touching that page's own component styles at all.
 */
export default function ScaledFrame({ src, title, className = '' }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setScale(Math.min(width / NATIVE_WIDTH, height / NATIVE_HEIGHT, 1) || 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-slate-950 ${className}`}>
      <div
        style={{
          width: NATIVE_WIDTH,
          height: NATIVE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          marginLeft: -(NATIVE_WIDTH * scale) / 2,
          marginTop: -(NATIVE_HEIGHT * scale) / 2,
        }}
        className="absolute left-1/2 top-1/2"
      >
        <iframe key={src} src={src} title={title} className="h-full w-full border-0 bg-slate-950" />
      </div>
    </div>
  );
}
