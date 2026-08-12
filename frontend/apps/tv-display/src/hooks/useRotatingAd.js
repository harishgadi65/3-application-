import { useEffect, useRef, useState } from 'react';

const IMAGE_DURATION_MS = 8000;
// A video normally advances on its own "ended" event; this is just a
// backstop so one broken/undecodable video can't freeze the rotation.
const VIDEO_FALLBACK_MS = 60000;

/**
 * Cycles through one screen slot's assigned ad playlist: photos advance
 * after a fixed duration, videos advance when they finish playing. A list
 * of zero or one ad is shown statically (no timers).
 *
 * Returns { ad, loop, onEnded } - spread `loop`/`onEnded` onto the <video>
 * so it only auto-repeats itself when it's the sole ad in the slot.
 */
export default function useRotatingAd(ads) {
  const list = Array.isArray(ads) ? ads.filter(Boolean) : [];
  const key = list.map((ad) => ad.id).join(',');
  const [index, setIndex] = useState(0);
  const prevKeyRef = useRef(key);

  useEffect(() => {
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key;
      setIndex(0);
    }
  }, [key]);

  const current = list.length > 0 ? list[index % list.length] : null;

  function advance() {
    setIndex((i) => (list.length > 0 ? (i + 1) % list.length : 0));
  }

  useEffect(() => {
    if (!current || list.length <= 1) return undefined;
    const delay = current.mediaType === 'VIDEO' ? VIDEO_FALLBACK_MS : IMAGE_DURATION_MS;
    const timer = setTimeout(advance, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, list.length]);

  return { ad: current, loop: list.length <= 1, onEnded: advance };
}
