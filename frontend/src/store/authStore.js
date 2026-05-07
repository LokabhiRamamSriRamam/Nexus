import { create } from 'zustand'

const TOKEN_KEY = 'nexus_crm_token'
const USER_KEY  = 'nexus_crm_user'

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY) ?? null,
  user:  load(USER_KEY),

  isAuthenticated: () => !!get().token,

  login: async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')

    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY,  JSON.stringify(data.user))
    set({ token: data.token, user: data.user })
    return data.user
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ token: null, user: null })
  },
}))
