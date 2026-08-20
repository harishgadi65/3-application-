import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { sessionApi, authApi } from '@smartad/api-client';
import { LoadingSpinner, useToast } from '@smartad/shared-ui';
import WinnerBanner from '../components/WinnerBanner.jsx';
import RankBadge from '../components/RankBadge.jsx';
import RewardCard from '../components/RewardCard.jsx';
import { generateSharePoster, shareScorePoster, downloadScorePoster } from '../lib/scoreShareImage.js';

// Matches the TV winner screen's own countdown (see WinnerScreen.jsx) -
// Play Again only replays this session directly while the TV is still
// showing it; afterwards the player needs a fresh code (see handlePlayAgain).
const REPLAY_WINDOW_MS = 30_000;
const GAME_LABELS = {
  SNAKE: 'Snake',
  TAP_BLAST: 'Tap Blast Race',
  PLATFORM_DASH: 'Platform Dash',
  ROCK_PAPER_SCISSORS: 'Rock Paper Scissors',
};

function storageKey(code) {
  return `smartad_result_${code}`;
}

function loadStoredResult(code) {
  try {
    const raw = sessionStorage.getItem(storageKey(code));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeResult(code, payload) {
  try {
    sessionStorage.setItem(storageKey(code), JSON.stringify(payload));
  } catch {
    // best-effort only - a full/blocked sessionStorage just means no
    // refresh-recovery, the live page state still works fine.
  }
}

/** Dummy demo reward until the game-end message carries a real one. */
function rewardFor(rank, isWinner) {
  const points = isWinner ? 100 : Math.max(10, 50 - (rank ?? 5) * 5);
  return {
    points,
    offerTitle: isWinner ? '20% OFF your next visit' : null,
    provider: isWinner ? 'Smart Play Rewards' : null,
  };
}

export default function ResultPage() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const stored = useMemo(() => loadStoredResult(code), [code]);
  const [results, setResults] = useState(location.state?.results ?? stored?.results ?? null);
  const [gameType, setGameType] = useState(location.state?.gameType ?? stored?.gameType ?? null);
  const [loading, setLoading] = useState(!results);
  const [error, setError] = useState('');
  const [recordedAt] = useState(
    location.state?.results ? Date.now() : stored?.recordedAt ?? Date.now(),
  );
  const [restarting, setRestarting] = useState(false);
  const [sharing, setSharing] = useState(null);
  const playerId = location.state?.playerId ?? stored?.playerId ?? null;

  // Persist as soon as results are known, so refreshing this page (or
  // reopening it) restores the same result instead of losing it.
  useEffect(() => {
    if (results) storeResult(code, { results, playerId, gameType, recordedAt });
  }, [code, results, playerId, gameType, recordedAt]);

  useEffect(() => {
    if (results) return;
    let cancelled = false;
    setLoading(true);
    sessionApi
      .getResults(code)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load results');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code, results]);

  useEffect(() => {
    if (gameType) return;
    let cancelled = false;
    sessionApi
      .getSession(code)
      .then((data) => {
        if (!cancelled && data?.gameType) setGameType(data.gameType);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [code, gameType]);

  const rankings = results?.rankings || [];

  const self = useMemo(() => {
    if (playerId) {
      const byId = rankings.find((r) => r.playerId === playerId);
      if (byId) return byId;
    }
    // Fallback for a direct/refreshed load with no route state: match
    // on identity display name as a best effort.
    const identity = authApi.getIdentity?.();
    if (identity) {
      return (
        rankings.find(
          (r) => r.displayName === identity.displayName || r.displayName === identity.username,
        ) || null
      );
    }
    return null;
  }, [rankings, playerId]);

  const isWinner = self ? self.rank === 1 : false;
  const reward = rewardFor(self?.rank, isWinner);
  const gameLabel = GAME_LABELS[gameType] || gameType || 'Game Night';

  const sorted = useMemo(() => [...rankings].sort((a, b) => a.rank - b.rank), [rankings]);
  const topFive = sorted.slice(0, 5);
  const selfInTopFive = self ? topFive.some((r) => r.playerId === self.playerId) : true;

  async function handlePlayAgain() {
    if (restarting) return;
    if (Date.now() - recordedAt >= REPLAY_WINDOW_MS) {
      navigate('/join', { replace: true });
      return;
    }
    setRestarting(true);
    try {
      await sessionApi.replaySession(code);
      navigate(`/play/${code}`, { replace: true, state: { playerId } });
    } catch (err) {
      // The TV may already have moved on server-side too - fall back safely.
      toast(err.message || 'That replay window has closed - join a new game instead.', { type: 'error' });
      navigate('/join', { replace: true });
    } finally {
      setRestarting(false);
    }
  }

  async function withPoster(action, label) {
    if (sharing) return;
    setSharing(label);
    try {
      const blob = await generateSharePoster({
        gameLabel,
        displayName: self?.displayName,
        isWinner,
        rank: self?.rank,
        score: self?.score,
        offerTitle: reward.offerTitle,
      });
      await action(blob);
    } catch (err) {
      toast(err.message || 'Could not create the share image', { type: 'error' });
    } finally {
      setSharing(null);
    }
  }

  const shareText = 'I won. Your turn. Scan · Play · Win';
  const handleShareScore = () =>
    withPoster((blob) => shareScorePoster(blob, { title: 'Smart Play', text: shareText }), 'share');
  const handleWhatsApp = () =>
    withPoster(async (blob) => {
      toast('Choose WhatsApp, then tap "My Status" to post it.', { type: 'info' });
      await shareScorePoster(blob, { title: 'Smart Play', text: shareText });
    }, 'whatsapp');
  const handleInstagram = () =>
    withPoster(async (blob) => {
      toast('Choose Instagram, then tap "Your Story" to post it.', { type: 'info' });
      await shareScorePoster(blob, { title: 'Smart Play', text: shareText });
    }, 'instagram');
  const handleSavePoster = () => withPoster(async (blob) => downloadScorePoster(blob), 'save');

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
        <LoadingSpinner />
        <p className="text-slate-400">Loading results…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-red-400">{error}</p>
        <button type="button" className="btn-primary" onClick={() => navigate('/join')}>
          Back to Join
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col gap-5 px-6 pb-10 pt-[max(2rem,env(safe-area-inset-top))]">
      <WinnerBanner isWinner={isWinner} rank={self?.rank} displayName={self?.displayName} score={self?.score} />

      <div className="overflow-hidden rounded-2xl bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Final Standings</h2>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Top {topFive.length}
          </span>
        </div>
        <ul>
          {topFive.map((r) => (
            <li
              key={r.playerId}
              className={`flex items-center justify-between border-b border-slate-800 px-4 py-3 last:border-b-0 ${
                r.playerId === self?.playerId ? 'bg-emerald-500/10' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <RankBadge rank={r.rank} />
                <span className="font-medium text-white">
                  {r.displayName}
                  {r.playerId === self?.playerId && (
                    <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-300">
                      You
                    </span>
                  )}
                </span>
              </div>
              <span className="font-bold text-slate-200">{r.score}</span>
            </li>
          ))}
          {!selfInTopFive && self && (
            <li className="flex items-center justify-between border-t-2 border-dashed border-slate-700 bg-emerald-500/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <RankBadge rank={self.rank} />
                <span className="font-medium text-white">
                  {self.displayName}
                  <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-300">
                    Your rank
                  </span>
                </span>
              </div>
              <span className="font-bold text-slate-200">{self.score}</span>
            </li>
          )}
        </ul>
      </div>

      <RewardCard points={reward.points} offerTitle={reward.offerTitle} provider={reward.provider} />

      <div className="flex flex-col gap-3">
        <button type="button" className="btn-primary" onClick={handleShareScore} disabled={Boolean(sharing)}>
          {sharing === 'share' ? 'Preparing…' : 'Share Your Score →'}
        </button>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            className="rounded-xl bg-emerald-900/40 py-3 text-xs font-bold text-emerald-300 disabled:opacity-50"
            onClick={handleWhatsApp}
            disabled={Boolean(sharing)}
          >
            {sharing === 'whatsapp' ? '…' : 'WhatsApp Status'}
          </button>
          <button
            type="button"
            className="rounded-xl bg-fuchsia-900/40 py-3 text-xs font-bold text-fuchsia-300 disabled:opacity-50"
            onClick={handleInstagram}
            disabled={Boolean(sharing)}
          >
            {sharing === 'instagram' ? '…' : 'Instagram Story'}
          </button>
          <button
            type="button"
            className="rounded-xl bg-slate-800 py-3 text-xs font-bold text-slate-300 disabled:opacity-50"
            onClick={handleSavePoster}
            disabled={Boolean(sharing)}
          >
            {sharing === 'save' ? '…' : 'Save Poster'}
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-3">
        <button type="button" className="btn-primary" onClick={handlePlayAgain} disabled={restarting}>
          {restarting ? 'Restarting…' : '▶ Play Again'}
        </button>
        <button
          type="button"
          className="rounded-xl bg-slate-800 py-3.5 text-base font-bold text-slate-300"
          onClick={() => navigate('/join')}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
