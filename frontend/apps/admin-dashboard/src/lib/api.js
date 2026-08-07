// @smartad/api-client currently re-exports every REST helper as a flat,
// ungrouped set of named exports (see packages/api-client/src/index.js:
// `export * from './authApi.js'` etc.), rather than as the `authApi` /
// `sessionApi` / `gameApi` / `adApi` namespace objects this app is written
// against. This adapter groups them locally so the rest of the admin
// dashboard can call `authApi.adminLogin(...)`, `sessionApi.createSession(...)`
// etc. as documented, without reaching outside this app's directory to
// change the shared package. If @smartad/api-client later starts exporting
// those namespaces directly, this file can be deleted and imports switched
// back to the package.
import * as apiClient from '@smartad/api-client';

export const authApi = {
  login: apiClient.login,
  register: apiClient.register,
  adminLogin: apiClient.adminLogin,
  setSession: apiClient.setSession,
  getIdentity: apiClient.getIdentity,
  getRole: apiClient.getRole,
  getToken: apiClient.getToken,
  logout: apiClient.logout,
  isAuthenticated: apiClient.isAuthenticated,
};

export const sessionApi = {
  createSession: apiClient.createSession,
  getSession: apiClient.getSession,
  startSession: apiClient.startSession,
  endSession: apiClient.endSession,
  listActiveSessions: apiClient.listActiveSessions,
  getSessionQrUrl: apiClient.getSessionQrUrl,
  joinSession: apiClient.joinSession,
  listPlayers: apiClient.listPlayers,
  getLeaderboard: apiClient.getLeaderboard,
  getResults: apiClient.getResults,
};

export const gameApi = {
  listGames: apiClient.listGames,
  getGameConfig: apiClient.getGameConfig,
};

export const adApi = {
  uploadAd: apiClient.uploadAd,
  listAds: apiClient.listAds,
  listAllAds: apiClient.listAllAds,
  deleteAd: apiClient.deleteAd,
  updateAd: apiClient.updateAd,
};

export const playerApi = {
  getMyHistory: apiClient.getMyHistory,
};
