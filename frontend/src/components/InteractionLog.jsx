import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Phone, Mail, MessageSquare, Video, Users, DoorOpen, MoreHorizontal, Loader2, Skull } from 'lucide-react'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { useInteractionStore } from '@/store/interactionStore'
import { useLeadStore } from '@/store/leadStore'
import { usePartnerStore } from '@/store/partnerStore'
import toast from 'react-hot-toast'

/* ── Method config ── */
const METHOD_CONFIG = {
  call:           { label: 'Call',        icon: Phone,          color: '#3B82F6' },
  email:          { label: 'Email',       icon: Mail,           color: '#22C55E' },
  whatsapp:       { label: 'WhatsApp',    icon: MessageSquare,  color: '#25D366' },
  'walk-in':      { label: 'Walk-in',     icon: DoorOpen,       color: '#F59E0B' },
  'google-meet':  { label: 'Google Meet', icon: Video,          color: '#EA4335' },
  'in-person':    { label: 'In-Person',   icon: Users,          color: '#A855F7' },
  other:          { label: 'Other',       icon: MoreHorizontal, color: '#888888' },
}

const METHODS_BY_STAGE = {
  'pre-sales':      ['call', 'email', 'whatsapp', 'walk-in'],
  'free-trial':     ['call', 'email', 'whatsapp', 'walk-in'],
  'sales-pipeline': ['call', 'google-meet', 'in-person', 'email', 'other'],
  'post-sales':     ['call', 'google-meet', 'in-person', 'email', 'other'],
}

/* ── Outcome config ── */
const OUTCOME_CONFIG = {
  'fresh-lead':       { label: 'Fresh Lead',        color: '#888888' },
  'call-made':        { label: 'Call Made',          color: '#3B82F6' },
  'call-not-picked':  { label: 'Not Picked',         color: '#FF4444' },
  'email-sent':       { label: 'Email Sent',         color: '#22C55E' },
  'email-replied':    { label: 'Email Replied',      color: '#10B981' },
  'message-sent':     { label: 'Message Sent',       color: '#25D366' },
  'message-replied':  { label: 'Msg Replied',        color: '#059669' },
  'walked-in':        { label: 'Walked In',          color: '#F59E0B' },
  'follow-up-scheduled': { label: 'Follow-up Scheduled', color: '#FF8C00' },
  'demo-scheduled':   { label: 'Demo Scheduled',     color: '#E8FF47' },
  'follow-up-needed': { label: 'Follow-up Needed',   color: '#FF8C00' },
  'interested':       { label: 'Interested',          color: '#22C55E' },
  'not-interested':   { label: 'Not Interested',      color: '#FF4444' },
  'negotiation':      { label: 'Negotiation',         color: '#A855F7' },
  'deal-sent':        { label: 'Deal Sent',           color: '#3B82F6' },
  'paid':             { label: 'Paid',                color: '#22C55E' },
  'renewal-discussion': { label: 'Renewal Discussion', color: '#3B82F6' },
  'renewal-confirmed':  { label: 'Renewal Confirmed',  color: '#22C55E' },
  'churned':            { label: 'Churned',            color: '#FF4444' },
}

/* Outcomes keyed by stage → method */
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

const EMPTY_FORM = {
  method: 'call',
  outcome: '',
  date: dayjs().format('YYYY-MM-DD'),
  time: '',
  loggedBy: '',
  mom: '',
  nextFollowUpDate: '',
  nextFollowUpTime: '',
}

/* ── Add Interaction Form ── */
function AddInteractionForm({ leadId, leadStage, partnerId, onAdded }) {
  const isPartner = !!partnerId
  const subjectId = partnerId ?? leadId
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [markingLost, setMarkingLost] = useState(false)
  const { createInteraction, createPartnerInteraction } = useInteractionStore()
  const { advanceLeadStage, updateLeadLocal, updateStage } = useLeadStore()
  const { advancePartnerStage, updatePartnerLocal } = usePartnerStore()

  const noun = isPartner ? 'partnership' : 'lead'
  const pipelineLabel = isPartner ? 'Negotiating' : 'Sales Pipeline'
  const activeLabel   = isPartner ? 'Active' : 'Post-Sales'
  const canMarkLost   = !isPartner && ['pre-sales', 'sales-pipeline', 'free-trial'].includes(leadStage)

  const methods  = METHODS_BY_STAGE[leadStage]  ?? METHODS_BY_STAGE['pre-sales']
  const getOutcomes = (method) => OUTCOMES_BY_METHOD[leadStage]?.[method] ?? OUTCOMES_BY_METHOD['pre-sales']?.['call'] ?? []

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleMethodChange = (m) => {
    const newOutcomes = getOutcomes(m)
    setForm((f) => ({ ...f, method: m, outcome: newOutcomes[0] ?? '' }))
  }

  const openForm = () => {
    const defaultMethod  = methods[0]
    const defaultOutcome = getOutcomes(defaultMethod)[0] ?? ''
    setForm({ ...EMPTY_FORM, method: defaultMethod, outcome: defaultOutcome })
    setOpen(true)
  }

  const handleMarkLost = async () => {
    if (!window.confirm('Mark this lead as a Dead End / Lost? This will move it out of the active pipeline.')) return
    setMarkingLost(true)
    try {
      await updateStage(leadId, 'lost')
      setOpen(false)
      toast.success('Lead marked as Dead End')
    } catch {
      toast.error('Failed to update stage')
    } finally {
      setMarkingLost(false)
    }
  }

  const submit = async () => {
    if (!form.mom.trim()) { toast.error('Notes are required'); return }
    if (!form.outcome)    { toast.error('Select an outcome'); return }
    setSaving(true)
    try {
      const payload = {
        method: form.method,
        outcome: form.outcome,
        date: form.date,
        time: form.time || undefined,
        loggedBy: form.loggedBy.trim() || undefined,
        mom: form.mom.trim(),
        nextFollowUpDate: form.nextFollowUpDate || undefined,
        nextFollowUpTime: form.nextFollowUpTime || undefined,
      }

      const result = isPartner
        ? await createPartnerInteraction(subjectId, payload)
        : await createInteraction({ leadId: subjectId, ...payload })
      const { stageAdvanced, newStage } = result
      const updatedSubject = isPartner ? result.updatedPartner : result.updatedLead

      setOpen(false)
      setForm(EMPTY_FORM)

      // Apply subject changes locally (outcome, followUpDate, stage)
      if (updatedSubject) {
        if (isPartner) updatePartnerLocal(subjectId, updatedSubject)
        else updateLeadLocal(subjectId, updatedSubject)
      }

      if (stageAdvanced && newStage === 'sales-pipeline') {
        if (isPartner) advancePartnerStage(subjectId, 'sales-pipeline')
        else advanceLeadStage(subjectId, 'sales-pipeline')
        toast.success(`Demo scheduled — ${noun} moved to ${pipelineLabel}`)
      } else if (stageAdvanced && newStage === 'post-sales') {
        if (isPartner) advancePartnerStage(subjectId, 'post-sales')
        else advanceLeadStage(subjectId, 'post-sales')
        toast.success(`Marked as Paid — ${noun} moved to ${activeLabel}`)
      } else {
        const followUpMsg = form.nextFollowUpDate
          ? ` · Follow-up set for ${dayjs(form.nextFollowUpDate).format('D MMM')}`
          : ''
        toast.success('Interaction logged' + followUpMsg)
      }
      onAdded?.()
    } catch (err) {
      toast.error(err.message || 'Failed to log')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-4">
      {!open ? (
        <button
          onClick={openForm}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[#2e2e2e] text-[#666] hover:text-[#aaa] hover:border-[#444] transition-colors text-xs"
        >
          <Plus size={13} /> Log an interaction
        </button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="bg-[#0d0d0d] border border-[#252525] rounded-lg p-4 space-y-3"
          >
            {/* Method row */}
            <div>
              <p className="text-[10px] text-[#555] mb-1.5 uppercase tracking-wider">Method</p>
              <div className="flex gap-1.5 flex-wrap">
                {methods.map((m) => {
                  const cfg = METHOD_CONFIG[m]
                  const active = form.method === m
                  return (
                    <button
                      key={m}
                      onClick={() => handleMethodChange(m)}
                      style={active ? { color: cfg.color, borderColor: cfg.color + '60', backgroundColor: cfg.color + '18' } : {}}
                      className={`px-2.5 py-1 rounded text-xs border capitalize transition-all ${
                        active ? '' : 'border-[#2a2a2a] text-[#666] hover:border-[#3a3a3a] hover:text-[#aaa]'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Outcome row */}
            <div>
              <p className="text-[10px] text-[#555] mb-1.5 uppercase tracking-wider">Outcome</p>
              <div className="flex gap-1.5 flex-wrap">
                {getOutcomes(form.method).map((o) => {
                  const cfg = OUTCOME_CONFIG[o]
                  if (!cfg) return null
                  const active = form.outcome === o
                  return (
                    <button
                      key={o}
                      onClick={() => setField('outcome', o)}
                      style={active ? { color: cfg.color, borderColor: cfg.color + '60', backgroundColor: cfg.color + '18' } : {}}
                      className={`px-2.5 py-1 rounded text-xs border transition-all ${
                        active ? '' : 'border-[#2a2a2a] text-[#666] hover:border-[#3a3a3a] hover:text-[#aaa]'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
              {['pre-sales', 'free-trial'].includes(leadStage) && form.outcome === 'demo-scheduled' && (
                <p className="text-[11px] text-[#3B82F6] bg-[#3B82F6]/8 border border-[#3B82F6]/20 rounded px-2.5 py-1.5 mt-2">
                  Marking as <strong>Demo Scheduled</strong> will move this {noun} to {pipelineLabel}.
                </p>
              )}
              {leadStage === 'sales-pipeline' && form.outcome === 'paid' && (
                <p className="text-[11px] text-[#22C55E] bg-[#22C55E]/8 border border-[#22C55E]/20 rounded px-2.5 py-1.5 mt-2">
                  Marking as <strong>Paid</strong> will move this {noun} to {activeLabel}.
                </p>
              )}
            </div>

            {/* Date + Time + Logged by */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] text-[#555] mb-1">Date</p>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setField('date', e.target.value)}
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-[#ddd] focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <p className="text-[10px] text-[#555] mb-1">Time</p>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setField('time', e.target.value)}
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-[#ddd] focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <p className="text-[10px] text-[#555] mb-1">Logged by</p>
                <input
                  type="text"
                  value={form.loggedBy}
                  onChange={(e) => setField('loggedBy', e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-[#ddd] placeholder:text-[#444] focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-[10px] text-[#555] mb-1">Notes *</p>
              <textarea
                value={form.mom}
                onChange={(e) => setField('mom', e.target.value)}
                placeholder="What happened? Key points, next steps…"
                rows={3}
                className="w-full bg-[#111] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-[#f0f0f0] placeholder:text-[#444] resize-none focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Next follow-up */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1e1e1e]">
              <div>
                <p className="text-[10px] text-[#555] mb-1 mt-2">Next follow-up date</p>
                <input
                  type="date"
                  value={form.nextFollowUpDate}
                  onChange={(e) => setField('nextFollowUpDate', e.target.value)}
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-[#ddd] focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <p className="text-[10px] text-[#555] mb-1 mt-2">Time</p>
                <select
                  value={form.nextFollowUpTime}
                  onChange={(e) => setField('nextFollowUpTime', e.target.value)}
                  disabled={!form.nextFollowUpDate}
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-[#ddd] focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-40"
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
                <button onClick={() => setOpen(false)} className="text-xs text-[#666] hover:text-[#aaa] transition-colors">
                  Cancel
                </button>
                {canMarkLost && (
                  <button
                    onClick={handleMarkLost}
                    disabled={markingLost}
                    className="flex items-center gap-1 text-xs text-[#555] hover:text-p0 transition-colors disabled:opacity-40"
                  >
                    {markingLost ? <Loader2 size={10} className="animate-spin" /> : <Skull size={10} />}
                    Dead End
                  </button>
                )}
              </div>
              <Button
                size="sm"
                onClick={submit}
                disabled={saving}
                className="h-7 px-4 bg-accent text-background hover:bg-accent/90 text-xs font-semibold gap-1.5"
              >
                {saving ? <Loader2 size={11} className="animate-spin" /> : null}
                {saving ? 'Saving…' : 'Log Interaction'}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

/* ── Single timeline entry ── */
function InteractionEntry({ interaction }) {
  const methodCfg  = METHOD_CONFIG[interaction.method]  ?? METHOD_CONFIG.other
  const outcomeCfg = OUTCOME_CONFIG[interaction.outcome]
  const Icon = methodCfg.icon
  const date = dayjs(interaction.date)

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      className="flex gap-3"
    >
      {/* Dot + line */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: methodCfg.color + '18', border: `1px solid ${methodCfg.color}40` }}
        >
          <Icon size={11} style={{ color: methodCfg.color }} />
        </div>
        <div className="w-px flex-1 bg-[#222] mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          {/* Method badge */}
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ color: methodCfg.color, backgroundColor: methodCfg.color + '18', border: `1px solid ${methodCfg.color}30` }}
          >
            {methodCfg.label}
          </span>
          {/* Outcome badge */}
          {outcomeCfg && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ color: outcomeCfg.color, backgroundColor: outcomeCfg.color + '12', border: `1px solid ${outcomeCfg.color}30` }}
            >
              {outcomeCfg.label}
            </span>
          )}
          <span className="text-[#666] text-[11px] font-mono">
            {date.format('D MMM YYYY')}{interaction.time ? ' · ' + interaction.time : ''}
          </span>
          {interaction.loggedBy && (
            <span className="text-[#555] text-[11px]">by {interaction.loggedBy}</span>
          )}
        </div>
        <p className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap">{interaction.mom}</p>
        {interaction.nextFollowUpDate && (
          <p className="text-[11px] text-[#FF8C00] mt-1.5">
            ↪ Follow-up: {dayjs(interaction.nextFollowUpDate).format('D MMM YYYY')}
            {interaction.nextFollowUpTime ? ' · ' + interaction.nextFollowUpTime : ''}
          </p>
        )}
      </div>
    </motion.div>
  )
}

/* ── Main InteractionLog panel ── */
export default function InteractionLog({ leadId, leadStage, partnerId }) {
  const isPartner = !!partnerId
  const subjectId = partnerId ?? leadId
  const { byLead, loading, fetchInteractions, fetchPartnerInteractions } = useInteractionStore()
  const interactions = byLead[subjectId] ?? null

  const refetch = () => {
    if (isPartner) fetchPartnerInteractions(subjectId)
    else fetchInteractions(subjectId)
  }

  useEffect(() => {
    if (subjectId) refetch()
  }, [subjectId])

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-3">
        <AddInteractionForm leadId={leadId} leadStage={leadStage} partnerId={partnerId} onAdded={refetch} />

        {loading && !interactions && (
          <div className="flex items-center gap-2 text-[#666] text-xs py-4">
            <Loader2 size={12} className="animate-spin" /> Loading…
          </div>
        )}

        {interactions?.length === 0 && (
          <p className="text-[#555] text-sm py-4 text-center">No interactions logged yet.</p>
        )}

        {interactions?.length > 0 && (
          <div>
            {interactions.map((i) => (
              <InteractionEntry key={i._id} interaction={i} />
            ))}
            <div className="w-6 flex justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#333]" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
