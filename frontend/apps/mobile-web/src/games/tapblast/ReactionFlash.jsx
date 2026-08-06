import { useEffect, useState } from 'react';

/**
 * Full-screen reaction prompt for TAP_BLAST. Driven by REACTION_FLASH
 * game-events passed down via `gameEvent`: shows a green "BOOST! TAP
 * NOW" or red "TRAP! DON'T TAP" overlay for `windowMs`. Tapping during
 * a BOOST publishes the REACTION action; a TRAP never publishes
 * anything, tapped or not — that's the "correct" response.
 */
export default function ReactionFlash({ gameEvent, onAction }) {
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (!gameEvent || gameEvent.type !== 'REACTION_FLASH') return;
    const { response, windowMs = 1500 } = gameEvent.data || {};
    setFlash({ response });
    const timer = setTimeout(() => setFlash(null), windowMs);
    return () => clearTimeout(timer);
  }, [gameEvent]);

  if (!flash) return null;

  const isBoost = flash.response === 'BOOST';

  const handleTap = (e) => {
    e.preventDefault();
    if (!isBoost) return;
    onAction({ type: 'REACTION', data: { response: 'BOOST' } });
    setFlash(null);
  };

  return (
    <div
      onPointerDown={handleTap}
      style={{ touchAction: 'manipulation' }}
      className={`fixed inset-0 z-50 flex select-none items-center justify-center text-center ${
        isBoost ? 'bg-emerald-500' : 'bg-red-600'
      }`}
    >
      <div className="px-8">
        <p className="text-5xl font-black text-white">{isBoost ? 'BOOST!' : 'TRAP!'}</p>
        <p className="mt-3 text-xl font-semibold text-white/90">
          {isBoost ? 'TAP NOW' : "DON'T TAP"}
        </p>
      </div>
    </div>
  );
}
