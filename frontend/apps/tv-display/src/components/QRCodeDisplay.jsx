import { sessionApi } from '@smartad/api-client';

/**
 * Large QR code panel players scan with their phone camera to join a session.
 */
export default function QRCodeDisplay({ code, compact = false }) {
  const qrUrl = sessionApi.getSessionQrUrl(code);

  return (
    <div className={`flex items-center bg-white/90 shadow-[0_0_80px_rgba(99,102,241,0.35)] backdrop-blur-sm ${compact ? 'w-fit flex-row gap-[clamp(6px,0.6vw,10px)] rounded-[clamp(0.75rem,1.2vw,1.5rem)] p-[clamp(5px,0.5vw,8px)]' : 'flex-col gap-6 rounded-[2rem] p-10'}`}>
      <img
        src={qrUrl}
        alt={`QR code to join session ${code}`}
        className={compact ? 'h-[clamp(110px,16vh,210px)] w-[clamp(110px,16vh,210px)] object-contain' : 'h-80 w-80 object-contain'}
      />
      <div className={compact ? 'min-w-0 text-left' : 'text-center'}>
        <p className={`${compact ? 'text-[clamp(10px,0.9vw,16px)]' : 'text-2xl'} text-slate-500 font-bold uppercase tracking-[0.25em]`}>
          Scan to join
        </p>
        <p className={`${compact ? 'whitespace-nowrap text-[clamp(18px,1.8vw,32px)]' : 'text-6xl'} mt-[clamp(7px,1vh,14px)] font-black tracking-[0.2em] text-slate-900`}>
          {code}
        </p>
      </div>
    </div>
  );
}
