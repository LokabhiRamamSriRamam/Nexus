import { create } from 'zustand'

export const useReminderStore = create((set) => ({
  todayReminders:    [],
  upcomingReminders: [],
  todayCount:        0,

  fetchToday: async () => {
    try {
      const res  = await fetch('/api/reminders/today')
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      set({ todayReminders: list, todayCount: list.length })
    } catch {
      // silently fail — badge just won't update
    }
  },

  fetchUpcoming: async () => {
    try {
      const res  = await fetch('/api/reminders/upcoming')
      const data = await res.json()
      set({ upcomingReminders: Array.isArray(data) ? data : [] })
    } catch {}
  },

  markDone: async (id) => {
    try {
      await fetch(`/api/reminders/${id}/done`, { method: 'PATCH' })
      set((s) => {
        const today = s.todayReminders.filter((r) => r._id !== id)
        return { todayReminders: today, todayCount: today.length }
      })
    } catch {}
  },
}))
