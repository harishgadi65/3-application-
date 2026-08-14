import axiosClient from './axiosClient.js';

const TOKEN_KEY = 'smartad_token';
const IDENTITY_KEY = 'smartad_identity';
const ROLE_KEY = 'smartad_role';

/** identifier is a mobile number, email, or (legacy) username. */
export async function login({ identifier, password }) {
  return axiosClient.post('/auth/login', { identifier, password });
}

export async function register({ displayName, email, mobile, age, password }) {
  return axiosClient.post('/auth/register', {
    displayName,
    email,
    mobile,
    age,
    password,
  });
}

export async function adminLogin({ username, password }) {
  return axiosClient.post('/auth/admin/login', { username, password });
}

/** No-password guest identity for self-service scan-to-play - mobile number is the account key. */
export async function guestJoin({ mobile, email, age }) {
  return axiosClient.post('/auth/guest', { mobile, email, age });
}

/**
 * Persists an auth response ({ token, tokenType, user | admin }) to
 * localStorage so subsequent requests are authenticated.
 * @param {{token: string, tokenType?: string, user?: object, admin?: object}} authResponse
 * @param {'USER'|'ADMIN'} role
 */
export function setSession(authResponse, role) {
  if (!authResponse) return;
  const identity =
    role === 'ADMIN' ? authResponse.admin : authResponse.user;

  localStorage.setItem(TOKEN_KEY, authResponse.token);
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity || null));
  localStorage.setItem(ROLE_KEY, role);
}

export function getIdentity() {
  const raw = localStorage.getItem(IDENTITY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(IDENTITY_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}
