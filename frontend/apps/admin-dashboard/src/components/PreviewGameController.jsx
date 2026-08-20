import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { API_BASE_URL, WS_URL } from '../lib/env.js';

const TESTER_MOBILE = 'preview-tester';
const TESTER_PASSWORD = 'preview-tester-pass-1';
const TESTER_PROFILE = {
  displayName: 'Preview Tester',
  email: 'preview.tester@smartad.local',
  mobile: TESTER_MOBILE,
  age: 99,
  password: TESTER_PASSWORD,
};

const GAME_LABELS = {
  TAP_BLAST: 'TAP BLAST',
  SNAKE: 'SNAKE',
  PLATFORM_DASH: 'PLATFORM DASH',
  ROCK_PAPER_SCISSORS: 'ROCK PAPER SCISSORS',
};

const RPS_CHOICES = [
  { value: 'ROCK', emoji: '🪨' },
  { value: 'PAPER', emoji: '✋' },
  { value: 'SCISSORS', emoji: '✂️' },
];

/**
 * Talks to the backend directly as the same reusable "Preview Tester"
 * account PreviewPlayerPage used to use inside a mobile-web iframe - but
 * through its own fetch calls and its own @stomp/stompjs client, never the
 * admin dashboard's shared axiosClient/StompProvider (both of which read
 * the ADMIN's own token from localStorage). Keeping the tester's token
 * in-memory only means this can never clobber the logged-in admin's
 * session, regardless of what else the dashboard is doing concurrently.
 */
async function postJson(path, body, token) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.success === false) {
    throw new Error((json && json.message) || `Request failed (${res.status})`);
  }
  return json.data;
}

async function ensureTesterToken() {
  try {
    const data = await postJson('/auth/register', TESTER_PROFILE);
    return data.token;
  } catch {
    const data = await postJson('/auth/login', { identifier: TESTER_MOBILE, password: TESTER_PASSWORD });
    return data.token;
  }
}

export default function PreviewGameController({ sessionCode, gameType }) {
  const [status, setStatus] = useState('connecting'); // connecting | ready | error
  const [error, setError] = useState(null);
  const clientRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const token = await ensureTesterToken();
        if (cancelled) return;

        await postJson(`/sessions/${sessionCode}/join`, {}, token).catch(() => {});
        if (cancelled) return;
        await postJson(`/sessions/${sessionCode}/select-game`, { gameType }, token).catch(() => {});
        if (cancelled) return;

        const client = new Client({
          brokerURL: WS_URL,
          reconnectDelay: 3000,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          connectHeaders: { Authorization: `Bearer ${token}` },
          onConnect: () => !cancelled && setStatus('ready'),
          onDisconnect: () => !cancelled && setStatus('connecting'),
          onWebSocketClose: () => !cancelled && setStatus('connecting'),
          onStompError: () => !cancelled && setStatus('error'),
        });
        clientRef.current = client;
        client.activate();
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not connect the test controller');
          setStatus('error');
        }
      }
    }

    run();
    return () => {
      cancelled = true;
      clientRef.current?.deactivate();
      clientRef.current = null;
    };
  }, [sessionCode, gameType]);

  function sendAction(type, data = {}) {
    const client = clientRef.current;
    if (!client || !client.connected) return;
    client.publish({
      destination: `/app/game/${sessionCode}/action`,
      body: JSON.stringify({ type, data, timestamp: Date.now() }),
    });
  }

  const ready = status === 'ready';

  return (
    <div className="flex h-full w-full flex-col bg-slate-950 text-white">
      <div
        className={`border-b border-slate-800 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide ${
          status === 'error' ? 'text-red-400' : 'text-emerald-400'
        }`}
      >
        {status === 'ready' ? 'Live connection OK' : status === 'error' ? 'Connection error' : 'Connecting…'}
      </div>
      <div className="bg-emerald-600/90 px-4 py-2 text-center text-sm font-bold uppercase tracking-wide">
        Game on! · {GAME_LABELS[gameType] || gameType}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
        {status === 'error' ? (
          <p className="text-center text-sm text-red-400">{error}</p>
        ) : gameType === 'SNAKE' ? (
          <div className="grid grid-cols-3 grid-rows-3 gap-3">
            <div />
            <ControlButton label="↑" disabled={!ready} onClick={() => sendAction('DIRECTION', { direction: 'UP' })} />
            <div />
            <ControlButton
              label="←"
              disabled={!ready}
              onClick={() => sendAction('DIRECTION', { direction: 'LEFT' })}
            />
            <div />
            <ControlButton
              label="→"
              disabled={!ready}
              onClick={() => sendAction('DIRECTION', { direction: 'RIGHT' })}
            />
            <div />
            <ControlButton
              label="↓"
              disabled={!ready}
              onClick={() => sendAction('DIRECTION', { direction: 'DOWN' })}
            />
            <div />
          </div>
        ) : gameType === 'PLATFORM_DASH' ? (
          <ControlButton big label="JUMP" disabled={!ready} onClick={() => sendAction('JUMP')} />
        ) : gameType === 'ROCK_PAPER_SCISSORS' ? (
          <div className="grid grid-cols-3 gap-3">
            {RPS_CHOICES.map((choice) => (
              <button
                key={choice.value}
                type="button"
                disabled={!ready}
                onClick={() => sendAction('CHOOSE', { choice: choice.value })}
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-b from-orange-400 to-orange-600 text-4xl shadow-lg transition active:scale-95 disabled:opacity-40"
              >
                {choice.emoji}
              </button>
            ))}
          </div>
        ) : (
          <ControlButton big label="TAP!" disabled={!ready} onClick={() => sendAction('TAP')} />
        )}
        <p className="text-xs text-slate-500">Playing as Preview Tester</p>
      </div>
    </div>
  );
}

function ControlButton({ label, onClick, disabled, big = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl bg-gradient-to-b from-orange-400 to-orange-600 font-black text-white shadow-lg transition active:scale-95 disabled:opacity-40 ${
        big ? 'h-28 w-full max-w-xs text-3xl' : 'h-16 w-16 text-2xl'
      }`}
    >
      {label}
    </button>
  );
}
