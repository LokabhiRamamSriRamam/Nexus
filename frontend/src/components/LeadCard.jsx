import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Calendar, Loader2, Skull } from 'lucide-react'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'
import { useInteractionStore } from '@/store/interactionStore'
import { useLeadStore } from '@/store/leadStore'
import { useLongPress } from '@/lib/useLongPress'
import toast from 'react-hot-toast'

/* Half-hour time slots 6 AM – 10 PM */
const TIME_SLOTS = (() => {
  const slots = []
  for (let h = 6; h <= 22; h++) {
    for (const m of [0, 30]) {
      if (h === 22 && m === 30) break
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
      slots.push({ value: `${hh}:${mm}`, label: `${hour12}:${mm} ${h < 12 ? 'AM' : 'PM'}` })
    }
  }
  return slots
})()

const PRIORITY = {
  P0: 'bg-p0/10 text-p0 border-p0/30',
  P1: 'bg-p1/10 text-p1 border-p1/30',
  P2: 'bg-[#1a1a1a] text-[#888] border-[#333]',
  P3: 'bg-[#161616] text-[#666] border-[#2a2a2a]',
  P4: 'bg-[#131313] text-[#555] border-[#242424]',
}

const METHODS_BY_STAGE = {
  'pre-sales': [
    { t: 'call',     label: 'Call',     color: '#3B82F6' },
    { t: 'email',    label: 'Email',    color: '#22C55E' },
    { t: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
    { t: 'walk-in',  label: 'Walk-in',  color: '#F59E0B' },
  ],
  'free-trial': [
    { t: 'call',     label: 'Call',     color: '#3B82F6' },
    { t: 'email',    label: 'Email',    color: '#22C55E' },
    { t: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
    { t: 'walk-in',  label: 'Walk-in',  color: '#F59E0B' },
  ],
  'sales-pipeline': [
    { t: 'call',        label: 'Call',        color: '#3B82F6' },
    { t: 'google-meet', label: 'Google Meet', color: '#EA4335' },
    { t: 'in-person',   label: 'In-Person',   color: '#A855F7' },
    { t: 'email',       label: 'Email',       color: '#22C55E' },
    { t: 'other',       label: 'Other',       color: '#888888' },
  ],
  'post-sales': [
    { t: 'call',        label: 'Call',        color: '#3B82F6' },
    { t: 'google-meet', label: 'Google Meet', color: '#EA4335' },
    { t: 'in-person',   label: 'In-Person',   color: '#A855F7' },
    { t: 'email',       label: 'Email',       color: '#22C55E' },
    { t: 'other',       label: 'Other',       color: '#888888' },
  ],
}

/* All outcome definitions — shared lookup */
const OUTCOME_DEF = {
  'call-made':          { label: 'Call Made',          color: '#3B82F6' },
  'call-not-picked':    { label: 'Not Picked',          color: '#FF4444' },
  'email-sent':         { label: 'Email Sent',          color: '#22C55E' },
  'email-replied':      { label: 'Email Replied',       color: '#10B981' },
  'message-sent':       { label: 'Message Sent',        color: '#25D366' },
  'message-replied':    { label: 'Msg Replied',         color: '#059669' },
  'walked-in':          { label: 'Walked In',           color: '#F59E0B' },
  'follow-up-scheduled':{ label: 'Follow-up Scheduled', color: '#FF8C00' },
  'demo-scheduled':     { label: 'Demo Scheduled',      color: '#E8FF47' },
  'follow-up-needed':   { label: 'Follow-up Needed',    color: '#FF8C00' },
  'interested':         { label: 'Interested',           color: '#22C55E' },
  'not-interested':     { label: 'Not Interested',       color: '#FF4444' },
  'negotiation':        { label: 'Negotiation',          color: '#A855F7' },
  'deal-sent':          { label: 'Deal Sent',            color: '#3B82F6' },
  'paid':               { label: 'Paid',                 color: '#22C55E' },
  'renewal-discussion': { label: 'Renewal Discussion',   color: '#3B82F6' },
  'renewal-confirmed':  { label: 'Renewal Confirmed',    color: '#22C55E' },
  'churned':            { label: 'Churned',              color: '#FF4444' },
}

const OUTCOMES_BY_METHOD = {
  'pre-sales': {
    'call':     ['call-made', 'call-not-picked', 'follow-up-scheduled', 'demo-scheduled', 'not-interested'],
    'email':    ['email-sent', 'email-replied', 'follow-up-scheduled', 'demo-scheduled', 'not-interested'],
    'whatsapp': ['message-sent', 'message-replied', 'follow-up-scheduled', 'demo-scheduled', 'not-interested'],
    'walk-in':  ['walked-in', 'follow-up-scheduled', 'demo-scheduled', 'not-interested'],
  },
  'free-trial': {
    'call':     ['call-made', 'call-not-picked', 'follow-up-scheduled', 'not-interested'],
    'email':    ['email-sent', 'email-replied', 'follow-up-scheduled', 'not-interested'],
    'whatsapp': ['message-sent', 'message-replied', 'follow-up-scheduled', 'not-interested'],
    'walk-in':  ['walked-in', 'follow-up-scheduled', 'not-interested'],
  },
  'sales-pipeline': {
    'call':        ['call-made', 'call-not-picked', 'follow-up-needed', 'interested', 'negotiation', 'deal-sent', 'paid', 'not-interested'],
    'google-meet': ['follow-up-needed', 'interested', 'negotiation', 'deal-sent', 'paid', 'not-interested'],
    'in-person':   ['walked-in', 'follow-up-needed', 'interested', 'negotiation', 'deal-sent', 'paid', 'not-interested'],
    'email':       ['email-sent', 'email-replied', 'follow-up-needed', 'deal-sent', 'paid', 'not-interested'],
    'other':       ['follow-up-needed', 'interested', 'negotiation', 'paid', 'not-interested'],
  },
  'post-sales': {
    'call':        ['renewal-discussion', 'renewal-confirmed', 'follow-up-needed', 'churned'],
    'google-meet': ['renewal-discussion', 'renewal-confirmed', 'follow-up-needed', 'churned'],
    'in-person':   ['renewal-discussion', 'renewal-confirmed', 'follow-up-needed', 'churned'],
    'email':       ['email-sent', 'email-replied', 'renewal-discussion', 'renewal-confirmed'],
    'other':       ['renewal-discussion', 'renewal-confirmed', 'churned'],
  },
}

function getOutcomePills(stage, method) {
  const keys = OUTCOMES_BY_METHOD[stage]?.[method] ?? OUTCOMES_BY_METHOD['pre-sales']?.['call'] ?? []
  return keys.map((k) => ({ t: k, ...(OUTCOME_DEF[k] ?? { label: k, color: '#888' }) }))
}

function PillRow({ label, items, selected, onSelect }) {
  return (
    <div>
      <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">{label}</p>
      <div className="flex gap-1 flex-wrap">
        {items.map(({ t, label: l, color }) => {
          const active = selected === t
          return (
            <button
              key={t}
              onClick={(e) => { e.stopPropagation(); onSelect(t) }}
              style={active ? { color, borderColor: color + '60', backgroundColor: color + '18' } : {}}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] border transition-all',
                active ? '' : 'border-[#2a2a2a] text-[#666] hover:border-[#3a3a3a] hover:text-[#aaa]'
              )}
            >
              {l}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function QuickLogForm({ lead, onDone, onCancel }) {
  const stage   = lead.stage ?? 'pre-sales'
  const methods = METHODS_BY_STAGE[stage] ?? METHODS_BY_STAGE['pre-sales']
  const canMarkLost = ['pre-sales', 'sales-pipeline', 'free-trial'].includes(stage)

  const [method,           setMethod]          = useState(methods[0].t)
  const [outcome,          setOutcome]         = useState(() => getOutcomePills(stage, methods[0].t)[0]?.t ?? '')
  const [mom,              setMom]             = useState('')
  const [nextFollowUpDate, setNextFollowUpDate] = useState('')
  const [nextFollowUpTime, setNextFollowUpTime] = useState('')
  const [saving,           setSaving]          = useState(false)
  const [markingLost,      setMarkingLost]     = useState(false)
  const textRef = useRef(null)
  const { createInteraction } = useInteractionStore()
  const { advanceLeadStage, updateLeadLocal, updateStage } = useLeadStore()

  const outcomes = getOutcomePills(stage, method)

  const handleMethodChange = (m) => {
    setMethod(m)
    const pills = getOutcomePills(stage, m)
    setOutcome(pills[0]?.t ?? '')
  }

  useEffect(() => { textRef.current?.focus() }, [])

  const handleMarkLost = async (e) => {
    e.stopPropagation()
    if (!window.confirm('Mark this lead as a Dead End / Lost?')) return
    setMarkingLost(true)
    try {
      await updateStage(lead._id, 'lost')
      onDone()
      toast.success('Lead marked as Dead End')
    } catch {
      toast.error('Failed to update')
      setMarkingLost(false)
    }
  }

  const submit = async () => {
    if (!mom.trim()) return
    setSaving(true)
    try {
      const { stageAdvanced, newStage, updatedLead } = await createInteraction({
        leadId: lead._id,
        method,
        outcome,
        date: dayjs().format('YYYY-MM-DD'),
        time: dayjs().format('HH:mm'),
        mom: mom.trim(),
        nextFollowUpDate: nextFollowUpDate || undefined,
        nextFollowUpTime: nextFollowUpTime || undefined,
      })
      if (updatedLead) updateLeadLocal(lead._id, updatedLead)
      if (stageAdvanced && newStage === 'sales-pipeline') {
        advanceLeadStage(lead._id, 'sales-pipeline')
        toast.success('Demo scheduled — moved to Sales Pipeline')
      } else if (stageAdvanced && newStage === 'post-sales') {
        advanceLeadStage(lead._id, 'post-sales')
        toast.success('Marked as Paid — moved to Post-Sales')
      } else {
        const followUpMsg = nextFollowUpDate
          ? ` · Follow-up: ${dayjs(nextFollowUpDate).format('D MMM')}`
          : ''
        toast.success('Logged' + followUpMsg)
      }
      onDone()
    } catch (err) {
      toast.error(err.message || 'Failed to log')
      setSaving(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
    if (e.key === 'Escape') onCancel()
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      className="overflow-hidden"
    >
      <div className="pt-3 space-y-2.5" onClick={(e) => e.stopPropagation()}>
        <PillRow label="Method"  items={methods}  selected={method}  onSelect={handleMethodChange} />
        <PillRow label="Outcome" items={outcomes} selected={outcome} onSelect={setOutcome} />

        {['pre-sales', 'free-trial'].includes(stage) && outcome === 'demo-scheduled' && (
          <p className="text-[11px] text-[#E8FF47] bg-[#E8FF47]/8 border border-[#E8FF47]/20 rounded px-2 py-1">
            Lead will move to Sales Pipeline.
          </p>
        )}
        {stage === 'sales-pipeline' && outcome === 'paid' && (
          <p className="text-[11px] text-[#22C55E] bg-[#22C55E]/8 border border-[#22C55E]/20 rounded px-2 py-1">
            Lead will move to Post-Sales.
          </p>
        )}

        <textarea
          ref={textRef}
          value={mom}
          onChange={(e) => setMom(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Notes… (Enter to save, Esc to cancel)"
          rows={2}
          className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-[#f0f0f0] placeholder:text-[#444] resize-none focus:outline-none focus:ring-1 focus:ring-accent"
        />

        {/* Next follow-up */}
        <div className="flex gap-2 pt-1 border-t border-[#1e1e1e]">
          <div className="flex-1">
            <p className="text-[10px] text-[#555] mb-1 mt-1">Next follow-up</p>
            <input
              type="date"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-[#ddd] focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-[#555] mb-1 mt-1">Time</p>
            <select
              value={nextFollowUpTime}
              onChange={(e) => setNextFollowUpTime(e.target.value)}
              disabled={!nextFollowUpDate}
              className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-[#ddd] focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-40"
            >
              <option value="">No time</option>
              {TIME_SLOTS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="text-[11px] text-[#555] hover:text-[#888] transition-colors">
              Cancel
            </button>
            {canMarkLost && (
              <button
                onClick={handleMarkLost}
                disabled={markingLost}
                className="flex items-center gap-1 text-[11px] text-[#555] hover:text-p0 transition-colors disabled:opacity-40"
              >
                {markingLost ? <Loader2 size={10} className="animate-spin" /> : <Skull size={10} />}
                Dead End
              </button>
            )}
          </div>
          <button
            onClick={submit}
            disabled={saving || !mom.trim()}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-accent text-background text-xs font-semibold disabled:opacity-40 transition-opacity hover:bg-accent/90"
          >
            {saving && <Loader2 size={11} className="animate-spin" />}
            {saving ? 'Saving…' : 'Log'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Outcome chip shown on the card — derive from OUTCOME_DEF ── */
const OUTCOME_COLORS  = Object.fromEntries(Object.entries(OUTCOME_DEF).map(([k, v]) => [k, v.color]))
const OUTCOME_LABELS  = Object.fromEntries(Object.entries(OUTCOME_DEF).map(([k, v]) => [k, v.label]))

export default function LeadCard({ lead, onDetailOpen, index }) {
  const [logging, setLogging] = useState(false)

  const followUp  = lead.followUpDate ? dayjs(lead.followUpDate) : null
  const isOverdue = followUp && followUp.isBefore(dayjs(), 'day')
  const isToday   = followUp && followUp.isSame(dayjs(), 'day')
  const outcomeColor = OUTCOME_COLORS[lead.outcome] ?? '#888'
  const outcomeLabel = OUTCOME_LABELS[lead.outcome]

  const longPressProps = useLongPress(useCallback(() => {
    if (!logging) onDetailOpen?.()
  }, [logging, onDetailOpen]))

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12, delay: Math.min(index * 0.03, 0.3) }}
      onClick={() => { if (!logging) setLogging(true) }}
      onContextMenu={(e) => { e.preventDefault(); onDetailOpen?.() }}
      {...longPressProps}
      className={cn(
        'bg-[#141414] border rounded-lg px-3 py-3 md:px-4 cursor-pointer transition-all select-none',
        logging ? 'border-[#3a3a3a] bg-[#181818]' : 'border-[#262626] hover:border-[#3a3a3a] hover:bg-[#181818]'
      )}
    >
      {/* ── Top row ── */}
      <div className="flex items-center gap-3">
        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0', PRIORITY[lead.priority] ?? PRIORITY.P2)}>
          {lead.priority ?? 'P2'}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[#f0f0f0] text-sm font-medium truncate leading-snug">{lead.businessName}</p>
          <p className="text-[#888] text-xs truncate mt-0.5">
            {[lead.clientPOC, lead.internalPOC].filter(Boolean).join(' → ')}
            {lead.zone?.name && <span className="ml-2 text-[#666]">· {lead.zone.name}</span>}
          </p>
        </div>

        {lead.phone && (
          <span className="hidden sm:flex items-center gap-1 text-[#777] text-xs shrink-0 font-mono">
            <Phone size={10} /> {lead.phone}
          </span>
        )}

        {followUp && (
          <span className={cn(
            'hidden md:flex items-center gap-1 text-xs shrink-0 font-mono',
            isOverdue ? 'text-p0' : isToday ? 'text-amber-400' : 'text-[#777]'
          )}>
            <Calendar size={10} />
            {isToday ? 'Today' : isOverdue ? followUp.format('D MMM') + ' !' : followUp.format('D MMM')}
          </span>
        )}

        {/* Current outcome chip */}
        {outcomeLabel && (
          <span
            className="hidden lg:block text-[10px] px-2 py-0.5 rounded border shrink-0"
            style={{ color: outcomeColor, borderColor: outcomeColor + '40', backgroundColor: outcomeColor + '12' }}
          >
            {outcomeLabel}
          </span>
        )}

      </div>

      {/* ── Quick-log form (inline expand) ── */}
      <AnimatePresence>
        {logging && (
          <QuickLogForm
            lead={lead}
            onDone={() => setLogging(false)}
            onCancel={() => setLogging(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
