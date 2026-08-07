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
