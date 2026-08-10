export { default as axiosClient } from './axiosClient.js';

import * as authApi from './authApi.js';
import * as sessionApi from './sessionApi.js';
import * as gameApi from './gameApi.js';
import * as adApi from './adApi.js';
import * as playerApi from './playerApi.js';
import * as screenApi from './screenApi.js';

export * from './authApi.js';
export * from './sessionApi.js';
export * from './gameApi.js';
export * from './adApi.js';
export * from './playerApi.js';
export * from './screenApi.js';

// Namespaced re-exports (authApi.login(...), sessionApi.createSession(...), etc.)
// alongside the flat named exports above — both styles are supported.
export { authApi, sessionApi, gameApi, adApi, playerApi, screenApi };
