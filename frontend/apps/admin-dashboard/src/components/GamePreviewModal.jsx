import { useEffect, useState } from 'react';
import { sessionApi } from '../lib/api.js';
import { tvDisplayLinkFor } from '../lib/env.js';
import { useToast } from '@smartad/shared-ui';
import PreviewGameController from './PreviewGameController.jsx';
import ScaledFrame from './ScaledFrame.jsx';

const STATUS_LABEL = {
  WAITING: 'Waiting for the test player to join',
  COUNTDOWN: 'Starting…',
  PLAYING: 'In progress',
  FINISHED: 'Test finished',
};

/**
 * Fully self-contained game preview: embeds the real tv-display app's
 * /display/:code view (ad zones + live game canvas, exempted from the TV
 * setup password gate - see DisplayCodeGate) alongside a plain generic
 * control panel (PreviewGameController) that drives the same "Preview
 * Tester" account directly over its own REST/WebSocket calls - this is
 * for testing how the game performs, not for exercising the real
 * mobile-web app's UI, so it deliberately doesn't embed that app at all.
 */
export default function GamePreviewModal({ game, session, onClose, onRepeat }) {
  const toast = useToast();
  const [status, setStatus] = useState(session);
  const [ending, setEnding] = useState(false);
  const [repeating, setRepeating] = useState(false);
  const [maximized, setMaximized] = useState(true);

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

  async function handleRepeat() {
    if (repeating) return;
    setRepeating(true);
    try {
      await onRepeat();
    } catch (err) {
      toast(err.message || 'Failed to restart the test', { type: 'error' });
    } finally {
      setRepeating(false);
    }
  }

  const isFinished = status?.status === 'FINISHED';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 ${
        maximized ? 'p-0' : 'p-4'
      }`}
    >
      <div
        className={`flex flex-col overflow-hidden bg-white shadow-xl ${
          maximized ? 'h-screen w-screen rounded-none' : 'h-[88vh] w-full max-w-6xl rounded-xl'
        }`}
      >
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Testing {game.displayName}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {STATUS_LABEL[status?.status] || status?.status}
              {status?.status === 'WAITING' && ` · ${status?.currentPlayerCount ?? 0} joined`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600"
              title={maximized ? 'Minimize' : 'Maximize'}
              onClick={() => setMaximized((m) => !m)}
            >
              {maximized ? '🗗' : '🗖'}
            </button>
            <button type="button" className="text-slate-400 hover:text-slate-600" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 p-5">
          <div
            className={`mx-auto flex h-full w-full flex-row overflow-hidden rounded-2xl border border-slate-300 bg-slate-950 shadow-inner ${
              maximized ? 'max-w-none' : 'max-w-6xl'
            }`}
          >
            {/* Always side-by-side (never stacked) - two fixed-height panes
            stacked vertically add up to more than the modal's own height,
            which forces a scroll that clips content top and bottom. */}
            <ScaledFrame
              key={`tv-${session.sessionCode}`}
              src={tvDisplayLinkFor(session.sessionCode)}
              title="Game view"
              className="h-full flex-1"
            />
            <div className="h-full w-[360px] flex-shrink-0 border-l border-slate-800">
              <PreviewGameController
                key={session.sessionCode}
                sessionCode={session.sessionCode}
                gameType={game.gameType}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 p-5">
          <div className="flex gap-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={handleRepeat}
              disabled={repeating || ending}
            >
              {repeating ? 'Restarting…' : '↻ Repeat'}
            </button>
            <button
              type="button"
              className="btn-danger flex-1"
              onClick={handleEnd}
              disabled={ending || repeating || isFinished}
            >
              {ending ? 'Ending...' : 'End test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
