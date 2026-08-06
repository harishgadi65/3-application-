import AdZone from './AdZone.jsx';

/**
 * Top-level TV layout: ad zones pinned to all four outer edges, with the
 * phase-driven content (waiting room / countdown / game / winner) filling
 * the center. Ads stay mounted and rotating across every phase.
 */
export default function ScreenLayout({ currentAdByPosition = {}, children }) {
  return (
    <div className="w-screen h-screen bg-black grid grid-rows-[10vh_1fr_10vh] grid-cols-[13vw_1fr_13vw]">
      <div className="col-[1/4] row-[1] min-h-0 border-b border-white/5">
        <AdZone position="TOP" ad={currentAdByPosition.TOP} />
      </div>

      <div className="col-[1] row-[2] min-w-0 border-r border-white/5">
        <AdZone position="LEFT" ad={currentAdByPosition.LEFT} />
      </div>

      <main className="col-[2] row-[2] relative min-w-0 min-h-0 overflow-hidden bg-gradient-to-b from-slate-950 to-black">
        {children}
      </main>

      <div className="col-[3] row-[2] min-w-0 border-l border-white/5">
        <AdZone position="RIGHT" ad={currentAdByPosition.RIGHT} />
      </div>

      <div className="col-[1/4] row-[3] min-h-0 border-t border-white/5">
        <AdZone position="BOTTOM" ad={currentAdByPosition.BOTTOM} />
      </div>
    </div>
  );
}
