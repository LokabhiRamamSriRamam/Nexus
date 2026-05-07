import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useLeadStore } from '@/store/leadStore'
import { useZoneStore } from '@/store/zoneStore'
import LeadCard from '@/components/LeadCard'
import LeadDrawer from '@/components/LeadDrawer'
import NexusLoader from '@/components/NexusLoader'

const SELECT_CLS = 'h-8 bg-[#161616] border border-[#2a2a2a] rounded-md px-2 text-xs text-[#ccc] focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer'

export default function SalesPipeline() {
  const { leads, loading, filters, setFilter, setDrawerOpen } = useLeadStore()
  const { zones, fetchZones } = useZoneStore()
  const [search, setSearch] = useState('')

  useEffect(() => {
    setFilter('stage', 'sales-pipeline')
    fetchZones()
  }, [])

  const handleSearch = (val) => {
    setSearch(val)
    setFilter('search', val)
  }

  const hasActiveFilters = filters.priority || filters.zone || filters.search

  const clearFilters = () => {
    setSearch('')
    setFilter('priority', '')
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
            placeholder="Search by name, phone, POC…"
            className="pl-8 h-8 bg-[#161616] border-[#2a2a2a] text-[#f0f0f0] placeholder:text-[#555] text-sm focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0"
          />
        </div>

        <select
          value={filters.priority}
          onChange={(e) => setFilter('priority', e.target.value)}
          className={SELECT_CLS}
        >
          <option value="">All priorities</option>
          <option value="P0">P0 — Urgent</option>
          <option value="P1">P1 — High</option>
          <option value="P2">P2 — Normal</option>
        </select>

        <select
          value={filters.zone}
          onChange={(e) => setFilter('zone', e.target.value)}
          className={SELECT_CLS}
        >
          <option value="">All zones</option>
          {zones.map((z) => (
            <option key={z._id} value={z._id}>{z.name}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-[#666] hover:text-[#aaa] transition-colors"
          >
            <X size={10} /> Clear
          </button>
        )}

        <span className="text-[#666] text-xs ml-auto shrink-0">
          {loading ? '…' : `${leads.length} lead${leads.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <NexusLoader />
      ) : leads.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <p className="text-[#888] text-sm">No leads in pipeline.</p>
          <p className="text-[#555] text-xs mt-1">
            {hasActiveFilters
              ? 'Try clearing your filters.'
              : 'Move leads here from Pre-Sales using the drawer.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead, i) => (
            <LeadCard
              key={lead._id}
              lead={lead}
              index={i}
              onDetailOpen={() => setDrawerOpen(true, lead)}
            />
          ))}
        </div>
      )}

      <LeadDrawer />
    </div>
  )
}
