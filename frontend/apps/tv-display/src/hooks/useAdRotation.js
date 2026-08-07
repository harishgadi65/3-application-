import { useCallback, useEffect, useState } from 'react';
import { adApi } from '@smartad/api-client';

const POSITIONS = ['STARTUP', 'TOP', 'BOTTOM', 'LEFT', 'RIGHT'];
const ROTATION_INTERVAL_MS = 8000;
const REFRESH_INTERVAL_MS = 30000;

function emptyByPosition(fill) {
  return POSITIONS.reduce((acc, position) => {
    acc[position] = fill;
    return acc;
  }, {});
}

/**
 * Fetches active ads, groups them by their target screen edge (TOP / BOTTOM /
 * LEFT / RIGHT) and cycles through each group's "current" ad on an interval.
 *
 * Returns:
 *  - adsByPosition: { TOP: Ad[], BOTTOM: Ad[], LEFT: Ad[], RIGHT: Ad[] }
 *  - currentAdByPosition: { TOP: Ad|null, BOTTOM: Ad|null, LEFT: Ad|null, RIGHT: Ad|null }
 */
export default function useAdRotation() {
  const [adsByPosition, setAdsByPosition] = useState(() => emptyByPosition([]));
  const [indexByPosition, setIndexByPosition] = useState(() => emptyByPosition(0));

  const fetchAds = useCallback(async () => {
    try {
      const ads = await adApi.listAds();
      const grouped = emptyByPosition([]);
      (Array.isArray(ads) ? ads : []).forEach((ad) => {
        const position = POSITIONS.includes(ad.position) ? ad.position : 'BOTTOM';
        grouped[position].push(ad);
      });
      POSITIONS.forEach((position) => {
        grouped[position].sort(
          (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
        );
      });
      setAdsByPosition(grouped);
    } catch (err) {
      // Ads are decorative for a POC - never let a failed fetch break the display.
      console.error('useAdRotation: failed to load ads', err);
    }
  }, []);

  useEffect(() => {
    fetchAds();
    const refreshTimer = setInterval(fetchAds, REFRESH_INTERVAL_MS);
    return () => clearInterval(refreshTimer);
  }, [fetchAds]);

  useEffect(() => {
    const rotateTimer = setInterval(() => {
      setIndexByPosition((prev) => {
        const next = { ...prev };
        POSITIONS.forEach((position) => {
          const count = adsByPosition[position]?.length || 0;
          next[position] = count > 0 ? (prev[position] + 1) % count : 0;
        });
        return next;
      });
    }, ROTATION_INTERVAL_MS);
    return () => clearInterval(rotateTimer);
  }, [adsByPosition]);

  const currentAdByPosition = POSITIONS.reduce((acc, position) => {
    const list = adsByPosition[position] || [];
    acc[position] = list.length > 0 ? list[indexByPosition[position] % list.length] : null;
    return acc;
  }, {});

  const startupAd =
    currentAdByPosition.STARTUP ||
    currentAdByPosition.TOP ||
    currentAdByPosition.BOTTOM ||
    currentAdByPosition.LEFT ||
    currentAdByPosition.RIGHT ||
    null;

  return { adsByPosition, currentAdByPosition, startupAd };
}
