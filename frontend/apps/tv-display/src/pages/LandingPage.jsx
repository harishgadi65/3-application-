import { useEffect, useState } from 'react';
import { adApi } from '@smartad/api-client';

const POLL_INTERVAL_MS = 30000;
const ROTATE_INTERVAL_MS = 8000;

/**
 * "/" attract screen shown while no session is active: a big message plus
 * a full-screen rotating ad reel behind it.
 */
export default function LandingPage() {
  const [ads, setAds] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      adApi
        .listAds()
        .then((data) => {
          if (!cancelled && Array.isArray(data)) setAds(data);
        })
        .catch((err) => console.error('LandingPage: failed to load ads', err));
    };

    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (ads.length === 0) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ads.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [ads]);

  const ad = ads.length > 0 ? ads[index % ads.length] : null;

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      {ad ? (
        ad.mediaType === 'VIDEO' ? (
          <video
            key={ad.id}
            src={ad.mediaUrl}
            className="absolute inset-0 w-full h-full object-cover animate-ad-fade"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            key={ad.id}
            src={ad.mediaUrl}
            alt={ad.title || 'Advertisement'}
            className="absolute inset-0 w-full h-full object-cover animate-ad-fade"
          />
        )
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-black" />
      )}

      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 bg-black/70 backdrop-blur-md rounded-[2rem] px-20 py-16 border border-white/10 flex flex-col items-center gap-6 animate-fade-in max-w-5xl mx-8">
        <span className="text-7xl">🎮</span>
        <h1 className="text-6xl font-black text-center text-white leading-tight">
          Waiting for admin to create a session
        </h1>
        <p className="text-3xl text-slate-300 text-center">
          Ask venue staff to start a game, then scan the QR code to join.
        </p>
      </div>
    </div>
  );
}
