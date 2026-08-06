// Centralized resolution of Vite-exposed environment variables, with the
// sane localhost defaults documented for this proof-of-concept platform.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

export const TV_DISPLAY_URL =
  import.meta.env.VITE_TV_DISPLAY_URL || 'http://localhost:5173';

export const MOBILE_WEB_URL =
  import.meta.env.VITE_MOBILE_WEB_URL || 'http://localhost:5174';

export function tvDisplayLinkFor(code) {
  return `${TV_DISPLAY_URL}/display/${code}`;
}
