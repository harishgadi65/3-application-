import { useEffect, useRef, useState } from 'react';

const SUPPORTS_BARCODE_DETECTOR = typeof window !== 'undefined' && 'BarcodeDetector' in window;

/**
 * Optional QR scan flow for filling in the session code. Feature-detects
 * the BarcodeDetector API — if the browser doesn't support it, renders
 * nothing and the caller just relies on manual entry (no third-party
 * QR scanning dependency is used).
 */
export default function QRScanner({ onScan }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let detector;

    const stop = () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };

    const scanLoop = async () => {
      if (cancelled || !videoRef.current || !detector) return;
      try {
        const codes = await detector.detect(videoRef.current);
        const value = codes[0]?.rawValue;
        if (value) {
          onScan(value);
          stop();
          setOpen(false);
          return;
        }
      } catch {
        // transient decode errors are expected between frames; ignore
      }
      rafRef.current = requestAnimationFrame(scanLoop);
    };

    (async () => {
      try {
        detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        scanLoop();
      } catch (err) {
        setError(err.message || 'Camera unavailable');
      }
    })();

    return stop;
  }, [open, onScan]);

  if (!SUPPORTS_BARCODE_DETECTOR) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError('');
          setOpen(true);
        }}
        className="w-full rounded-xl border border-slate-600 bg-slate-800 py-3.5 text-base font-semibold text-slate-200 active:bg-slate-700"
      >
        Scan QR Code
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <video ref={videoRef} className="flex-1 object-cover" muted playsInline />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <span className="rounded-full bg-black/50 px-3 py-2 text-sm text-white">
              Point at the TV&apos;s QR code
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white"
            >
              Cancel
            </button>
          </div>
          {error ? (
            <p className="absolute inset-x-0 bottom-24 text-center text-sm text-red-400">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
