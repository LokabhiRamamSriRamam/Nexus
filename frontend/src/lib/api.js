/**
 * Backend API base URL.
 *
 * Dev:  Vite proxy rewrites /api → http://localhost:5000, so BASE is ''
 * Prod: Points to the deployed Vercel backend
 */
const isDev = import.meta.env.DEV
const PROD_BACKEND = 'https://nexus-tau-lemon.vercel.app'

export const API_BASE = import.meta.env.VITE_API_BASE ?? (isDev ? '' : PROD_BACKEND)

export function apiFetch(path, options) {
  return fetch(`${API_BASE}${path}`, options)
}
