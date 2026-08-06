import axiosClient from './axiosClient.js';

export async function getMyHistory() {
  return axiosClient.get('/players/me/history');
}
