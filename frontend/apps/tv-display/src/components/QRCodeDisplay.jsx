import { sessionApi } from '@smartad/api-client';

/**
 * Large QR code panel players scan with their phone camera to join a session.
 */
export default function QRCodeDisplay({ code, compact = false }) {
  const qrUrl = sessionApi.getSessionQrUrl(code);

  return (
    <div className={`flex items-center bg-white shadow-[0_0_80px_rgba(99,102,241,0.35)] ${compact ? 'flex-row justify-center gap-[clamp(12px,1.2vw,22px)] rounded-[clamp(0.75rem,1.2vw,1.5rem)] p-[clamp(10px,1vw,18px)]' : 'flex-col gap-6 rounded-[2rem] p-10'}`}>
      <img
        src={qrUrl}
        alt={`QR code to join session ${code}`}
        className={compact ? 'h-[clamp(110px,16vh,210px)] w-[clamp(110px,16vh,210px)] object-contain' : 'h-80 w-80 object-contain'}
      />
      <div className={compact ? 'min-w-0 text-left' : 'text-center'}>
        <p className={`${compact ? 'text-[clamp(10px,0.9vw,16px)]' : 'text-2xl'} text-slate-500 font-bold uppercase tracking-[0.25em]`}>
          Scan to join
        </p>
        <p className={`${compact ? 'whitespace-nowrap text-[clamp(22px,2.3vw,40px)]' : 'text-6xl'} text-slate-900 font-black tracking-[0.2em] mt-[clamp(2px,0.5vh,8px)]`}>
          {code}
        </p>
      </div>
    </div>
  );
}
