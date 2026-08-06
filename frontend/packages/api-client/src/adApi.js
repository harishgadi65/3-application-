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

export async function deleteAd(id) {
  return axiosClient.delete(`/ads/${id}`);
}

export async function updateAd(id, payload) {
  return axiosClient.put(`/ads/${id}`, payload);
}
