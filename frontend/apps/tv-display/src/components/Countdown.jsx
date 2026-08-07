/**
 * COUNTDOWN phase: big animated 5-4-3-2-1 driven purely by the "seconds"
 * value pushed over /topic/session/{code}/countdown.
 */
export default function Countdown({ seconds }) {
  const display = seconds > 0 ? seconds : 'GO!';

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-[clamp(12px,3vh,40px)]">
      <p className="text-[clamp(18px,2vw,36px)] font-black uppercase tracking-[0.35em] text-indigo-400">
        Get ready
      </p>
      <div
        key={seconds}
        className="animate-countdown-pop text-[clamp(8rem,38vh,24rem)] leading-none font-black text-white drop-shadow-[0_0_70px_rgba(99,102,241,0.85)]"
      >
        {display}
      </div>
    </div>
  );
}
