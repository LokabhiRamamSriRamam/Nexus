import { create } from 'zustand'

export const useLeadStore = create((set, get) => ({
  leads: [],
  loading: false,
  modalOpen: false,
  editingLead: null,
  selectedLead: null,
  drawerOpen: false,
  filters: {
    stage: 'pre-sales',
    zone: '',
    priority: '',
    internalPOC: '',
    search: '',
  },

  drawerTab: 'interactions',

  setModalOpen: (open, lead = null) => set({ modalOpen: open, editingLead: lead }),
  setDrawerOpen: (open, lead = null, tab = 'interactions') => set({ drawerOpen: open, selectedLead: lead, drawerTab: tab }),

  setFilter: (key, value) => {
    set((s) => ({ filters: { ...s.filters, [key]: value } }))
    get().fetchLeads()
  },

  fetchLeads: async () => {
    set({ loading: true })
    try {
      const f = get().filters
      const params = new URLSearchParams()
      Object.entries(f).forEach(([k, v]) => { if (v) params.append(k, v) })
      const res = await fetch(`/api/leads?${params}`)
      const data = await res.json()
      set({ leads: Array.isArray(data) ? data : [] })
    } catch {
      set({ leads: [] })
    } finally {
      set({ loading: false })
    }
  },

  createLead: async (data) => {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const lead = await res.json()
    set((s) => ({ leads: [lead, ...s.leads] }))
    return lead
  },

  updateLead: async (id, data) => {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const lead = await res.json()
    set((s) => ({
      leads: s.leads.map((l) => (l._id === id ? lead : l)),
      selectedLead: s.selectedLead?._id === id ? lead : s.selectedLead,
    }))
    return lead
  },

  deleteLead: async (id) => {
    const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Delete failed')
    set((s) => ({
      leads: s.leads.filter((l) => l._id !== id),
      drawerOpen: s.selectedLead?._id === id ? false : s.drawerOpen,
      selectedLead: s.selectedLead?._id === id ? null : s.selectedLead,
    }))
  },

  // Merge a partial update into a lead in the local list (e.g. after interaction updates followUpDate)
  updateLeadLocal: (id, patch) => {
    set((s) => ({
      leads: s.leads.map((l) => l._id === id ? { ...l, ...patch } : l),
      selectedLead: s.selectedLead?._id === id ? { ...s.selectedLead, ...patch } : s.selectedLead,
    }))
  },

  // Local-only update — used after backend already changed the stage (e.g. demo auto-advance)
  advanceLeadStage: (id, stage) => {
    set((s) => ({
      leads: s.leads.filter((l) => l._id !== id),
      selectedLead: s.selectedLead?._id === id
        ? { ...s.selectedLead, stage }
        : s.selectedLead,
    }))
  },

  updateStage: async (id, stage, extras = {}) => {
    const res = await fetch(`/api/leads/${id}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage, ...extras }),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const lead = await res.json()
    set((s) => ({
      leads: s.leads.filter((l) => l._id !== id),
      selectedLead: s.selectedLead?._id === id ? lead : s.selectedLead,
    }))
    return lead
  },
}))
