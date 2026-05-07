import { create } from 'zustand'

export const useSalesRepStore = create((set) => ({
  reps: [],

  fetchReps: async () => {
    try {
      const res = await fetch('/api/sales-reps')
      const data = await res.json()
      set({ reps: Array.isArray(data) ? data : [] })
    } catch {
      set({ reps: [] })
    }
  },

  createRep: async (name) => {
    const res = await fetch('/api/sales-reps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const rep = await res.json()
    set((s) => ({ reps: [...s.reps, rep].sort((a, b) => a.name.localeCompare(b.name)) }))
    return rep
  },

  updateRep: async (id, name) => {
    const res = await fetch(`/api/sales-reps/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const rep = await res.json()
    set((s) => ({ reps: s.reps.map((r) => (r._id === id ? rep : r)).sort((a, b) => a.name.localeCompare(b.name)) }))
    return rep
  },

  deleteRep: async (id) => {
    const res = await fetch(`/api/sales-reps/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Delete failed')
    set((s) => ({ reps: s.reps.filter((r) => r._id !== id) }))
  },
}))
