import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { sessionApi } from '../lib/api.js';
import { useStomp, useSubscription } from '@smartad/websocket';
import { LoadingSpinner, useToast } from '@smartad/shared-ui';
import PlayerTable from '../components/PlayerTable.jsx';
import ScoreTable from '../components/ScoreTable.jsx';
import GameControls from '../components/GameControls.jsx';
import { tvDisplayLinkFor } from '../lib/env.js';
import { copyToClipboard, phaseBadgeClass } from '../lib/format.js';

export default function SessionDetailPage() {
  const { code } = useParams();
  const toast = useToast();
  const { connected } = useStomp();

  const [session, setSession] = useState(null);
  const [phase, setPhase] = useState(null);
  const [players, setPlayers] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [gameEnd, setGameEnd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await sessionApi.getSession(code);
      setSession(data);
      setPhase(data.phase);

      const [playerList, leaderboard] = await Promise.all([
        sessionApi.listPlayers(code).catch(() => null),
        sessionApi.getLeaderboard(code).catch(() => null),
      ]);
      if (playerList) setPlayers(playerList.players || playerList || []);
      if (leaderboard) setRankings(leaderboard.rankings || leaderboard || []);
    } catch (err) {
      setError(err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // --- Live updates over STOMP -------------------------------------------

  useSubscription(
    `/topic/session/${code}/players`,
    (data) => {
      setPlayers(data.players || []);
    },
    [code]
  );

  useSubscription(
    `/topic/session/${code}/state`,
    (data) => {
      setPhase(data.phase);
      setSession((prev) => (prev ? { ...prev, ...data } : prev));
    },
    [code]
  );

  useSubscription(
    `/topic/session/${code}/leaderboard`,
    (data) => {
      setRankings(data.rankings || []);
    },
    [code]
  );

  useSubscription(
    `/topic/session/${code}/game-end`,
    (data) => {
      setGameEnd(data);
      setPhase('FINISHED');
      if (data.rankings) setRankings(data.rankings);
      toast('Game finished', { type: 'info' });
    },
    [code]
  );

  async function handleCopyTvLink() {
    try {
      await copyToClipboard(tvDisplayLinkFor(code));
      toast('TV display link copied', { type: 'success' });
    } catch {
      toast('Could not copy link', { type: 'error' });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-4">
        <Link to="/sessions" className="text-sm text-indigo-600 hover:text-indigo-500">
          &larr; Back to sessions
        </Link>
        <p className="text-sm text-rose-600">{error || 'Session not found'}</p>
      </div>
    );
  }

  const effectivePhase = phase || session.phase;
  const tvLink = tvDisplayLinkFor(code);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/sessions" className="text-sm text-indigo-600 hover:text-indigo-500">
          &larr; Back to sessions
        </Link>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          />
          {connected ? 'Live updates connected' : 'Connecting...'}
        </div>
      </div>

      {effectivePhase === 'FINISHED' && gameEnd && (
        <div className="card border-2 border-indigo-200 bg-indigo-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
            Final results
          </p>
          <p className="mt-1 text-xl font-bold text-indigo-900">
            {gameEnd.winner?.displayName
              ? `${gameEnd.winner.displayName} wins!`
              : 'Game finished'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <p className="label">Session code</p>
          <p className="font-mono text-4xl font-bold text-slate-900">
            {session.code}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span className="badge-indigo">{session.gameType}</span>
            <span className={phaseBadgeClass(effectivePhase)}>
              {effectivePhase}
            </span>
          </div>

          <div className="mt-4 flex justify-center rounded-md bg-slate-50 p-4">
            <img
              src={sessionApi.getSessionQrUrl(code)}
              alt={`QR code for session ${code}`}
              className="h-40 w-40"
            />
          </div>

          <div className="mt-4">
            <p className="label">Open TV display</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                className="input truncate font-mono text-xs"
                value={tvLink}
              />
              <button type="button" className="btn-secondary" onClick={handleCopyTvLink}>
                Copy
              </button>
            </div>
            <a
              href={tvLink}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-500"
            >
              Open in new tab &rarr;
            </a>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <GameControls
            code={code}
            phase={effectivePhase}
            playerCount={players.length}
          />
          <PlayerTable players={players} />
          <ScoreTable rankings={rankings} />
        </div>
      </div>
    </div>
  );
}
