import axiosClient from './axiosClient.js';

export async function listGames() {
  const response = await axiosClient.get('/games');

  // The games endpoint returns a GameListResponse ({ games: [...] }) inside
  // the standard API envelope, while callers consume a list directly.
  // Keep that transport detail inside the API client.
  if (Array.isArray(response)) return response;
  return Array.isArray(response?.games) ? response.games : [];
}

export async function getGameConfig(type) {
  return axiosClient.get(`/games/${type}/config`);
}

// Admin-only catalog management (metadata: name/icon/description/defaults/
// active flag) - does not create or remove an actual playable game, see
// backend GameCatalogService for why.
export async function listGameCatalog() {
  return axiosClient.get('/admin/games');
}

/**
 * @param {FormData} formData - expected fields: gameType, displayName,
 * description, defaultMaxPlayers, defaultDurationSeconds, icon (optional file)
 */
export async function createGame(formData) {
  return axiosClient.post('/admin/games', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * @param {string} gameType
 * @param {FormData} formData - expected fields: displayName, description,
 * defaultMaxPlayers, defaultDurationSeconds, isActive, icon (optional file)
 */
export async function updateGame(gameType, formData) {
  return axiosClient.put(`/admin/games/${gameType}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/** Moves a catalog entry to the trash (soft delete) rather than removing it outright. */
export async function deleteGame(gameType) {
  return axiosClient.delete(`/admin/games/${gameType}`);
}

export async function listGameTrash() {
  return axiosClient.get('/admin/games/trash');
}

export async function restoreGame(gameType) {
  return axiosClient.post(`/admin/games/${gameType}/restore`);
}

export async function permanentlyDeleteGame(gameType) {
  return axiosClient.delete(`/admin/games/${gameType}/permanent`);
}

/**
 * Attaches a game package (e.g. a zip built outside this app) to an
 * existing catalog entry. Storage only - see backend GameCatalogService for
 * why this doesn't make the game playable by itself.
 * @param {string} gameType
 * @param {File} file
 */
export async function uploadGamePackage(gameType, file) {
  const formData = new FormData();
  formData.append('package', file);
  return axiosClient.post(`/admin/games/${gameType}/package`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
