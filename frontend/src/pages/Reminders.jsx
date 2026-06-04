import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Check, Clock, Calendar } from 'lucide-react'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useReminderStore } from '@/store/reminderStore'

dayjs.extend(isToday)
dayjs.extend(relativeTime)

const PRIORITY_CLS = {
  P0: 'bg-p0/10 text-p0 border-p0/30',
  P1: 'bg-p1/10 text-p1 border-p1/30',
  P2: 'bg-[#1a1a1a] text-[#888] border-[#2a2a2a]',
  P3: 'bg-[#161616] text-[#666] border-[#222]',
  P4: 'bg-[#131313] text-[#555] border-[#1e1e1e]',
}

function ReminderRow({ reminder, showDone = false, onDone }) {
  const isPartner = !reminder.leadId && !!reminder.partnerId
  const subject  = reminder.leadId ?? reminder.partnerId
  const date     = dayjs(reminder.reminderDate)
  const isOverdue = date.isBefore(dayjs(), 'day')

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.14 }}
      className="bg-[#141414] border border-[#262626] rounded-lg px-4 py-3 flex items-start gap-3"
    >
      {/* Priority badge */}
      {subject?.priority && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${PRIORITY_CLS[subject.priority] ?? PRIORITY_CLS.P2}`}>
          {subject.priority}
        </span>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[#f0f0f0] text-sm font-medium truncate flex items-center gap-1.5">
          {subject?.businessName ?? '—'}
          {isPartner && (
            <span className="text-[9px] text-accent bg-accent/10 border border-accent/25 px-1.5 py-0.5 rounded shrink-0">Partner</span>
          )}
        </p>
        <p className="text-[#555] text-xs mt-0.5 truncate">
          {isPartner
            ? [subject?.contactName, subject?.phone].filter(Boolean).join(' · ')
            : [subject?.internalPOC, subject?.clientPOC].filter(Boolean).join(' → ')}
          {!isPartner && subject?.phone && <span className="ml-2 font-mono">{subject.phone}</span>}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className={`flex items-center gap-1 text-[11px] font-mono ${isOverdue ? 'text-p0' : 'text-[#888]'}`}>
            <Clock size={10} />
            {reminder.reminderTime || 'No time set'}
          </span>
          {reminder.reminderDate && (
            <span className={`flex items-center gap-1 text-[11px] font-mono ${isOverdue ? 'text-p0' : 'text-[#666]'}`}>
              <Calendar size={10} />
              {date.format('D MMM YYYY')}
              {isOverdue && <span className="text-p0 ml-1">overdue</span>}
            </span>
          )}
        </div>
      </div>

      {/* Done button (today + overdue only) */}
      {showDone && (
        <button
          onClick={() => onDone(reminder._id)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-[#666] hover:text-[#22C55E] hover:bg-[#22C55E]/10 border border-[#2a2a2a] hover:border-[#22C55E]/30 transition-colors shrink-0 mt-0.5"
        >
          <Check size={11} />
          <span className="hidden xs:inline">Done</span>
        </button>
      )}
    </motion.div>
  )
}

function Section({ title, icon: Icon, color, reminders, showDone, onDone, emptyText }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} className={color} />
        <h2 className="text-[#555] text-[11px] font-medium uppercase tracking-widest">{title}</h2>
        {reminders.length > 0 && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${color} bg-current/10`}
            style={{ backgroundColor: 'transparent' }}>
            <span className={color}>{reminders.length}</span>
          </span>
        )}
      </div>
      {reminders.length === 0 ? (
        <p className="text-[#444] text-sm py-2">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => (
            <ReminderRow key={r._id} reminder={r} showDone={showDone} onDone={onDone} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Reminders() {
  const { todayReminders, upcomingReminders, fetchToday, fetchUpcoming, markDone } = useReminderStore()

  useEffect(() => {
    fetchToday()
    fetchUpcoming()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="p-3 md:p-5 space-y-7"
    >
      <Section
        title="Today"
        icon={Bell}
        color="text-amber-400"
        reminders={todayReminders}
        showDone
        onDone={markDone}
        emptyText="No follow-ups due today. Clear schedule!"
      />

      <Section
        title="Next 7 Days"
        icon={Calendar}
        color="text-[#3B82F6]"
        reminders={upcomingReminders}
        showDone={false}
        emptyText="Nothing scheduled in the next 7 days."
      />
    </motion.div>
  )
}
