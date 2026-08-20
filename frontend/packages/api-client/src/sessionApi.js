import axiosClient from './axiosClient.js';

function normalizeSession(session) {
  if (!session || typeof session !== 'object') return session;

  return {
    ...session,
    code: session.code ?? session.sessionCode,
    phase: session.phase ?? session.status,
    playerCount: session.playerCount ?? session.currentPlayerCount,
  };
}

export async function createSession({ gameType, maxPlayers, gameDurationSeconds }) {
  const session = await axiosClient.post('/sessions', {
    gameType,
    maxPlayers,
    gameDurationSeconds,
  });
  return normalizeSession(session);
}

export async function getSession(code) {
  const session = await axiosClient.get(`/sessions/${code}`);
  return normalizeSession(session);
}

export async function startSession(code) {
  return axiosClient.post(`/sessions/${code}/start`);
}

export async function endSession(code) {
  return axiosClient.post(`/sessions/${code}/end`);
}

export async function listActiveSessions() {
  const sessions = await axiosClient.get('/sessions/active');
  return Array.isArray(sessions) ? sessions.map(normalizeSession) : [];
}

/**
 * Returns the absolute URL for a session's QR code image.
 * Intended for direct use in <img src={getSessionQrUrl(code)} />.
 */
export function getSessionQrUrl(code) {
  const baseURL = axiosClient.defaults.baseURL || '';
  return `${baseURL}/sessions/${code}/qr`;
}

export async function joinSession(code, payload = {}) {
  return axiosClient.post(`/sessions/${code}/join`, payload);
}

export async function selectGame(code, gameType) {
  const session = await axiosClient.post(`/sessions/${code}/select-game`, { gameType });
  return normalizeSession(session);
}

export async function replaySession(code) {
  const session = await axiosClient.post(`/sessions/${code}/replay`);
  return normalizeSession(session);
}

/** Rock Paper Scissors only: 'SOLO' starts immediately vs the computer;
 * 'MULTIPLAYER' just records the choice and waits for a second player. */
export async function setRpsMode(code, mode) {
  const session = await axiosClient.post(`/sessions/${code}/rps-mode`, { mode });
  return normalizeSession(session);
}

export async function getRpsMode(code) {
  const result = await axiosClient.get(`/sessions/${code}/rps-mode`);
  return result?.mode || null;
}

export async function listPlayers(code) {
  return axiosClient.get(`/sessions/${code}/players`);
}

export async function getLeaderboard(code) {
  return axiosClient.get(`/sessions/${code}/leaderboard`);
}

export async function getResults(code) {
  return axiosClient.get(`/sessions/${code}/results`);
}
