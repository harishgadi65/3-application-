/**
 * COUNTDOWN phase: big animated 5-4-3-2-1 driven purely by the "seconds"
 * value pushed over /topic/session/{code}/countdown.
 */
export default function Countdown({ seconds }) {
  const display = seconds > 0 ? seconds : 'GO!';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-10">
      <p className="text-4xl uppercase tracking-[0.5em] text-indigo-400 font-black">
        Get ready
      </p>
      <div
        key={seconds}
        className="animate-countdown-pop text-[26rem] leading-none font-black text-white drop-shadow-[0_0_70px_rgba(99,102,241,0.85)]"
      >
        {display}
      </div>
    </div>
  );
}
