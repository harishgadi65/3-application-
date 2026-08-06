import { sessionApi } from '@smartad/api-client';

/**
 * Large QR code panel players scan with their phone camera to join a session.
 */
export default function QRCodeDisplay({ code }) {
  const qrUrl = sessionApi.getSessionQrUrl(code);

  return (
    <div className="flex flex-col items-center gap-6 bg-white rounded-[2rem] p-10 shadow-[0_0_80px_rgba(99,102,241,0.35)]">
      <img
        src={qrUrl}
        alt={`QR code to join session ${code}`}
        className="w-80 h-80 object-contain"
      />
      <div className="text-center">
        <p className="text-slate-500 text-2xl font-bold uppercase tracking-[0.3em]">
          Scan to join
        </p>
        <p className="text-slate-900 text-6xl font-black tracking-[0.25em] mt-2">
          {code}
        </p>
      </div>
    </div>
  );
}
