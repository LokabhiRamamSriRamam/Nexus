import { useEffect, useState } from 'react'
import { Search, FlaskConical, AlertTriangle, Clock, CheckCircle2, User, Phone } from 'lucide-react'
import { Input } from '@/components/ui/input'
import dayjs from 'dayjs'
import { useLeadStore } from '@/store/leadStore'
import { useZoneStore } from '@/store/zoneStore'
import LeadDrawer from '@/components/LeadDrawer'
import NexusLoader from '@/components/NexusLoader'

const SELECT_CLS = 'h-8 bg-[#161616] border border-[#2a2a2a] rounded-md px-2 text-xs text-[#ccc] focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer'

const PRIORITY_CLS = {
  P0: 'bg-p0/10 text-p0 border-p0/30',
  P1: 'bg-p1/10 text-p1 border-p1/30',
  P2: 'bg-[#1a1a1a] text-[#888] border-[#2a2a2a]',
  P3: 'bg-[#161616] text-[#666] border-[#222]',
  P4: 'bg-[#131313] text-[#555] border-[#1e1e1e]',
}

function trialMeta(lead) {
  if (!lead.trialEndDate) return { daysLeft: null, expired: false, label: '—', color: '#666' }
  const daysLeft = dayjs(lead.trialEndDate).diff(dayjs(), 'day')
  const expired  = daysLeft < 0
  const label    = expired
    ? `Expired ${Math.abs(daysLeft)}d ago`
    : daysLeft === 0 ? 'Expires today'
    : `${daysLeft}d left`
  const color    = expired ? '#FF4444' : daysLeft <= 3 ? '#FF8C00' : '#22C55E'
  return { daysLeft, expired, label, color }
}

function TrialCard({ lead, onDetailOpen }) {
  const meta = trialMeta(lead)
  return (
    <div
      onClick={onDetailOpen}
      className="flex items-center gap-3 px-4 py-3 bg-[#0e0e0e] border border-[#1f1f1f] rounded-lg hover:border-[#2e2e2e] hover:bg-[#121212] transition-colors cursor-pointer"
    >
      {/* Priority */}
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${PRIORITY_CLS[lead.priority] ?? PRIORITY_CLS.P2}`}>
        {lead.priority}
      </span>

      {/* Name + contact */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <User size={12} className="text-[#555] shrink-0" />
        <div className="min-w-0">
          <p className="text-[#e8e8e8] text-sm truncate leading-tight">{lead.businessName}</p>
          {lead.clientPOC && <p className="text-[#555] text-[11px] truncate">{lead.clientPOC}</p>}
        </div>
      </div>

      {/* Phone */}
      {lead.phone && (
        <span className="hidden sm:flex items-center gap-1 text-[#555] text-[11px] font-mono shrink-0">
          <Phone size={10} /> {lead.phone}
        </span>
      )}

      {/* Trial chip */}
      {meta.daysLeft !== null && (
        <span
          className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border shrink-0"
          style={{ color: meta.color, borderColor: meta.color + '50', backgroundColor: meta.color + '15' }}
        >
          {meta.expired ? <AlertTriangle size={9} /> : <Clock size={9} />}
          {meta.label}
        </span>
      )}

      {/* Trial duration */}
      {lead.trialDays && (
        <span className="hidden md:block text-[#444] text-[11px] shrink-0">{lead.trialDays}d trial</span>
      )}
    </div>
  )
}

export default function FreeTrial() {
  const { leads, loading, filters, fetchLeads, setFilter, setDrawerOpen } = useLeadStore()
  const { zones, fetchZones } = useZoneStore()
  const [search, setSearch] = useState(filters.search || '')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    setFilter('stage', 'free-trial')
    fetchZones()
  }, [])

  const handleSearch = (v) => {
    setSearch(v)
    setFilter('search', v)
  }

  /* Client-side active/expired filter */
  const filtered = leads.filter((l) => {
    if (statusFilter === 'all') return true
    const { expired } = trialMeta(l)
    return statusFilter === 'active' ? !expired : expired
  })

  const activeCount  = leads.filter((l) => !trialMeta(l).expired).length
  const expiredCount = leads.filter((l) => trialMeta(l).expired).length

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FlaskConical size={20} className="text-amber-400 shrink-0" />
        <div>
          <h1 className="font-display font-bold text-[#f0f0f0] text-xl leading-tight">Free Trials</h1>
          <p className="text-[#555] text-xs mt-0.5">{leads.length} active trial{leads.length !== 1 ? 's' : ''} · {expiredCount} expired</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 bg-[#141414] border border-[#242424] rounded-lg p-1 w-fit">
        {[
          { k: 'all',     label: `All (${leads.length})` },
          { k: 'active',  label: `Active (${activeCount})`,   color: 'text-success' },
          { k: 'expired', label: `Expired (${expiredCount})`, color: 'text-p0' },
        ].map(({ k, label, color }) => (
          <button
            key={k}
            onClick={() => setStatusFilter(k)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === k
                ? 'bg-accent text-background'
                : `text-[#888] hover:text-[#ccc] ${color ?? ''}`
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555]" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search…"
            className="h-8 pl-8 bg-[#161616] border-[#2a2a2a] text-xs text-[#ccc] placeholder:text-[#444] focus-visible:ring-accent"
          />
        </div>
        <select value={filters.zone || ''} onChange={(e) => setFilter('zone', e.target.value)} className={SELECT_CLS}>
          <option value="">All Zones</option>
          {zones.map((z) => <option key={z._id} value={z._id}>{z.name}</option>)}
        </select>
        <select value={filters.priority || ''} onChange={(e) => setFilter('priority', e.target.value)} className={SELECT_CLS}>
          <option value="">All Priorities</option>
          {['P0', 'P1', 'P2', 'P3', 'P4'].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filters.internalPOC || ''} onChange={(e) => setFilter('internalPOC', e.target.value)} className={SELECT_CLS}>
          <option value="">All Reps</option>
          {[...new Set(leads.map((l) => l.internalPOC).filter(Boolean))].map((rep) => (
            <option key={rep} value={rep}>{rep}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <NexusLoader />
      ) : filtered.length === 0 ? (
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl py-16 flex flex-col items-center gap-3">
          <CheckCircle2 size={22} className="text-[#333]" />
          <p className="text-[#555] text-sm">
            {statusFilter === 'expired' ? 'No expired trials.' : 'No free trials yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => (
            <TrialCard
              key={lead._id}
              lead={lead}
              onDetailOpen={() => setDrawerOpen(true, lead)}
            />
          ))}
        </div>
      )}

      <LeadDrawer />
    </div>
  )
}
