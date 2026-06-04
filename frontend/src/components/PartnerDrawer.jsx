import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Edit2, Trash2, Phone, Mail, MapPin, Calendar, User, Tag, Clock,
  Globe, ArrowRight, ArrowLeft, Percent, IndianRupee, Handshake, TrendingUp,
} from 'lucide-react'
import dayjs from 'dayjs'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { usePartnerStore } from '@/store/partnerStore'
import InteractionLog from '@/components/InteractionLog'
import { useIsMobile } from '@/lib/useIsMobile'
import toast from 'react-hot-toast'

const PRIORITY_STYLES = {
  P0: 'bg-p0/10 text-p0', P1: 'bg-p1/10 text-p1',
  P2: 'bg-[#1a1a1a] text-[#888]', P3: 'bg-[#161616] text-[#666]', P4: 'bg-[#131313] text-[#555]',
}

const STAGE_LABELS = {
  'pre-sales': 'Prospecting', 'sales-pipeline': 'Negotiating', 'post-sales': 'Active', 'lost': 'Lost',
}

const TYPE_LABELS = {
  reseller: 'Reseller', referral: 'Referral', affiliate: 'Affiliate',
  channel: 'Channel', franchise: 'Franchise', other: 'Partner',
}

function Detail({ icon: Icon, label, value, mono = false }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#1e1e1e] last:border-0">
      <Icon size={13} className="text-[#555] mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-[#e0e0e0] text-sm break-words ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  )
}

/* Stage move footer — partner pipeline */
function StageBar({ partner }) {
  const { updateStage, setDrawerOpen } = usePartnerStore()

  const move = async (stage, label) => {
    try {
      await updateStage(partner._id, stage)
      setDrawerOpen(false)
      toast.success(`Moved to ${label}`)
    } catch {
      toast.error('Stage update failed')
    }
  }

  if (partner.stage === 'pre-sales') {
    return (
      <div className="px-5 py-3 border-t border-[#1e1e1e] flex items-center justify-between">
        <span className="text-[#555] text-xs">Stage: Prospecting</span>
        <span className="text-[11px] text-[#555] italic">Log an intro meeting to advance</span>
      </div>
    )
  }
  if (partner.stage === 'sales-pipeline') {
    return (
      <div className="px-5 py-3 border-t border-[#1e1e1e] flex items-center justify-between gap-2">
        <Button size="sm" variant="outline" onClick={() => move('pre-sales', 'Prospecting')}
          className="h-7 px-3 text-xs border-[#2e2e2e] text-[#888] hover:text-[#ccc] gap-1.5">
          <ArrowLeft size={11} /> Prospecting
        </Button>
        <Button size="sm" variant="outline" onClick={() => move('post-sales', 'Active')}
          className="h-7 px-3 text-xs bg-success/10 text-success border border-success/30 hover:bg-success/20 gap-1.5">
          Mark Active <ArrowRight size={11} />
        </Button>
      </div>
    )
  }
  if (partner.stage === 'post-sales') {
    return (
      <div className="px-5 py-3 border-t border-[#1e1e1e] flex items-center justify-between">
        <span className="text-success text-xs flex items-center gap-1.5"><Handshake size={12} /> Active Partnership</span>
        <Button size="sm" variant="outline" onClick={() => move('sales-pipeline', 'Negotiating')}
          className="h-7 px-3 text-xs border-[#2e2e2e] text-[#888] hover:text-[#ccc] gap-1.5">
          <ArrowLeft size={11} /> Negotiating
        </Button>
      </div>
    )
  }
  return null
}

/* Sourced leads tab */
function SourcedLeads({ partnerId }) {
  const [leads, setLeads] = useState(null)

  useEffect(() => {
    let active = true
    fetch(`/api/partners/${partnerId}/leads`)
      .then((r) => r.json())
      .then((d) => { if (active) setLeads(Array.isArray(d) ? d : []) })
      .catch(() => { if (active) setLeads([]) })
    return () => { active = false }
  }, [partnerId])

  if (leads === null) return <p className="text-[#555] text-xs py-4">Loading…</p>
  if (leads.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-[#555] text-sm">No leads sourced yet.</p>
        <p className="text-[#444] text-xs mt-1">Leads tagged to this partner appear here.</p>
      </div>
    )
  }

  const converted = leads.filter((l) => l.stage === 'post-sales').length

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#0d0d0d] border border-[#252525] rounded-lg p-3">
          <p className="text-[10px] text-[#555] uppercase tracking-wider">Leads Brought</p>
          <p className="text-[#f0f0f0] text-xl font-bold mt-0.5">{leads.length}</p>
        </div>
        <div className="bg-[#0d0d0d] border border-[#252525] rounded-lg p-3">
          <p className="text-[10px] text-[#555] uppercase tracking-wider">Converted</p>
          <p className="text-success text-xl font-bold mt-0.5">{converted}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {leads.map((l) => (
          <div key={l._id} className="flex items-center justify-between gap-2 bg-[#0d0d0d] border border-[#1f1f1f] rounded-md px-3 py-2">
            <div className="min-w-0">
              <p className="text-[#ddd] text-sm truncate">{l.businessName}</p>
              <p className="text-[#555] text-[11px]">{STAGE_LABELS_LEAD[l.stage] ?? l.stage}</p>
            </div>
            {l.stage === 'post-sales' && (
              <span className="text-[10px] text-success bg-success/10 border border-success/30 px-1.5 py-0.5 rounded shrink-0">Won</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const STAGE_LABELS_LEAD = {
  'pre-sales': 'Pre-Sales', 'sales-pipeline': 'Sales Pipeline', 'post-sales': 'Post-Sales', 'lost': 'Lost',
}

export default function PartnerDrawer() {
  const { drawerOpen, selectedPartner, drawerTab, setDrawerOpen, setModalOpen, deletePartner } = usePartnerStore()
  const isMobile = useIsMobile()

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${selectedPartner?.businessName}"? Sourced leads will be kept but unlinked.`)) return
    try {
      await deletePartner(selectedPartner._id)
      toast.success('Partner deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  const handleEdit = () => {
    setDrawerOpen(false)
    setModalOpen(true, selectedPartner)
  }

  const commissionLabel = selectedPartner?.commissionValue > 0
    ? selectedPartner.commissionType === 'flat'
      ? `₹${selectedPartner.commissionValue} per converted lead`
      : `${selectedPartner.commissionValue}% of closed revenue`
    : 'Not set'

  return (
    <>
      <AnimatePresence>
        {drawerOpen && (
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} onClick={() => setDrawerOpen(false)} className="fixed inset-0 bg-black/50 z-40" />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawerOpen && selectedPartner && (
          <motion.div
            key="drawer"
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className={isMobile
              ? 'fixed bottom-0 left-0 right-0 bg-[#111] border-t border-[#222] z-50 flex flex-col shadow-2xl rounded-t-2xl'
              : 'fixed right-0 top-0 h-screen w-[440px] max-w-[94vw] bg-[#111] border-l border-[#222] z-50 flex flex-col shadow-2xl'}
            style={isMobile ? { height: '92dvh' } : undefined}
          >
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-[#333]" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between px-5 py-3 md:py-4 border-b border-[#1e1e1e] shrink-0">
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PRIORITY_STYLES[selectedPartner.priority] ?? PRIORITY_STYLES.P2}`}>
                    {selectedPartner.priority}
                  </span>
                  <span className="text-[10px] text-[#555]">{TYPE_LABELS[selectedPartner.partnerType] ?? 'Partner'}</span>
                  <span className="text-[10px] text-[#666] px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#2a2a2a]">
                    {STAGE_LABELS[selectedPartner.stage] ?? selectedPartner.stage}
                  </span>
                </div>
                <h2 className="font-display font-semibold text-[#f0f0f0] text-base leading-snug truncate flex items-center gap-1.5">
                  <Handshake size={15} className="text-[#666] shrink-0" />
                  {selectedPartner.businessName}
                </h2>
                {selectedPartner.zone?.name && <p className="text-[#666] text-xs mt-0.5">{selectedPartner.zone.name}</p>}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Button variant="ghost" size="icon" onClick={handleEdit} className="h-7 w-7 text-[#666] hover:text-[#ccc]"><Edit2 size={13} /></Button>
                <Button variant="ghost" size="icon" onClick={handleDelete} className="h-7 w-7 text-[#666] hover:text-p0"><Trash2 size={13} /></Button>
                <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)} className="h-7 w-7 text-[#666] hover:text-[#ccc]"><X size={13} /></Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs key={drawerTab + selectedPartner._id} defaultValue={drawerTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
              <TabsList className="mx-5 mt-3 bg-[#1a1a1a] border border-[#2a2a2a] h-8 p-0.5 rounded-md grid grid-cols-3 shrink-0">
                {['details', 'interactions', 'leads'].map((t) => (
                  <TabsTrigger key={t} value={t}
                    className="text-xs capitalize data-[state=active]:bg-[#111] data-[state=active]:text-[#f0f0f0] text-[#666] rounded h-7">
                    {t === 'leads' ? 'Leads' : t}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Details */}
              <TabsContent value="details" className="flex-1 overflow-y-auto px-5 py-1 mt-2 data-[state=inactive]:hidden">
                <Detail icon={User} label="Contact Person" value={selectedPartner.contactName} />
                <Detail icon={Phone} label="Phone" value={selectedPartner.phone} mono />
                <Detail icon={Mail} label="Email" value={selectedPartner.email} />
                {selectedPartner.website && (
                  <div className="flex items-start gap-3 py-2.5 border-b border-[#1e1e1e]">
                    <Globe size={13} className="text-[#555] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">Website</p>
                      <a href={selectedPartner.website.startsWith('http') ? selectedPartner.website : `https://${selectedPartner.website}`}
                        target="_blank" rel="noreferrer" className="text-info text-sm hover:underline">{selectedPartner.website}</a>
                    </div>
                  </div>
                )}
                <Detail icon={MapPin} label="Address" value={selectedPartner.address} />
                <Detail icon={User} label="Internal POC" value={selectedPartner.internalPOC} />

                {/* Commission */}
                <div className="flex items-start gap-3 py-2.5 border-b border-[#1e1e1e]">
                  {selectedPartner.commissionType === 'flat'
                    ? <IndianRupee size={13} className="text-accent mt-0.5 shrink-0" />
                    : <Percent size={13} className="text-accent mt-0.5 shrink-0" />}
                  <div>
                    <p className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">Commission</p>
                    <p className="text-[#e0e0e0] text-sm">{commissionLabel}</p>
                  </div>
                </div>

                <Detail icon={Tag} label="Outcome" value={selectedPartner.outcome} />
                {selectedPartner.followUpDate && (
                  <Detail icon={Calendar} label="Follow-up"
                    value={`${dayjs(selectedPartner.followUpDate).format('D MMM YYYY')}${selectedPartner.followUpTime ? ' · ' + selectedPartner.followUpTime : ''}`} />
                )}
                {selectedPartner.activatedAt && (
                  <Detail icon={TrendingUp} label="Active Since" value={dayjs(selectedPartner.activatedAt).format('D MMM YYYY')} />
                )}
                {selectedPartner.notes && (
                  <div className="py-2.5 border-b border-[#1e1e1e] last:border-0">
                    <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1.5">Notes</p>
                    <p className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap">{selectedPartner.notes}</p>
                  </div>
                )}
                <Detail icon={Clock} label="Added" value={dayjs(selectedPartner.createdAt).format('D MMM YYYY, h:mm A')} />
              </TabsContent>

              {/* Interactions */}
              <TabsContent value="interactions" className="flex-1 overflow-hidden data-[state=inactive]:hidden min-h-0">
                <InteractionLog partnerId={selectedPartner._id} leadStage={selectedPartner.stage} />
              </TabsContent>

              {/* Sourced leads */}
              <TabsContent value="leads" className="flex-1 overflow-y-auto px-5 py-3 data-[state=inactive]:hidden">
                <SourcedLeads partnerId={selectedPartner._id} />
              </TabsContent>
            </Tabs>

            <StageBar partner={selectedPartner} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
