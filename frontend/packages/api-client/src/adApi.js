import axiosClient from './axiosClient.js';

/**
 * @param {FormData} formData - expected fields: file, title, mediaType, position, displayOrder
 */
export async function uploadAd(formData) {
  return axiosClient.post('/ads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function listAds() {
  return axiosClient.get('/ads');
}

export async function listAllAds() {
  return axiosClient.get('/ads/all');
}

export async function deleteAd(id) {
  return axiosClient.delete(`/ads/${id}`);
}

export async function updateAd(id, payload) {
  return axiosClient.put(`/ads/${id}`, null, { params: payload });
}

export async function listAdsTrash() {
  return axiosClient.get('/ads/trash');
}

export async function restoreAd(id) {
  return axiosClient.post(`/ads/${id}/restore`);
}

export async function permanentlyDeleteAd(id) {
  return axiosClient.delete(`/ads/${id}/permanent`);
}

/** Trashes every active ad belonging to one client at once. */
export async function deleteAdsByClient(clientName) {
  return axiosClient.delete('/ads/by-client', { params: { clientName } });
}
