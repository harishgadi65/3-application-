import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sessionApi } from '@smartad/api-client';
import { useStomp, useSubscription } from '@smartad/websocket';
import { LoadingSpinner } from '@smartad/shared-ui';
import ScreenLayout from '../components/ScreenLayout.jsx';
import WaitingRoom from '../components/WaitingRoom.jsx';
import Countdown from '../components/Countdown.jsx';
import GameArea from '../components/GameArea.jsx';
import WinnerScreen from '../components/WinnerScreen.jsx';
import StartupDisplay from '../components/StartupDisplay.jsx';
import useAdRotation from '../hooks/useAdRotation.js';

const FLASH_LIFETIME_MS = 1000;
const GOOD_RESULT_VALUES = ['GOOD', 'SUCCESS', 'POSITIVE', 'HIT', 'PERFECT'];
const normalizePhase = (value) => value === 'RUNNING' ? 'PLAYING' : value === 'ENDED' ? 'FINISHED' : value;

/**
 * The main TV view at /display/:sessionCode. Fetches the session once on
 * mount to seed initial state, then drives every phase transition purely
 * off the real-time WebSocket topics. This component renders state - it
 * never computes or mutates game state itself.
 */
export default function TVDisplayPage() {
  const { sessionCode: code } = useParams();
  const navigate = useNavigate();
  const { client, connected } = useStomp();
  const { currentAdByPosition, startupAd } = useAdRotation();
  const returnToIdle = useCallback(() => navigate('/', { replace: true }), [navigate]);

  const [session, setSession] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [phase, setPhase] = useState('WAITING');
  const [gameType, setGameType] = useState(null);
  const [players, setPlayers] = useState([]);
  const [countdownSeconds, setCountdownSeconds] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [gameEnd, setGameEnd] = useState(null);
  const [reactionFlashes, setReactionFlashes] = useState({});

  // --- Initial REST fetch: seeds phase/gameType/players/leaderboard before
  // the first WebSocket message arrives. ---
  useEffect(() => {
    let cancelled = false;
    setSession(null);
    setLoadError(null);

    sessionApi
      .getSession(code)
      .then((data) => {
        if (cancelled) return;
        setSession(data);
        if (data?.phase) setPhase(normalizePhase(data.phase));
        if (data?.gameType) setGameType(data.gameType);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('TVDisplayPage: failed to load session', err);
        setLoadError(err.message || 'Failed to load session');
      });

    sessionApi
      .listPlayers(code)
      .then((list) => {
        if (!cancelled && Array.isArray(list)) setPlayers(list);
      })
      .catch((err) => console.error('TVDisplayPage: failed to load players', err));

    sessionApi
      .getLeaderboard(code)
      .then((data) => {
        if (!cancelled && Array.isArray(data?.rankings)) setRankings(data.rankings);
      })
      .catch((err) => console.error('TVDisplayPage: failed to load leaderboard', err));

    return () => {
      cancelled = true;
    };
  }, [code]);

  // --- Real-time subscriptions: these drive every phase transition. ---
  useSubscription(
    `/topic/session/${code}/state`,
    (msg) => {
      if (msg?.phase) setPhase(normalizePhase(msg.phase));
      if (msg?.gameType) setGameType(msg.gameType);
    },
    [code]
  );

  useSubscription(
    `/topic/session/${code}/players`,
    (msg) => {
      if (Array.isArray(msg?.players)) setPlayers(msg.players);
    },
    [code]
  );

  useSubscription(
    `/topic/session/${code}/countdown`,
    (msg) => {
      if (typeof msg?.seconds === 'number') setCountdownSeconds(msg.seconds);
    },
    [code]
  );

  useSubscription(
    `/topic/session/${code}/game-update`,
    (msg) => {
      if (msg?.gameType) setGameType(msg.gameType);
      if (msg?.state) setGameState(msg.state);
    },
    [code]
  );

  useSubscription(
    `/topic/session/${code}/leaderboard`,
    (msg) => {
      if (Array.isArray(msg?.rankings)) setRankings(msg.rankings);
    },
    [code]
  );

  useSubscription(
    `/topic/session/${code}/game-end`,
    (msg) => {
      setGameEnd(msg);
      if (Array.isArray(msg?.rankings)) setRankings(msg.rankings);
      setPhase('FINISHED');
    },
    [code]
  );

  // --- Optional per-player subscriptions for TAP_BLAST reaction flashes.
  // The roster size varies, so this can't use the fixed-destination
  // useSubscription hook - it manages raw client subscriptions instead. ---
  const playerIdsKey = useMemo(() => players.map((p) => p.id).join(','), [players]);

  useEffect(() => {
    if (!client || !connected || gameType !== 'TAP_BLAST' || phase !== 'PLAYING') {
      return undefined;
    }

    const ids = playerIdsKey ? playerIdsKey.split(',').filter(Boolean) : [];
    const subscriptions = ids.map((playerId) =>
      client.subscribe(`/topic/session/${code}/player/${playerId}/game-event`, (message) => {
        let event;
        try {
          event = JSON.parse(message.body);
        } catch (err) {
          console.error('TVDisplayPage: failed to parse game-event', err);
          return;
        }

        if (event?.type !== 'REACTION_FLASH') return;

        const result = String(event.data?.result || event.data?.type || '').toUpperCase();
        const isGood = GOOD_RESULT_VALUES.includes(result);
        const flashKey = Date.now();

        setReactionFlashes((prev) => ({
          ...prev,
          [playerId]: { type: isGood ? 'good' : 'bad', key: flashKey },
        }));

        setTimeout(() => {
          setReactionFlashes((prev) => {
            if (prev[playerId]?.key !== flashKey) return prev;
            const next = { ...prev };
            delete next[playerId];
            return next;
          });
        }, FLASH_LIFETIME_MS);
      })
    );

    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  }, [client, connected, gameType, phase, playerIdsKey, code]);

  const gameTypeLabel = gameType || session?.gameType || null;
  const screenGames = useMemo(
    () => (session?.screenGames || []).map((g) => ({ type: g.gameType, label: g.displayName })),
    [session]
  );

  let content;
  if (!session && !loadError) {
    content = (
      <div className="w-full h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  } else if (loadError) {
    content = (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center px-12">
        <p className="text-5xl font-black text-red-400">Session not found</p>
        <p className="text-2xl text-slate-400">{loadError}</p>
      </div>
    );
  } else if (phase === 'COUNTDOWN') {
    content = <Countdown seconds={countdownSeconds ?? 5} />;
  } else if (phase === 'PLAYING') {
    content = (
      <GameArea
        gameType={gameTypeLabel}
        gameState={gameState}
        rankings={rankings}
        reactionFlashes={reactionFlashes}
      />
    );
  } else if (phase === 'FINISHED') {
    content = (
      <WinnerScreen
        winner={gameEnd?.winner}
        rankings={gameEnd?.rankings || rankings}
        stats={gameEnd?.stats}
        onComplete={returnToIdle}
      />
    );
  } else {
    // CREATED / WAITING / CANCELLED all render as the waiting room.
    content = <WaitingRoom code={code} gameType={gameTypeLabel} players={players} games={screenGames} />;
  }

  const isWaiting = !loadError && session && !['COUNTDOWN', 'PLAYING', 'FINISHED'].includes(phase);
  if (isWaiting && players.length === 0) {
    return <StartupDisplay ad={startupAd} code={code} gameType={gameTypeLabel} />;
  }

  return <ScreenLayout currentAdByPosition={currentAdByPosition}>{content}</ScreenLayout>;
}
