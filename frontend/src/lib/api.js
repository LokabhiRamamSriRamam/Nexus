/**
 * Backend API base URL.
 *
 * Web dev:  Vite proxy rewrites /api → http://localhost:5000 so BASE stays ''
 * Web prod: Same origin serves both frontend and /api, so BASE stays ''
 * Native:   Set VITE_API_BASE=https://your-backend.com in .env.production
 *           or run:  VITE_API_BASE=http://192.168.x.x:5000 npm run build
 */
export const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export function apiFetch(path, options) {
  return fetch(`${API_BASE}${path}`, options)
}
