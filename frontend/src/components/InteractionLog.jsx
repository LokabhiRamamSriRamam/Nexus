import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Phone, Mail, MessageSquare, Video, Users, MoreHorizontal, Loader2 } from 'lucide-react'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { useInteractionStore } from '@/store/interactionStore'
import { useLeadStore } from '@/store/leadStore'
import toast from 'react-hot-toast'

/* ── Method config (how the interaction happened) ── */
const METHOD_CONFIG = {
  call:        { label: 'Call',        icon: Phone,        color: '#3B82F6' },
  email:       { label: 'Email',       icon: Mail,         color: '#22C55E' },
  whatsapp:    { label: 'WhatsApp',    icon: MessageSquare, color: '#25D366' },
  'google-meet': { label: 'Google Meet', icon: Video,      color: '#EA4335' },
  'in-person': { label: 'In-Person',  icon: Users,        color: '#A855F7' },
  other:       { label: 'Other',       icon: MoreHorizontal, color: '#888888' },
}

/* Stage-specific method options */
const METHODS_BY_STAGE = {
  'pre-sales':      ['call', 'email', 'whatsapp'],
  'sales-pipeline': ['call', 'google-meet', 'in-person', 'email', 'other'],
  'post-sales':     ['call', 'google-meet', 'in-person', 'email', 'other'],
}

/* ── Outcome config ── */
const OUTCOME_CONFIG = {
  'fresh-lead':        { label: 'Fresh Lead',        color: '#888888' },
  'call-made':         { label: 'Call Made',          color: '#3B82F6' },
  'call-not-picked':   { label: 'Not Picked',         color: '#FF4444' },
  'follow-up-scheduled': { label: 'Follow-up Scheduled', color: '#FF8C00' },
  'demo-scheduled':    { label: 'Demo Scheduled',     color: '#E8FF47' },
  'follow-up-needed':  { label: 'Follow-up Needed',   color: '#FF8C00' },
  'interested':        { label: 'Interested',          color: '#22C55E' },
  'not-interested':    { label: 'Not Interested',      color: '#FF4444' },
  'negotiation':       { label: 'Negotiation',         color: '#A855F7' },
  'deal-sent':         { label: 'Deal Sent',           color: '#3B82F6' },
  'paid':              { label: 'Paid',                color: '#22C55E' },
  'renewal-discussion': { label: 'Renewal Discussion', color: '#3B82F6' },
  'renewal-confirmed':  { label: 'Renewal Confirmed',  color: '#22C55E' },
  'churned':            { label: 'Churned',            color: '#FF4444' },
}

const OUTCOMES_BY_STAGE = {
  'pre-sales':      ['call-made', 'call-not-picked', 'follow-up-scheduled', 'demo-scheduled'],
  'sales-pipeline': ['follow-up-needed', 'interested', 'not-interested', 'negotiation', 'demo-scheduled', 'deal-sent', 'paid'],
  'post-sales':     ['renewal-discussion', 'renewal-confirmed', 'churned'],
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
function AddInteractionForm({ leadId, leadStage, onAdded }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const { createInteraction } = useInteractionStore()
  const { advanceLeadStage, updateLeadLocal } = useLeadStore()

  const methods  = METHODS_BY_STAGE[leadStage]  ?? METHODS_BY_STAGE['pre-sales']
  const outcomes = OUTCOMES_BY_STAGE[leadStage] ?? OUTCOMES_BY_STAGE['pre-sales']

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const openForm = () => {
    setForm({ ...EMPTY_FORM, method: methods[0], outcome: outcomes[0] })
    setOpen(true)
  }

  const submit = async () => {
    if (!form.mom.trim()) { toast.error('Notes are required'); return }
    if (!form.outcome)    { toast.error('Select an outcome'); return }
    setSaving(true)
    try {
      const { stageAdvanced, newStage, updatedLead } = await createInteraction({
        leadId,
        method: form.method,
        outcome: form.outcome,
        date: form.date,
        time: form.time || undefined,
        loggedBy: form.loggedBy.trim() || undefined,
        mom: form.mom.trim(),
        nextFollowUpDate: form.nextFollowUpDate || undefined,
        nextFollowUpTime: form.nextFollowUpTime || undefined,
      })
      setOpen(false)
      setForm(EMPTY_FORM)

      // Apply lead changes locally (outcome, followUpDate, stage)
      if (updatedLead) updateLeadLocal(leadId, updatedLead)

      if (stageAdvanced && newStage === 'sales-pipeline') {
        advanceLeadStage(leadId, 'sales-pipeline')
        toast.success('Demo scheduled — lead moved to Sales Pipeline')
      } else if (stageAdvanced && newStage === 'post-sales') {
        advanceLeadStage(leadId, 'post-sales')
        toast.success('Marked as Paid — lead moved to Post-Sales')
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
                      onClick={() => setField('method', m)}
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
                {outcomes.map((o) => {
                  const cfg = OUTCOME_CONFIG[o]
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
              {leadStage === 'pre-sales' && form.outcome === 'demo-scheduled' && (
                <p className="text-[11px] text-[#3B82F6] bg-[#3B82F6]/8 border border-[#3B82F6]/20 rounded px-2.5 py-1.5 mt-2">
                  Marking as <strong>Demo Scheduled</strong> will move this lead to Sales Pipeline.
                </p>
              )}
              {leadStage === 'sales-pipeline' && form.outcome === 'paid' && (
                <p className="text-[11px] text-[#22C55E] bg-[#22C55E]/8 border border-[#22C55E]/20 rounded px-2.5 py-1.5 mt-2">
                  Marking as <strong>Paid</strong> will move this lead to Post-Sales.
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

            <div className="flex items-center justify-between">
              <button onClick={() => setOpen(false)} className="text-xs text-[#666] hover:text-[#aaa] transition-colors">
                Cancel
              </button>
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
export default function InteractionLog({ leadId, leadStage }) {
  const { byLead, loading, fetchInteractions } = useInteractionStore()
  const interactions = byLead[leadId] ?? null

  useEffect(() => {
    if (leadId) fetchInteractions(leadId)
  }, [leadId])

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-3">
        <AddInteractionForm leadId={leadId} leadStage={leadStage} onAdded={() => fetchInteractions(leadId)} />

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
