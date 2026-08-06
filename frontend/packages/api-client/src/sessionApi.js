import axiosClient from './axiosClient.js';

export async function createSession({ gameType, maxPlayers, gameDurationSeconds }) {
  return axiosClient.post('/sessions', {
    gameType,
    maxPlayers,
    gameDurationSeconds,
  });
}

export async function getSession(code) {
  return axiosClient.get(`/sessions/${code}`);
}

export async function startSession(code) {
  return axiosClient.post(`/sessions/${code}/start`);
}

export async function endSession(code) {
  return axiosClient.post(`/sessions/${code}/end`);
}

export async function listActiveSessions() {
  return axiosClient.get('/sessions/active');
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

export async function listPlayers(code) {
  return axiosClient.get(`/sessions/${code}/players`);
}

export async function getLeaderboard(code) {
  return axiosClient.get(`/sessions/${code}/leaderboard`);
}

export async function getResults(code) {
  return axiosClient.get(`/sessions/${code}/results`);
}
