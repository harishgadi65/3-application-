import { useEffect, useState } from 'react';
import { sessionApi } from '../lib/api.js';
import { MOBILE_WEB_URL, tvDisplayLinkFor } from '../lib/env.js';
import { useToast } from '@smartad/shared-ui';

const STATUS_LABEL = {
  WAITING: 'Waiting for the test player to join',
  COUNTDOWN: 'Starting…',
  PLAYING: 'In progress',
  FINISHED: 'Test finished',
};

/**
 * Fully self-contained game preview: embeds the real tv-display app's
 * /display/:code view (ad zones + live game canvas, exempted from the TV
 * setup password gate - see DisplayCodeGate) alongside the real mobile-web
 * app auto-signed-in as a reusable "Preview Tester" account and dropped
 * straight into the game's own controls (see PreviewPlayerPage /
 * GameSelectPage's screen-less auto-start). No phone or screen required -
 * everything plays out live inside this modal, reusing the real rendering
 * and control code from both apps via iframes rather than duplicating it.
 */
export default function GamePreviewModal({ game, session, onClose }) {
  const toast = useToast();
  const [status, setStatus] = useState(session);
  const [ending, setEnding] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setStatus(session);
    if (!session || session.status === 'FINISHED') return undefined;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const fresh = await sessionApi.getSession(session.sessionCode);
        if (!cancelled) setStatus(fresh);
      } catch {
        // transient poll failure - keep showing the last known status
      }
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session]);

  if (!session) return null;

  async function handleEnd() {
    setEnding(true);
    try {
      await sessionApi.endSession(session.sessionCode);
      toast('Test session ended', { type: 'success' });
      onClose();
    } catch (err) {
      toast(err.message || 'Failed to end the test session', { type: 'error' });
    } finally {
      setEnding(false);
    }
  }

  function handleCopy() {
    navigator.clipboard?.writeText(session.sessionCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const isFinished = status?.status === 'FINISHED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Testing {game.displayName}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {STATUS_LABEL[status?.status] || status?.status}
              {status?.status === 'WAITING' && ` · ${status?.currentPlayerCount ?? 0} joined`}
            </p>
          </div>
          <button type="button" className="text-slate-400 hover:text-slate-600" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mx-auto flex w-full max-w-[320px] flex-col overflow-hidden rounded-2xl border border-slate-300 bg-slate-950 shadow-inner">
            <iframe
              key={`tv-${session.sessionCode}`}
              src={tvDisplayLinkFor(session.sessionCode)}
              title="Game view"
              className="aspect-square w-full border-0 bg-slate-950"
            />
            <iframe
              key={`player-${session.sessionCode}`}
              src={`${MOBILE_WEB_URL}/preview-player/${session.sessionCode}`}
              title="Game controls"
              className="h-[420px] w-full border-0 border-t border-slate-800 bg-slate-950"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 p-5">
          <p className="text-xs text-slate-400">
            Prefer a real phone instead? Sign in on the mobile web app, open{' '}
            <span className="font-medium text-slate-500">Join a Game</span>, and enter this code:
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-lg font-black tracking-[0.25em] text-slate-900">
              {session.sessionCode}
            </span>
            <button type="button" className="btn-secondary" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="btn-danger flex-1"
              onClick={handleEnd}
              disabled={ending || isFinished}
            >
              {ending ? 'Ending...' : 'End test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
