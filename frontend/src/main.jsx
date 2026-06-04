import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Backend base URL — set VITE_API_BASE in Vercel (and the native build) to the
// deployed backend, e.g. https://crm-backend.vercel.app. Empty in dev so the
// Vite proxy handles relative /api calls.
const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/+$/, '')

// Global fetch wrapper:
//  1. Prefix relative /api/* calls with API_BASE so the deployed frontend hits the backend.
//  2. Inject the Authorization header for every /api/* request.
const _origFetch = window.fetch.bind(window)
window.fetch = (input, init = {}) => {
  // Rewrite relative /api calls to the configured backend (string inputs only)
  if (API_BASE && typeof input === 'string' && input.startsWith('/api/')) {
    input = API_BASE + input
  }
  const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input)
  if (url.includes('/api/')) {
    try {
      const token = localStorage.getItem('nexus_crm_token')
      if (token) {
        init.headers = { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) }
      }
    } catch { /* ignore */ }
  }
  return _origFetch(input, init)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
