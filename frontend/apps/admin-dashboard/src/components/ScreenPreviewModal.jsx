import { useState } from 'react';

const GAME_ICONS = {
  SNAKE: '🐍',
  TAP_BLAST: '🚀',
  PLATFORM_DASH: '🏃',
};

function AdSurface({ ad, className = '' }) {
  if (!ad) {
    return <div className={`bg-slate-800 ${className}`} />;
  }
  if (ad.mediaType === 'VIDEO') {
    return <video src={ad.mediaUrl} className={`object-cover ${className}`} autoPlay muted loop playsInline />;
  }
  return <img src={ad.mediaUrl} alt={ad.title} className={`object-cover ${className}`} />;
}

/** A faux QR pattern - purely visual, not a real scannable code. */
function FakeQrCode() {
  const cells = Array.from({ length: 49 }, (_, i) => (i * 7 + Math.floor(i / 7) * 3) % 5 < 2);
  return (
    <div className="grid h-16 w-16 grid-cols-7 gap-[1px] bg-white p-1.5">
      {cells.map((filled, i) => (
        <div key={i} className={filled ? 'bg-slate-950' : 'bg-white'} />
      ))}
    </div>
  );
}

export default function ScreenPreviewModal({ screen, ads, games, onClose }) {
  const [page, setPage] = useState(1);
  if (!screen) return null;

  const adById = (id) => ads.find((ad) => String(ad.id) === String(id));
  const startupAd = adById(screen.adAssignments?.STARTUP);
  const topAd = adById(screen.adAssignments?.TOP);
  const bottomAd = adById(screen.adAssignments?.BOTTOM);
  const leftAd = adById(screen.adAssignments?.LEFT);
  const rightAd = adById(screen.adAssignments?.RIGHT);

  const assignedGames = (screen.games || [])
    .map((type) => games.find((game) => game.gameType === type) || { gameType: type, displayName: type })
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl">
        <div className="flex items-center justify-between bg-slate-900 px-4 py-2">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPage(1)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${page === 1 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Page 1 · Startup
            </button>
            <button
              type="button"
              onClick={() => setPage(2)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${page === 2 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Page 2 · Game
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Screen #{screen.screenNo} preview · design mockup, not a live session</span>
            <button type="button" onClick={onClose} className="text-xl text-slate-400 hover:text-white" aria-label="Close">×</button>
          </div>
        </div>

        <div className="relative aspect-video w-full overflow-hidden">
          {page === 1 ? (
            <div className="relative h-full w-full overflow-hidden">
              <AdSurface ad={startupAd} className="h-full w-full" />
              {!startupAd && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
                  No full-screen ad assigned
                </div>
              )}
              <div className="absolute bottom-6 right-6 flex items-center gap-3 rounded-xl border-2 border-cyan-400/70 bg-slate-950/90 p-3 shadow-[0_0_30px_rgba(34,211,238,0.25)]">
                <FakeQrCode />
                <div>
                  <p className="text-sm font-bold text-cyan-300">Scan to Play</p>
                  <p className="text-xs font-mono text-amber-400">{screen.displayCode}</p>
                  <button type="button" className="mt-1 rounded-md bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950">
                    ▶ Start
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid h-full w-full grid-cols-[1fr_3fr_1fr] grid-rows-[1fr_3fr_1fr] gap-1 bg-slate-900 p-1">
              <div className="relative col-span-3 h-full w-full overflow-hidden">
                <AdSurface ad={topAd} className="h-full w-full" />
              </div>
              <div className="relative h-full w-full overflow-hidden">
                <AdSurface ad={leftAd} className="h-full w-full" />
              </div>
              <div className="flex items-center justify-center overflow-hidden bg-white p-4">
                {assignedGames.length === 0 ? (
                  <p className="text-sm text-slate-400">No games assigned to this screen</p>
                ) : (
                  <div className="text-center">
                    <div className="flex flex-wrap items-center justify-center gap-4">
                      {assignedGames.map((game) => (
                        <div key={game.gameType} className="flex w-28 flex-col items-center gap-2 rounded-xl border border-slate-200 p-4">
                          <span className="text-3xl">{GAME_ICONS[game.gameType] || '🎮'}</span>
                          <span className="text-xs font-bold uppercase text-slate-800">{game.displayName}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-xs text-slate-400">Choose a game on your phone</p>
                  </div>
                )}
              </div>
              <div className="relative h-full w-full overflow-hidden">
                <AdSurface ad={rightAd} className="h-full w-full" />
              </div>
              <div className="relative col-span-3 h-full w-full overflow-hidden">
                <AdSurface ad={bottomAd} className="h-full w-full" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
