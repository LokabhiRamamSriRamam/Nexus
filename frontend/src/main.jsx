import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Inject Authorization header for all /api/* requests
const _origFetch = window.fetch.bind(window)
window.fetch = (input, init = {}) => {
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
