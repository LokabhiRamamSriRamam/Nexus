import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { useReminderStore } from '@/store/reminderStore'

export default function ReminderBanner() {
  const [dismissed, setDismissed] = useState(false)
  const { todayCount, todayReminders } = useReminderStore()

  if (dismissed || todayCount === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="mx-5 mt-3 flex items-center justify-between px-4 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5"
      >
        <div className="flex items-center gap-2.5 text-sm">
          <Bell size={14} className="text-amber-400 shrink-0" />
          <span className="text-text-secondary">
            You have{' '}
            <span className="font-semibold text-amber-400">
              {todayCount} follow-up{todayCount > 1 ? 's' : ''}
            </span>{' '}
            due today
          </span>
          {todayReminders.slice(0, 3).map((r) => (
            <span
              key={r._id}
              className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-raised text-xs text-text-secondary"
            >
              {r.leadId?.businessName}
            </span>
          ))}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-text-muted hover:text-text-secondary transition-colors ml-3"
        >
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
