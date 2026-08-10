import axiosClient from './axiosClient.js';

// Public lookup - a real TV device resolves its own config by display code.
export async function getScreenByCode(displayCode) {
  return axiosClient.get(`/screens/by-code/${displayCode}`);
}

/** Absolute URL for a screen's idle QR code image - use directly as an <img src>. */
export function getScreenQrUrl(displayCode) {
  const baseURL = axiosClient.defaults.baseURL || '';
  return `${baseURL}/screens/by-code/${displayCode}/qr`;
}

/** The session currently running on this screen (if any) - what the TV polls to know when to hand off. */
export async function getActiveSessionForScreen(displayCode) {
  return axiosClient.get(`/screens/by-code/${displayCode}/active-session`);
}

/** Player-triggered: joins (or starts, if none pending yet) the session for this screen. */
export async function joinScreenSession(displayCode) {
  return axiosClient.post(`/screens/by-code/${displayCode}/join`);
}

/** TV-triggered (no player yet): makes sure a pending session exists so a real join code can be shown beside the QR. */
export async function ensureScreenSession(displayCode) {
  return axiosClient.post(`/screens/by-code/${displayCode}/ensure-session`);
}

/** One-time TV setup gate - checks the shared device password and the display code together. */
export async function verifyTvSetup(displayCode, password) {
  return axiosClient.post('/screens/tv-setup', { displayCode, password });
}

// Admin-only screen + group management.
export async function listScreens() {
  return axiosClient.get('/admin/screens');
}

export async function createScreen(payload) {
  return axiosClient.post('/admin/screens', payload);
}

export async function updateScreen(id, payload) {
  return axiosClient.put(`/admin/screens/${id}`, payload);
}

export async function deleteScreen(id) {
  return axiosClient.delete(`/admin/screens/${id}`);
}

export async function listScreenGroups() {
  return axiosClient.get('/admin/screen-groups');
}

export async function createScreenGroup(name) {
  return axiosClient.post('/admin/screen-groups', { name });
}

export async function renameScreenGroup(id, name) {
  return axiosClient.put(`/admin/screen-groups/${id}`, { name });
}
