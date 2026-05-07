import { create } from 'zustand'

export const useZoneStore = create((set) => ({
  zones: [],

  fetchZones: async () => {
    try {
      const res = await fetch('/api/zones')
      const data = await res.json()
      set({ zones: Array.isArray(data) ? data : [] })
    } catch {
      set({ zones: [] })
    }
  },

  createZone: async (name) => {
    const res = await fetch('/api/zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const zone = await res.json()
    set((s) => ({ zones: [...s.zones, zone].sort((a, b) => a.name.localeCompare(b.name)) }))
    return zone
  },

  updateZone: async (id, name) => {
    const res = await fetch(`/api/zones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const zone = await res.json()
    set((s) => ({ zones: s.zones.map((z) => (z._id === id ? zone : z)).sort((a, b) => a.name.localeCompare(b.name)) }))
    return zone
  },

  deleteZone: async (id) => {
    const res = await fetch(`/api/zones/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Delete failed')
    set((s) => ({ zones: s.zones.filter((z) => z._id !== id) }))
  },
}))
