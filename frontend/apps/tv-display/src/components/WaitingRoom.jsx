import QRCodeDisplay from './QRCodeDisplay.jsx';

const GAME_LABELS = {
  SNAKE: 'Snake Battle',
  TAP_BLAST: 'Tap Blast',
};

/**
 * WAITING phase: QR to join + live player roster + game type, alongside the
 * persistent ad zones rendered by <ScreenLayout>.
 */
export default function WaitingRoom({ code, gameType, players = [] }) {
  const label = GAME_LABELS[gameType] || gameType || 'Game';

  return (
    <div className="w-full h-full flex items-center justify-center gap-20 px-16">
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        <QRCodeDisplay code={code} />
        <p className="text-3xl text-slate-300 font-semibold">
          Scan with your phone camera to join
        </p>
      </div>

      <div className="flex flex-col gap-6 min-w-[30rem] max-w-[34rem] h-[70vh]">
        <div>
          <p className="text-2xl uppercase tracking-[0.3em] text-indigo-400 font-bold">
            Up next
          </p>
          <h2 className="text-7xl font-black leading-tight">{label}</h2>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex-1 backdrop-blur overflow-hidden flex flex-col">
          <p className="text-2xl font-bold text-slate-300 mb-4 shrink-0">
            Players joined ({players.length})
          </p>
          {players.length === 0 ? (
            <p className="text-2xl text-slate-500">Waiting for players to join...</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 overflow-hidden">
              {players.map((player) => (
                <li
                  key={player.id}
                  className="bg-white/10 rounded-xl px-4 py-3 text-3xl font-bold truncate animate-fade-in"
                  title={player.displayName}
                >
                  {player.displayName}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
