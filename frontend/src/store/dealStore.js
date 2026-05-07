import { create } from 'zustand'

export const useDealStore = create((set) => ({
  byLead: {},   // { [leadId]: deal | null }
  loading: false,

  fetchDeal: async (leadId) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/deals/${leadId}`)
      if (res.status === 404) {
        set((s) => ({ byLead: { ...s.byLead, [leadId]: null } }))
        return
      }
      const deal = await res.json()
      set((s) => ({ byLead: { ...s.byLead, [leadId]: deal } }))
    } catch {
      set((s) => ({ byLead: { ...s.byLead, [leadId]: null } }))
    } finally {
      set({ loading: false })
    }
  },

  createDeal: async (data) => {
    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const deal = await res.json()
    set((s) => ({ byLead: { ...s.byLead, [data.leadId]: deal } }))
    return deal
  },

  updateDeal: async (id, leadId, data) => {
    const res = await fetch(`/api/deals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const deal = await res.json()
    set((s) => ({ byLead: { ...s.byLead, [leadId]: deal } }))
    return deal
  },
}))
