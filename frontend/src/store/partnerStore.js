import { create } from 'zustand'

export const usePartnerStore = create((set, get) => ({
  partners: [],
  loading: false,
  modalOpen: false,
  editingPartner: null,
  selectedPartner: null,
  drawerOpen: false,
  drawerTab: 'interactions',
  filters: {
    stage: 'pre-sales',
    zone: '',
    priority: '',
    partnerType: '',
    search: '',
  },

  // Analytics
  analytics: { rows: [], totals: { leadsBrought: 0, converted: 0, revenue: 0, commissionOwed: 0, activePartners: 0, conversionRate: 0 } },

  setModalOpen: (open, partner = null) => set({ modalOpen: open, editingPartner: partner }),
  setDrawerOpen: (open, partner = null, tab = 'interactions') => set({ drawerOpen: open, selectedPartner: partner, drawerTab: tab }),

  setFilter: (key, value) => {
    set((s) => ({ filters: { ...s.filters, [key]: value } }))
    get().fetchPartners()
  },

  fetchPartners: async () => {
    set({ loading: true })
    try {
      const f = get().filters
      const params = new URLSearchParams()
      Object.entries(f).forEach(([k, v]) => { if (v) params.append(k, v) })
      const res = await fetch(`/api/partners?${params}`)
      const data = await res.json()
      set({ partners: Array.isArray(data) ? data : [] })
    } catch {
      set({ partners: [] })
    } finally {
      set({ loading: false })
    }
  },

  fetchAnalytics: async () => {
    try {
      const res = await fetch('/api/partners/analytics')
      const data = await res.json()
      if (data && Array.isArray(data.rows)) set({ analytics: data })
    } catch { /* ignore */ }
  },

  createPartner: async (data) => {
    const res = await fetch('/api/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const partner = await res.json()
    set((s) => ({ partners: [partner, ...s.partners] }))
    return partner
  },

  updatePartner: async (id, data) => {
    const res = await fetch(`/api/partners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const partner = await res.json()
    set((s) => ({
      partners: s.partners.map((p) => (p._id === id ? partner : p)),
      selectedPartner: s.selectedPartner?._id === id ? partner : s.selectedPartner,
    }))
    return partner
  },

  deletePartner: async (id) => {
    const res = await fetch(`/api/partners/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Delete failed')
    set((s) => ({
      partners: s.partners.filter((p) => p._id !== id),
      drawerOpen: s.selectedPartner?._id === id ? false : s.drawerOpen,
      selectedPartner: s.selectedPartner?._id === id ? null : s.selectedPartner,
    }))
  },

  // Merge a partial update into a partner locally (after an interaction)
  updatePartnerLocal: (id, patch) => {
    set((s) => ({
      partners: s.partners.map((p) => p._id === id ? { ...p, ...patch } : p),
      selectedPartner: s.selectedPartner?._id === id ? { ...s.selectedPartner, ...patch } : s.selectedPartner,
    }))
  },

  // After backend already advanced the stage — drop from current stage list
  advancePartnerStage: (id, stage) => {
    set((s) => ({
      partners: s.partners.filter((p) => p._id !== id),
      selectedPartner: s.selectedPartner?._id === id ? { ...s.selectedPartner, stage } : s.selectedPartner,
    }))
  },

  updateStage: async (id, stage) => {
    const res = await fetch(`/api/partners/${id}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    set((s) => ({ partners: s.partners.filter((p) => p._id !== id) }))
  },
}))
