import QRCodeDisplay from './QRCodeDisplay.jsx';

/** Full-screen opening creative with an always-readable join QR overlay. */
export default function StartupDisplay({ ad, code, gameType }) {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950">
      {ad ? (
        ad.mediaType === 'VIDEO' ? (
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
          <img
            key={ad.id}
            src={ad.mediaUrl}
            alt={ad.title || 'Opening advertisement'}
            className="absolute inset-0 h-full w-full object-cover animate-ad-fade"
          />
        )
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-black" />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/75" />

      <div className="absolute bottom-[10%] left-1/2 w-[clamp(280px,24vw,460px)] -translate-x-1/2 rounded-[clamp(1rem,2vw,2.5rem)] border border-white/20 bg-black/75 p-[clamp(10px,1.2vw,22px)] shadow-2xl backdrop-blur-xl">
        <QRCodeDisplay code={code} compact />
        <p className="mt-[clamp(8px,1vh,16px)] text-center text-[clamp(12px,1.15vw,20px)] font-bold uppercase tracking-[0.18em] text-indigo-300">
          Scan to join
        </p>
      </div>

      {ad?.title && (
        <div className="absolute bottom-[clamp(12px,2vh,24px)] left-[clamp(12px,2vw,28px)] max-w-[35vw] truncate rounded-full bg-black/60 px-[clamp(12px,1.2vw,20px)] py-2 text-[clamp(12px,1vw,18px)] font-semibold text-white/90 backdrop-blur">
          {ad.title}
        </div>
      )}
    </div>
  );
}
