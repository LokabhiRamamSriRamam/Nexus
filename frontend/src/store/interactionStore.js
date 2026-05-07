import { create } from 'zustand'

export const useInteractionStore = create((set) => ({
  byLead: {},
  loading: false,

  fetchInteractions: async (leadId) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/interactions/${leadId}`)
      const data = await res.json()
      set((s) => ({ byLead: { ...s.byLead, [leadId]: Array.isArray(data) ? data : [] } }))
    } catch {
      set((s) => ({ byLead: { ...s.byLead, [leadId]: [] } }))
    } finally {
      set({ loading: false })
    }
  },

  // Returns { interaction, stageAdvanced }
  createInteraction: async (payload) => {
    const res = await fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const data = await res.json()
    const interaction = data.interaction ?? data
    set((s) => ({
      byLead: {
        ...s.byLead,
        [payload.leadId]: [interaction, ...(s.byLead[payload.leadId] ?? [])],
      },
    }))
    return { interaction, stageAdvanced: data.stageAdvanced ?? false, newStage: data.newStage ?? null, updatedLead: data.updatedLead ?? null }
  },
}))
