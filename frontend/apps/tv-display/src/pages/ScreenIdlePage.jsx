import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { screenApi } from '@smartad/api-client';
import { LoadingSpinner } from '@smartad/shared-ui';

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
 * A registered screen's idle view: loops just this screen's full-screen ad
 * (its "FULL-SCREEN AD" slot in the admin Ads Controls tab - the top/bottom/
 * left/right ads are side-panel ads for the game-selection screen, not for
 * here), shows a real "scan to play" QR tied to THIS screen, and hands off
 * to the real session flow (/display/:sessionCode) the moment a player
 * scans it (or an admin starts one directly) - see LandingPage for how a
 * finished session routes back here.
 */
const STARTED_STATUSES = ['COUNTDOWN', 'PLAYING'];

export default function ScreenIdlePage() {
  const { displayCode } = useParams();
  const navigate = useNavigate();
  const [screen, setScreen] = useState(null);
  const [error, setError] = useState(null);
  const [joinCode, setJoinCode] = useState(null);

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

  // Proactively make sure a pending session exists as soon as the screen is
  // idle, so a real unique join code is visible beside the QR before anyone
  // has scanned it yet.
  useEffect(() => {
    let cancelled = false;
    screenApi
      .ensureScreenSession(displayCode)
      .then((session) => {
        const code = session?.sessionCode || session?.code;
        if (!cancelled && code) setJoinCode(code);
      })
      .catch((err) => console.error('ScreenIdlePage: failed to ensure a pending session', err));
    return () => {
      cancelled = true;
    };
  }, [displayCode]);

  // Only hand off to the game-selection screen once someone has actually
  // joined (or a game has already started) - the pending session created
  // above with zero players shouldn't move the TV off the idle/QR view.
  useEffect(() => {
    let cancelled = false;
    const findSession = async () => {
      try {
        const session = await screenApi.getActiveSessionForScreen(displayCode);
        const code = session?.sessionCode || session?.code;
        const hasStarted = session && (session.currentPlayerCount > 0 || STARTED_STATUSES.includes(session.status));
        if (!cancelled && code && hasStarted) navigate(`/display/${code}`, { replace: true });
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

  const hasGames = screen.games.length > 0;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <AdSlide ad={screen.startupAd} />
      <div className="absolute inset-0 bg-black/25" />

      {hasGames && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-xl border-2 border-cyan-400/70 bg-slate-950/90 p-3 shadow-[0_0_30px_rgba(34,211,238,0.25)]">
          <img
            src={screenApi.getScreenQrUrl(displayCode)}
            alt={`QR code to play on screen ${displayCode}`}
            className="h-16 w-16 rounded bg-white object-contain"
          />
          <div>
            <p className="text-sm font-bold text-cyan-300">Scan to Play</p>
            <p className="text-xs font-mono text-amber-400">{joinCode || '…'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
