import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Calendar, Loader2, Handshake, Percent, IndianRupee } from 'lucide-react'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'
import { useInteractionStore } from '@/store/interactionStore'
import { usePartnerStore } from '@/store/partnerStore'
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
  'pre-sales':      [
    { t: 'call',     label: 'Call',     color: '#3B82F6' },
    { t: 'email',    label: 'Email',    color: '#22C55E' },
    { t: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
  ],
  'sales-pipeline': [
    { t: 'call',        label: 'Call',         color: '#3B82F6' },
    { t: 'google-meet', label: 'Google Meet',  color: '#EA4335' },
    { t: 'in-person',   label: 'In-Person',    color: '#A855F7' },
    { t: 'email',       label: 'Email',        color: '#22C55E' },
    { t: 'other',       label: 'Other',        color: '#888888' },
  ],
  'post-sales': [
    { t: 'call',        label: 'Call',        color: '#3B82F6' },
    { t: 'google-meet', label: 'Google Meet', color: '#EA4335' },
    { t: 'in-person',   label: 'In-Person',   color: '#A855F7' },
    { t: 'email',       label: 'Email',       color: '#22C55E' },
    { t: 'other',       label: 'Other',       color: '#888888' },
  ],
}

const OUTCOMES_BY_STAGE = {
  'pre-sales': [
    { t: 'call-made',           label: 'Call Made',           color: '#3B82F6' },
    { t: 'call-not-picked',     label: 'Not Picked',          color: '#FF4444' },
    { t: 'follow-up-scheduled', label: 'Follow-up Scheduled', color: '#FF8C00' },
    { t: 'demo-scheduled',      label: 'Intro Meeting',       color: '#E8FF47' },
  ],
  'sales-pipeline': [
    { t: 'follow-up-needed', label: 'Follow-up Needed', color: '#FF8C00' },
    { t: 'interested',       label: 'Interested',       color: '#22C55E' },
    { t: 'not-interested',   label: 'Not Interested',   color: '#FF4444' },
    { t: 'negotiation',      label: 'Negotiation',      color: '#A855F7' },
    { t: 'deal-sent',        label: 'Terms Sent',       color: '#3B82F6' },
    { t: 'paid',             label: 'Signed',           color: '#22C55E' },
  ],
  'post-sales': [
    { t: 'renewal-discussion', label: 'Check-in',     color: '#3B82F6' },
    { t: 'renewal-confirmed',  label: 'Renewed',      color: '#22C55E' },
    { t: 'churned',            label: 'Ended',        color: '#FF4444' },
  ],
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

function QuickLogForm({ partner, onDone, onCancel }) {
  const stage    = partner.stage ?? 'pre-sales'
  const methods  = METHODS_BY_STAGE[stage]  ?? METHODS_BY_STAGE['pre-sales']
  const outcomes = OUTCOMES_BY_STAGE[stage] ?? OUTCOMES_BY_STAGE['pre-sales']

  const [method,           setMethod]           = useState(methods[0].t)
  const [outcome,          setOutcome]          = useState(outcomes[0].t)
  const [mom,              setMom]              = useState('')
  const [nextFollowUpDate, setNextFollowUpDate] = useState('')
  const [nextFollowUpTime, setNextFollowUpTime] = useState('')
  const [saving,           setSaving]           = useState(false)
  const textRef = useRef(null)
  const { createPartnerInteraction } = useInteractionStore()
  const { advancePartnerStage, updatePartnerLocal } = usePartnerStore()

  useEffect(() => { textRef.current?.focus() }, [])

  const submit = async () => {
    if (!mom.trim()) return
    setSaving(true)
    try {
      const { stageAdvanced, newStage, updatedPartner } = await createPartnerInteraction(partner._id, {
        method,
        outcome,
        date: dayjs().format('YYYY-MM-DD'),
        time: dayjs().format('HH:mm'),
        mom: mom.trim(),
        nextFollowUpDate: nextFollowUpDate || undefined,
        nextFollowUpTime: nextFollowUpTime || undefined,
      })
      if (updatedPartner) updatePartnerLocal(partner._id, updatedPartner)
      if (stageAdvanced && newStage === 'sales-pipeline') {
        advancePartnerStage(partner._id, 'sales-pipeline')
        toast.success('Intro meeting — moved to Negotiating')
      } else if (stageAdvanced && newStage === 'post-sales') {
        advancePartnerStage(partner._id, 'post-sales')
        toast.success('Signed — partnership is now Active')
      } else {
        const followUpMsg = nextFollowUpDate ? ` · Follow-up: ${dayjs(nextFollowUpDate).format('D MMM')}` : ''
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
        <PillRow label="Method"  items={methods}  selected={method}  onSelect={setMethod} />
        <PillRow label="Outcome" items={outcomes} selected={outcome} onSelect={setOutcome} />

        {stage === 'pre-sales' && outcome === 'demo-scheduled' && (
          <p className="text-[11px] text-[#E8FF47] bg-[#E8FF47]/8 border border-[#E8FF47]/20 rounded px-2 py-1">
            Partnership will move to Negotiating.
          </p>
        )}
        {stage === 'sales-pipeline' && outcome === 'paid' && (
          <p className="text-[11px] text-[#22C55E] bg-[#22C55E]/8 border border-[#22C55E]/20 rounded px-2 py-1">
            Partnership will become Active.
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

        <div className="flex items-center justify-between">
          <button onClick={onCancel} className="text-[11px] text-[#555] hover:text-[#888] transition-colors">
            Cancel
          </button>
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

const TYPE_LABELS = {
  reseller: 'Reseller', referral: 'Referral', affiliate: 'Affiliate',
  channel: 'Channel', franchise: 'Franchise', other: 'Partner',
}

export default function PartnerCard({ partner, onDetailOpen, index }) {
  const [logging, setLogging] = useState(false)

  const followUp  = partner.followUpDate ? dayjs(partner.followUpDate) : null
  const isOverdue = followUp && followUp.isBefore(dayjs(), 'day')
  const isToday   = followUp && followUp.isSame(dayjs(), 'day')

  const longPressProps = useLongPress(useCallback(() => {
    if (!logging) onDetailOpen?.()
  }, [logging, onDetailOpen]))

  const commissionLabel = partner.commissionValue > 0
    ? partner.commissionType === 'flat'
      ? `₹${partner.commissionValue}/lead`
      : `${partner.commissionValue}%`
    : null

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
      <div className="flex items-center gap-3">
        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0', PRIORITY[partner.priority] ?? PRIORITY.P2)}>
          {partner.priority ?? 'P2'}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[#f0f0f0] text-sm font-medium truncate leading-snug flex items-center gap-1.5">
            <Handshake size={12} className="text-[#666] shrink-0" />
            {partner.businessName}
          </p>
          <p className="text-[#888] text-xs truncate mt-0.5">
            {[partner.contactName, partner.internalPOC].filter(Boolean).join(' → ') || TYPE_LABELS[partner.partnerType]}
            {(partner.contactName || partner.internalPOC) && (
              <span className="ml-2 text-[#666]">· {TYPE_LABELS[partner.partnerType]}</span>
            )}
            {partner.zone?.name && <span className="ml-1 text-[#666]">· {partner.zone.name}</span>}
          </p>
        </div>

        {commissionLabel && (
          <span className="hidden sm:flex items-center gap-1 text-[#999] text-xs shrink-0 font-mono">
            {partner.commissionType === 'flat' ? <IndianRupee size={10} /> : <Percent size={10} />}
            {commissionLabel}
          </span>
        )}

        {partner.phone && (
          <span className="hidden md:flex items-center gap-1 text-[#777] text-xs shrink-0 font-mono">
            <Phone size={10} /> {partner.phone}
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
      </div>

      <AnimatePresence>
        {logging && (
          <QuickLogForm
            partner={partner}
            onDone={() => setLogging(false)}
            onCancel={() => setLogging(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
