import RotatingAdZone from './RotatingAdZone.jsx';

/**
 * Top-level TV layout: ad zones pinned to all four outer edges, with the
 * phase-driven content (waiting room / countdown / game / winner) filling
 * the center. Each zone cycles through its own playlist of ads.
 *
 * `hideAdZones` renders just the center content full-bleed, no ad chrome
 * at all - used for the admin dashboard's screen-less game preview, which
 * has no assigned screen/ads to show and just wants the bare game view.
 */
export default function ScreenLayout({ adsByPosition = {}, hideAdZones = false, children }) {
  if (hideAdZones) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-slate-950 to-black">
        {children}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-black grid grid-rows-[clamp(64px,10vh,120px)_minmax(0,1fr)_clamp(64px,10vh,120px)] grid-cols-[clamp(110px,13vw,250px)_minmax(0,1fr)_clamp(110px,13vw,250px)]">
      <div className="col-[1/4] row-[1] min-h-0 border-b border-white/5">
        <RotatingAdZone position="TOP" ads={adsByPosition.TOP} />
      </div>

      <div className="col-[1] row-[2] min-w-0 border-r border-white/5">
        <RotatingAdZone position="LEFT" ads={adsByPosition.LEFT} />
      </div>

      <main className="col-[2] row-[2] relative min-w-0 min-h-0 overflow-hidden bg-gradient-to-b from-slate-950 to-black">
        {children}
      </main>

      <div className="col-[3] row-[2] min-w-0 border-l border-white/5">
        <RotatingAdZone position="RIGHT" ads={adsByPosition.RIGHT} />
      </div>

      <div className="col-[1/4] row-[3] min-h-0 border-t border-white/5">
        <RotatingAdZone position="BOTTOM" ads={adsByPosition.BOTTOM} />
      </div>
    </div>
  );
}
