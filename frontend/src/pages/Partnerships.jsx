import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X, Plus, BarChart3, Users, IndianRupee, Percent, Handshake } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { usePartnerStore } from '@/store/partnerStore'
import { useZoneStore } from '@/store/zoneStore'
import PartnerCard from '@/components/PartnerCard'
import PartnerDrawer from '@/components/PartnerDrawer'
import PartnerForm from '@/components/PartnerForm'
import NexusLoader from '@/components/NexusLoader'

const SELECT_CLS = 'h-8 bg-[#161616] border border-[#2a2a2a] rounded-md px-2 text-xs text-[#ccc] focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer'

const STAGES = [
  { key: 'pre-sales',      label: 'Prospecting' },
  { key: 'sales-pipeline', label: 'Negotiating' },
  { key: 'post-sales',     label: 'Active' },
]

const fmtINR = (n) => `₹${(n || 0).toLocaleString('en-IN')}`

/* ── Pipeline view ── */
function PipelineView() {
  const { partners, loading, filters, setFilter, setDrawerOpen, setModalOpen } = usePartnerStore()
  const { zones, fetchZones } = useZoneStore()
  const [search, setSearch] = useState('')

  useEffect(() => { fetchZones() }, [])

  const handleSearch = (val) => { setSearch(val); setFilter('search', val) }
  const hasActiveFilters = filters.priority || filters.zone || filters.partnerType || filters.search
  const clearFilters = () => {
    setSearch('')
    setFilter('priority', ''); setFilter('zone', ''); setFilter('partnerType', ''); setFilter('search', '')
  }

  return (
    <>
      {/* Stage tabs */}
      <div className="flex items-center gap-1 bg-[#141414] border border-[#242424] rounded-lg p-1 w-fit">
        {STAGES.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter('stage', s.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filters.stage === s.key ? 'bg-accent text-background' : 'text-[#888] hover:text-[#ccc]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
          <Input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search partners…"
            className="pl-8 h-8 bg-[#161616] border-[#2a2a2a] text-[#f0f0f0] placeholder:text-[#555] text-sm focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0" />
        </div>

        <select value={filters.partnerType} onChange={(e) => setFilter('partnerType', e.target.value)} className={SELECT_CLS}>
          <option value="">All types</option>
          <option value="referral">Referral</option>
          <option value="reseller">Reseller</option>
          <option value="affiliate">Affiliate</option>
          <option value="channel">Channel</option>
          <option value="franchise">Franchise</option>
          <option value="other">Other</option>
        </select>

        <select value={filters.zone} onChange={(e) => setFilter('zone', e.target.value)} className={SELECT_CLS}>
          <option value="">All zones</option>
          {zones.map((z) => <option key={z._id} value={z._id}>{z.name}</option>)}
        </select>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-[#666] hover:text-[#aaa] transition-colors">
            <X size={10} /> Clear
          </button>
        )}

        <span className="text-[#666] text-xs ml-auto shrink-0">
          {loading ? '…' : `${partners.length} partner${partners.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <NexusLoader />
      ) : partners.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <Handshake size={28} className="text-[#333] mx-auto mb-3" />
          <p className="text-[#888] text-sm">No partners in this stage.</p>
          <p className="text-[#555] text-xs mt-1">
            {hasActiveFilters ? 'Try clearing your filters.' : 'Click "Add Partner" to start a partnership.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {partners.map((p, i) => (
            <PartnerCard key={p._id} partner={p} index={i} onDetailOpen={() => setDrawerOpen(true, p)} />
          ))}
        </div>
      )}
    </>
  )
}

/* ── Analytics view ── */
function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-[#141414] border border-[#242424] rounded-lg p-3 md:p-4">
      <div className="flex items-center gap-1.5 text-[#666] mb-1.5">
        <Icon size={13} className={accent} />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[#f0f0f0] text-xl md:text-2xl font-bold">{value}</p>
    </div>
  )
}

function AnalyticsView() {
  const { analytics, fetchAnalytics } = usePartnerStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchAnalytics().finally(() => setLoading(false))
  }, [])

  const { rows, totals } = analytics

  if (loading) return <NexusLoader />

  return (
    <div className="space-y-4">
      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        <StatCard icon={Handshake} label="Active Partners" value={totals.activePartners ?? 0} accent="text-accent" />
        <StatCard icon={Users} label="Leads Sourced" value={totals.leadsBrought ?? 0} accent="text-info" />
        <StatCard icon={Percent} label="Conversion" value={`${totals.conversionRate ?? 0}%`} accent="text-success" />
        <StatCard icon={IndianRupee} label="Attributed Revenue" value={fmtINR(totals.revenue)} accent="text-accent" />
      </div>

      {/* Commission owed banner */}
      <div className="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-lg px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#ccc] text-sm">
          <IndianRupee size={15} className="text-accent" />
          Total commission owed across all partners
        </div>
        <span className="text-accent font-bold text-lg">{fmtINR(totals.commissionOwed)}</span>
      </div>

      {/* Per-partner table */}
      {rows.length === 0 ? (
        <div className="text-center py-16">
          <BarChart3 size={28} className="text-[#333] mx-auto mb-3" />
          <p className="text-[#888] text-sm">No partner data yet.</p>
          <p className="text-[#555] text-xs mt-1">Add partners and tag leads to them to see analytics.</p>
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#242424] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-[#242424] text-[#666] text-[11px] uppercase tracking-wider">
                  <th className="text-left font-medium px-4 py-2.5">Partner</th>
                  <th className="text-right font-medium px-3 py-2.5">Leads</th>
                  <th className="text-right font-medium px-3 py-2.5">Won</th>
                  <th className="text-right font-medium px-3 py-2.5">Conv.</th>
                  <th className="text-right font-medium px-3 py-2.5">Revenue</th>
                  <th className="text-right font-medium px-4 py-2.5">Commission</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-b border-[#1c1c1c] last:border-0 hover:bg-[#181818] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.stage === 'post-sales' ? 'bg-success' : 'bg-[#444]'}`} />
                        <div className="min-w-0">
                          <p className="text-[#e8e8e8] truncate">{r.businessName}</p>
                          <p className="text-[#555] text-[11px] capitalize">
                            {r.partnerType} · {r.commissionType === 'flat' ? `₹${r.commissionValue}/lead` : `${r.commissionValue}%`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right px-3 py-3 text-[#ccc] font-mono">{r.leadsBrought}</td>
                    <td className="text-right px-3 py-3 text-success font-mono">{r.converted}</td>
                    <td className="text-right px-3 py-3 text-[#aaa] font-mono">{r.conversionRate}%</td>
                    <td className="text-right px-3 py-3 text-[#ccc] font-mono">{fmtINR(r.revenue)}</td>
                    <td className="text-right px-4 py-3 text-accent font-mono font-semibold">{fmtINR(r.commissionOwed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Page ── */
export default function Partnerships() {
  const { fetchPartners, setModalOpen } = usePartnerStore()
  const [view, setView] = useState('pipeline')

  useEffect(() => { fetchPartners() }, [])

  return (
    <div className="p-3 md:p-5 space-y-3 md:space-y-4">
      {/* Header: view toggle + add */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-[#141414] border border-[#242424] rounded-lg p-1">
          {[{ k: 'pipeline', l: 'Pipeline', icon: Handshake }, { k: 'analytics', l: 'Analytics', icon: BarChart3 }].map(({ k, l, icon: Icon }) => (
            <button key={k} onClick={() => setView(k)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === k ? 'bg-accent text-background' : 'text-[#888] hover:text-[#ccc]'
              }`}>
              <Icon size={13} /> {l}
            </button>
          ))}
        </div>

        <Button size="sm" onClick={() => setModalOpen(true)}
          className="bg-accent text-background hover:bg-accent/90 font-semibold text-xs h-8 px-3 gap-1.5">
          <Plus size={13} /> <span className="hidden xs:inline">Add Partner</span>
        </Button>
      </div>

      {view === 'pipeline' ? <PipelineView /> : <AnalyticsView />}

      <PartnerDrawer />
      <PartnerForm />
    </div>
  )
}
