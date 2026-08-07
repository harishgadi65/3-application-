import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useStomp, useSubscription, publish } from '@smartad/websocket';
import { sessionApi } from '@smartad/api-client';
import { LoadingSpinner } from '@smartad/shared-ui';
import GameStatus from '../components/GameStatus.jsx';
import ScoreDisplay from '../components/ScoreDisplay.jsx';
import RankBadge from '../components/RankBadge.jsx';
import GameController from '../games/GameController.jsx';

const normalizePhase = (value) => value === 'RUNNING' ? 'PLAYING' : value === 'ENDED' ? 'FINISHED' : value;

export default function GamePlayPage() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { client, connected } = useStomp();

  const [playerId, setPlayerId] = useState(location.state?.playerId ?? null);
  const [phase, setPhase] = useState('WAITING');
  const [gameType, setGameType] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [gameUpdate, setGameUpdate] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameEvent, setGameEvent] = useState(null);

  useEffect(() => {
    let cancelled = false;
    sessionApi.getSession(code).then((data) => {
      if (cancelled) return;
      if (data?.phase) setPhase(normalizePhase(data.phase));
      if (data?.gameType) setGameType(data.gameType);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [code]);

  // Recover the player id if this page was opened directly (e.g. a
  // refresh) without route state from JoinGamePage. joinSession is
  // treated as idempotent for an already-joined player.
  useEffect(() => {
    if (playerId) return;
    let cancelled = false;
    sessionApi
      .joinSession(code)
      .then((result) => {
        if (!cancelled) setPlayerId(result?.playerId ?? result?.id ?? null);
      })
      .catch(() => {
        // Ignore — the player will just miss the player-scoped
        // game-event topic until this resolves on a future render.
      });
    return () => {
      cancelled = true;
    };
  }, [code, playerId]);

  useSubscription(
    `/topic/session/${code}/state`,
    useCallback((msg) => {
      setPhase(normalizePhase(msg.phase));
      if (msg.gameType) setGameType(msg.gameType);
    }, []),
    [code],
  );

  useSubscription(
    `/topic/session/${code}/countdown`,
    useCallback((msg) => setCountdown(msg.seconds), []),
    [code],
  );

  useSubscription(
    `/topic/session/${code}/game-update`,
    useCallback((msg) => {
      setGameUpdate(msg);
      if (msg.gameType) setGameType(msg.gameType);
    }, []),
    [code],
  );

  useSubscription(
    `/topic/session/${code}/leaderboard`,
    useCallback((msg) => setLeaderboard(msg.rankings || []), []),
    [code],
  );

  useSubscription(
    `/topic/session/${code}/game-end`,
    useCallback(
      (msg) => {
        navigate(`/result/${code}`, { state: { results: msg, playerId } });
      },
      [code, navigate, playerId],
    ),
    [code, playerId],
  );

  // Only meaningful once playerId is known; before that it subscribes
  // to an inert placeholder topic that nothing publishes to.
  useSubscription(
    `/topic/session/${code}/player/${playerId || 'pending'}/game-event`,
    useCallback((msg) => setGameEvent(msg), []),
    [code, playerId],
  );

  const handleAction = useCallback(
    (action) => {
      if (!client || !connected) return;
      publish(client, `/app/game/${code}/action`, { ...action, timestamp: Date.now() });
    },
    [client, connected, code],
  );

  const self = useMemo(
    () => leaderboard.find((r) => r.playerId === playerId) || null,
    [leaderboard, playerId],
  );

  return (
    <div className="flex min-h-dvh flex-col bg-slate-950">
      <GameStatus phase={phase} gameType={gameType} />

      {phase === 'WAITING' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <LoadingSpinner />
          <p className="text-slate-400">Waiting for the host to start the game…</p>
          <p className="text-xs uppercase tracking-widest text-slate-600">Code: {code}</p>
        </div>
      ) : null}

      {phase === 'COUNTDOWN' ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <span className="text-8xl font-black text-white tabular-nums">{countdown ?? '…'}</span>
          <p className="mt-4 text-slate-400">Get ready!</p>
        </div>
      ) : null}

      {phase === 'PLAYING' ? (
        <>
          <div className="flex items-center justify-between px-6 py-3">
            <ScoreDisplay score={self?.score ?? 0} />
            <RankBadge rank={self?.rank} />
          </div>
          <div className="flex-1">
            <GameController
              gameType={gameType}
              onAction={handleAction}
              gameUpdateState={gameUpdate}
              gameEvent={gameEvent}
              playerId={playerId}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
