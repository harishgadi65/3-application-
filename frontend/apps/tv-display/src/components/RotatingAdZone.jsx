import useRotatingAd from '../hooks/useRotatingAd.js';
import AdZone from './AdZone.jsx';

/** Wraps AdZone with playlist rotation for one screen edge. */
export default function RotatingAdZone({ position, ads }) {
  const { ad, loop, onEnded } = useRotatingAd(ads);
  return <AdZone position={position} ad={ad} loop={loop} onEnded={onEnded} />;
}
