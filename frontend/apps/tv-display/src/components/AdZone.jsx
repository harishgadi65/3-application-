/**
 * Renders the currently-active ad for one screen edge (TOP / BOTTOM / LEFT /
 * RIGHT). The parent (<ScreenLayout>) is responsible for sizing/positioning
 * the zone itself - this component just fills whatever box it is given.
 */
export default function AdZone({ position, ad, loop = true, onEnded }) {
  if (!ad) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/50">
        <span className="text-slate-700 text-sm font-bold uppercase tracking-[0.3em]">
          Ad space
        </span>
      </div>
    );
  }

  return (
    <div
      key={ad.id}
      data-position={position}
      className="relative w-full h-full overflow-hidden bg-black animate-ad-fade"
    >
      {ad.mediaType === 'VIDEO' ? (
        <video
          src={ad.mediaUrl}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop={loop}
          playsInline
          onEnded={loop ? undefined : onEnded}
        />
      ) : (
        <img
          src={ad.mediaUrl}
          alt={ad.title || 'Advertisement'}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}
