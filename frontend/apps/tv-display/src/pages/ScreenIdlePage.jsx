import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { screenApi } from '@smartad/api-client';
import { LoadingSpinner } from '@smartad/shared-ui';

const ROTATE_INTERVAL_MS = 8000;
const SESSION_POLL_MS = 5000;
const DISPLAY_CODE_KEY = 'smartad_display_code';

function AdSlide({ ad }) {
  if (!ad) return <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-black" />;
  return ad.mediaType === 'VIDEO' ? (
    <video
      key={ad.id}
      src={ad.mediaUrl}
      className="absolute inset-0 h-full w-full object-cover animate-ad-fade"
      autoPlay
      muted
      loop
      playsInline
    />
  ) : (
    <img key={ad.id} src={ad.mediaUrl} alt={ad.title || 'Advertisement'} className="absolute inset-0 h-full w-full object-cover animate-ad-fade" />
  );
}

/**
 * A registered screen's idle view: rotates through exactly the ads assigned
 * to this screen in the admin dashboard (matching its Preview), shows a real
 * "scan to play" QR tied to THIS screen, and hands off to the real session
 * flow (/display/:sessionCode) the moment a player scans it (or an admin
 * starts one directly) - see LandingPage for how a finished session routes
 * back here.
 */
export default function ScreenIdlePage() {
  const { displayCode } = useParams();
  const navigate = useNavigate();
  const [screen, setScreen] = useState(null);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    screenApi
      .getScreenByCode(displayCode)
      .then((data) => {
        if (!cancelled) setScreen(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'This screen is no longer registered.');
      });
    return () => {
      cancelled = true;
    };
  }, [displayCode]);

  const ads = useMemo(
    () => (screen ? [screen.startupAd, screen.topAd, screen.bottomAd, screen.leftAd, screen.rightAd].filter(Boolean) : []),
    [screen],
  );

  useEffect(() => {
    if (ads.length === 0) return undefined;
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % ads.length), ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [ads.length]);

  useEffect(() => {
    let cancelled = false;
    const findSession = async () => {
      try {
        const session = await screenApi.getActiveSessionForScreen(displayCode);
        const code = session?.sessionCode || session?.code;
        if (!cancelled && code) navigate(`/display/${code}`, { replace: true });
      } catch (err) {
        console.error('ScreenIdlePage: failed to poll for this screen\'s active session', err);
      }
    };
    findSession();
    const timer = setInterval(findSession, SESSION_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [displayCode, navigate]);

  function forgetScreen() {
    localStorage.removeItem(DISPLAY_CODE_KEY);
    navigate('/', { replace: true });
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-slate-950 px-8 text-center text-white">
        <p className="text-3xl font-black text-red-400">Screen not found</p>
        <p className="max-w-md text-slate-400">{error}</p>
        <button
          type="button"
          onClick={forgetScreen}
          className="mt-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-300"
        >
          Re-enter display code
        </button>
      </div>
    );
  }

  if (!screen) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <LoadingSpinner />
      </div>
    );
  }

  const ad = ads.length > 0 ? ads[index % ads.length] : null;
  const hasGames = screen.games.length > 0;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <AdSlide ad={ad} />
      <div className="absolute inset-0 bg-black/25" />

      <div className="absolute bottom-6 left-6 rounded-xl border border-white/15 bg-black/70 px-5 py-3 backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
          Screen #{screen.screenNo}{screen.groupName ? ` · ${screen.groupName}` : ''}
        </p>
        <p className="mt-1 text-sm text-slate-300">
          {hasGames ? `Ready to play: ${screen.games.map((g) => g.displayName).join(', ')}` : 'No games configured for this screen yet'}
        </p>
      </div>

      {hasGames && (
        <div className="absolute bottom-6 right-6 flex items-center gap-3 rounded-xl border-2 border-cyan-400/70 bg-slate-950/90 p-3 shadow-[0_0_30px_rgba(34,211,238,0.25)]">
          <img
            src={screenApi.getScreenQrUrl(displayCode)}
            alt={`QR code to play on screen ${displayCode}`}
            className="h-16 w-16 rounded bg-white object-contain"
          />
          <div>
            <p className="text-sm font-bold text-cyan-300">Scan to Play</p>
            <p className="text-xs font-mono text-amber-400">{displayCode}</p>
          </div>
        </div>
      )}
    </div>
  );
}
