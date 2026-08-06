import axiosClient from './axiosClient.js';

export async function listGames() {
  return axiosClient.get('/games');
}

export async function getGameConfig(type) {
  return axiosClient.get(`/games/${type}/config`);
}
