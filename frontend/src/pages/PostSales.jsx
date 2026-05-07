import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Calendar, IndianRupee, RefreshCw, AlertTriangle, Phone, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'
import { useLeadStore } from '@/store/leadStore'
import { useZoneStore } from '@/store/zoneStore'
import { useDealStore } from '@/store/dealStore'
import { useInteractionStore } from '@/store/interactionStore'
import LeadDrawer from '@/components/LeadDrawer'
import { useLongPress } from '@/lib/useLongPress'
import NexusLoader from '@/components/NexusLoader'
import toast from 'react-hot-toast'

const SELECT_CLS = 'h-8 bg-[#161616] border border-[#2a2a2a] rounded-md px-2 text-xs text-[#ccc] focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer'

const OUTCOME_COLORS = {
  'renewal-discussion': '#3B82F6',
  'renewal-confirmed':  '#22C55E',
  'churned':            '#FF4444',
  'paid':               '#22C55E',
}
const OUTCOME_LABELS = {
  'renewal-discussion': 'Renewal Discussion',
  'renewal-confirmed':  'Renewal Confirmed',
  'churned':            'Churned',
  'paid':               'Paid',
}

const CYCLE_LABELS = { monthly: '/mo', quarterly: '/qtr', yearly: '/yr', 'one-time': '' }

/* ── Renewal date chip ── */
function RenewalChip({ date }) {
  if (!date) return null
  const d = dayjs(date)
  const daysLeft = d.diff(dayjs(), 'day')
  const color = daysLeft < 0 ? '#FF4444' : daysLeft <= 30 ? '#FF8C00' : daysLeft <= 60 ? '#E8FF47' : '#22C55E'
  const label = daysLeft < 0
    ? `Expired ${Math.abs(daysLeft)}d ago`
    : daysLeft === 0 ? 'Expires today'
    : `${daysLeft}d left`

  return (
    <span
      className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border shrink-0"
      style={{ color, borderColor: color + '50', backgroundColor: color + '12' }}
    >
      {daysLeft <= 30 ? <AlertTriangle size={9} /> : <RefreshCw size={9} />}
      {d.format('D MMM')} · {label}
    </span>
  )
}

/* ── Client card ── */
function ClientCard({ lead, deal, index, onDetailOpen }) {
  const [logging, setLogging] = useState(false)
  const { createInteraction } = useInteractionStore()
  const { advanceLeadStage, updateLeadLocal } = useLeadStore()
  const longPressProps = useLongPress(useCallback(() => {
    if (!logging) onDetailOpen?.()
  }, [logging, onDetailOpen]))

  const METHODS = [
    { t: 'call', label: 'Call', color: '#3B82F6' },
    { t: 'google-meet', label: 'Google Meet', color: '#EA4335' },
    { t: 'in-person', label: 'In-Person', color: '#A855F7' },
    { t: 'email', label: 'Email', color: '#22C55E' },
  ]
  const OUTCOMES = [
    { t: 'renewal-discussion', label: 'Renewal Discussion', color: '#3B82F6' },
    { t: 'renewal-confirmed',  label: 'Renewal Confirmed',  color: '#22C55E' },
    { t: 'churned',            label: 'Churned',            color: '#FF4444' },
  ]

  const [method,  setMethod]  = useState('call')
  const [outcome, setOutcome] = useState('renewal-discussion')
  const [mom,     setMom]     = useState('')
  const [nextDate, setNextDate] = useState('')
  const [saving,  setSaving]  = useState(false)
  const textRef = useState(null)

  const submit = async () => {
    if (!mom.trim()) return
    setSaving(true)
    try {
      const { updatedLead } = await createInteraction({
        leadId: lead._id, method, outcome,
        date: dayjs().format('YYYY-MM-DD'),
        time: dayjs().format('HH:mm'),
        mom: mom.trim(),
        nextFollowUpDate: nextDate || undefined,
      })
      if (updatedLead) updateLeadLocal(lead._id, updatedLead)
      toast.success('Logged')
      setMom(''); setNextDate(''); setLogging(false)
    } catch (err) {
      toast.error(err.message || 'Failed')
      setSaving(false)
    }
  }

  const total = deal?.totalAmount ?? null
  const outcomeColor = OUTCOME_COLORS[lead.outcome]
  const outcomeLabel = OUTCOME_LABELS[lead.outcome]

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12, delay: Math.min(index * 0.03, 0.3) }}
      onClick={() => { if (!logging) setLogging(true) }}
      onContextMenu={(e) => { e.preventDefault(); onDetailOpen?.() }}
      {...longPressProps}
      className={cn(
        'bg-[#141414] border rounded-lg px-4 py-3 cursor-pointer transition-all select-none',
        logging ? 'border-[#3a3a3a] bg-[#181818]' : 'border-[#262626] hover:border-[#3a3a3a] hover:bg-[#181818]'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Name + POC */}
        <div className="flex-1 min-w-0">
          <p className="text-[#f0f0f0] text-sm font-medium truncate">{lead.businessName}</p>
          <p className="text-[#888] text-xs truncate mt-0.5">
            {[lead.clientPOC, lead.internalPOC].filter(Boolean).join(' → ')}
            {lead.zone?.name && <span className="ml-2 text-[#666]">· {lead.zone.name}</span>}
          </p>
        </div>

        {/* Plan + amount */}
        {deal ? (
          <div className="hidden sm:flex flex-col items-end shrink-0">
            <span className="text-[#ccc] text-xs font-medium">
              {deal.planId?.name ?? 'Custom'}
              {deal.planId?.billingCycle ? <span className="text-[#666] ml-1">{CYCLE_LABELS[deal.planId.billingCycle]}</span> : null}
            </span>
            {total != null && (
              <span className="text-[#888] text-[11px] font-mono flex items-center gap-0.5">
                <IndianRupee size={9} />{total.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        ) : (
          <span className="hidden sm:block text-[10px] text-[#555] border border-[#333] rounded px-1.5 py-0.5">No deal</span>
        )}

        {/* Renewal date */}
        {deal?.renewalDate && <RenewalChip date={deal.renewalDate} />}

        {/* Current outcome */}
        {outcomeLabel && (
          <span
            className="hidden md:block text-[10px] px-1.5 py-0.5 rounded border shrink-0"
            style={{ color: outcomeColor, borderColor: outcomeColor + '40', backgroundColor: outcomeColor + '12' }}
          >
            {outcomeLabel}
          </span>
        )}

        {/* Phone */}
        {lead.phone && (
          <span className="hidden lg:flex items-center gap-1 text-[#777] text-xs shrink-0 font-mono">
            <Phone size={10} /> {lead.phone}
          </span>
        )}
      </div>

      {/* Quick-log form */}
      <AnimatePresence>
        {logging && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-2.5" onClick={(e) => e.stopPropagation()}>
              {/* Method */}
              <div>
                <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Method</p>
                <div className="flex gap-1 flex-wrap">
                  {METHODS.map(({ t, label, color }) => (
                    <button key={t} onClick={() => setMethod(t)}
                      style={method === t ? { color, borderColor: color + '60', backgroundColor: color + '18' } : {}}
                      className={cn('px-2 py-0.5 rounded text-[11px] border transition-all',
                        method === t ? '' : 'border-[#2a2a2a] text-[#666] hover:border-[#3a3a3a] hover:text-[#aaa]')}
                    >{label}</button>
                  ))}
                </div>
              </div>
              {/* Outcome */}
              <div>
                <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Outcome</p>
                <div className="flex gap-1 flex-wrap">
                  {OUTCOMES.map(({ t, label, color }) => (
                    <button key={t} onClick={() => setOutcome(t)}
                      style={outcome === t ? { color, borderColor: color + '60', backgroundColor: color + '18' } : {}}
                      className={cn('px-2 py-0.5 rounded text-[11px] border transition-all',
                        outcome === t ? '' : 'border-[#2a2a2a] text-[#666] hover:border-[#3a3a3a] hover:text-[#aaa]')}
                    >{label}</button>
                  ))}
                </div>
              </div>
              {/* Notes */}
              <textarea
                autoFocus
                value={mom}
                onChange={(e) => setMom(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } if (e.key === 'Escape') setLogging(false) }}
                placeholder="Notes… (Enter to save, Esc to cancel)"
                rows={2}
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-[#f0f0f0] placeholder:text-[#444] resize-none focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {/* Next follow-up */}
              <div className="flex gap-2 pt-1 border-t border-[#1e1e1e]">
                <div className="flex-1">
                  <p className="text-[10px] text-[#555] mb-1 mt-1">Next follow-up</p>
                  <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-[#ddd] focus:outline-none focus:ring-1 focus:ring-accent" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button onClick={() => setLogging(false)} className="text-[11px] text-[#555] hover:text-[#888]">Cancel</button>
                <button onClick={submit} disabled={saving || !mom.trim()}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-accent text-background text-xs font-semibold disabled:opacity-40 hover:bg-accent/90">
                  {saving && <Loader2 size={11} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Log'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Page ── */
export default function PostSales() {
  const { leads, loading, filters, setFilter, setDrawerOpen } = useLeadStore()
  const { zones, fetchZones } = useZoneStore()
  const { byLead, fetchDeal } = useDealStore()
  const [search, setSearch] = useState('')

  useEffect(() => {
    setFilter('stage', 'post-sales')
    fetchZones()
  }, [])

  // Fetch deals for loaded leads
  useEffect(() => {
    leads.forEach((lead) => {
      if (byLead[lead._id] === undefined) fetchDeal(lead._id)
    })
  }, [leads])

  const handleSearch = (val) => { setSearch(val); setFilter('search', val) }
  const hasActiveFilters = filters.zone || filters.search

  const clearFilters = () => {
    setSearch('')
    setFilter('zone', '')
    setFilter('search', '')
  }

  return (
    <div className="p-3 md:p-5 space-y-3 md:space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search clients…"
            className="pl-8 h-8 bg-[#161616] border-[#2a2a2a] text-[#f0f0f0] placeholder:text-[#555] text-sm focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0"
          />
        </div>

        <select value={filters.zone} onChange={(e) => setFilter('zone', e.target.value)} className={SELECT_CLS}>
          <option value="">All zones</option>
          {zones.map((z) => <option key={z._id} value={z._id}>{z.name}</option>)}
        </select>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-[#666] hover:text-[#aaa]">
            <X size={10} /> Clear
          </button>
        )}

        <span className="text-[#666] text-xs ml-auto shrink-0">
          {loading ? '…' : `${leads.length} client${leads.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <NexusLoader />
      ) : leads.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <p className="text-[#888] text-sm">No post-sales clients yet.</p>
          <p className="text-[#555] text-xs mt-1">
            {hasActiveFilters ? 'Try clearing your filters.' : 'Leads move here when marked as Paid in Sales Pipeline.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead, i) => (
            <ClientCard
              key={lead._id}
              lead={lead}
              deal={byLead[lead._id] ?? null}
              index={i}
              onDetailOpen={() => setDrawerOpen(true, lead, 'deal')}
            />
          ))}
        </div>
      )}

      <LeadDrawer />
    </div>
  )
}
