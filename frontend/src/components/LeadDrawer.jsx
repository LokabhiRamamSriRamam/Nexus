import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Edit2, Trash2, Phone, Mail, MapPin, Calendar, User, Tag, Clock, ExternalLink, ArrowRight, ArrowLeft, IndianRupee, RefreshCw, Plus, Download } from 'lucide-react'
import dayjs from 'dayjs'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useLeadStore } from '@/store/leadStore'
import { useDealStore } from '@/store/dealStore'
import InteractionLog from '@/components/InteractionLog'
import DealForm from '@/components/DealForm'
import { printInvoice } from '@/lib/printInvoice'
import { useIsMobile } from '@/lib/useIsMobile'
import toast from 'react-hot-toast'

const PRIORITY_STYLES = {
  P0: 'bg-p0/10 text-p0',
  P1: 'bg-p1/10 text-p1',
  P2: 'bg-[#1a1a1a] text-[#888]',
  P3: 'bg-[#161616] text-[#666]',
  P4: 'bg-[#131313] text-[#555]',
}

const SOURCE_LABELS = {
  call: 'Call', mail: 'Mail', referral: 'Referral', 'walk-in': 'Walk-in', partnership: 'Partnership', other: 'Other',
}

const STAGE_LABELS = {
  'pre-sales': 'Pre-Sales',
  'sales-pipeline': 'Sales Pipeline',
  'post-sales': 'Post-Sales',
  'lost': 'Lost',
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

/* Stage move footer */
function StageBar({ lead }) {
  const { updateStage, setDrawerOpen } = useLeadStore()

  const move = async (stage, label) => {
    try {
      await updateStage(lead._id, stage)
      setDrawerOpen(false)
      toast.success(`Moved to ${label}`)
    } catch {
      toast.error('Stage update failed')
    }
  }

  if (lead.stage === 'pre-sales') {
    return (
      <div className="px-5 py-3 border-t border-[#1e1e1e] flex items-center justify-between">
        <span className="text-[#555] text-xs">Stage: Pre-Sales</span>
        <span className="text-[11px] text-[#555] italic">Log a demo to advance</span>
      </div>
    )
  }

  if (lead.stage === 'sales-pipeline') {
    return (
      <div className="px-5 py-3 border-t border-[#1e1e1e] flex items-center justify-between gap-2">
        <Button
          size="sm"
          onClick={() => move('pre-sales', 'Pre-Sales')}
          className="h-7 px-3 text-xs border-[#2e2e2e] text-[#888] hover:text-[#ccc] gap-1.5"
          variant="outline"
        >
          <ArrowLeft size={11} /> Back to Pre-Sales
        </Button>
        <Button
          size="sm"
          onClick={() => move('post-sales', 'Post-Sales')}
          className="h-7 px-3 text-xs bg-success/10 text-success border border-success/30 hover:bg-success/20 gap-1.5"
          variant="outline"
        >
          Move to Post-Sales <ArrowRight size={11} />
        </Button>
      </div>
    )
  }

  if (lead.stage === 'post-sales') {
    return (
      <div className="px-5 py-3 border-t border-[#1e1e1e] flex items-center justify-between">
        <span className="text-[#555] text-xs">Stage: Post-Sales</span>
        <Button
          size="sm"
          onClick={() => move('sales-pipeline', 'Sales Pipeline')}
          className="h-7 px-3 text-xs border-[#2e2e2e] text-[#888] hover:text-[#ccc] gap-1.5"
          variant="outline"
        >
          <ArrowLeft size={11} /> Back to Pipeline
        </Button>
      </div>
    )
  }

  return null
}

export default function LeadDrawer() {
  const { drawerOpen, selectedLead, drawerTab, setDrawerOpen, setModalOpen, deleteLead } = useLeadStore()
  const { byLead, fetchDeal } = useDealStore()
  const [dealFormOpen, setDealFormOpen] = useState(false)
  const isMobile = useIsMobile()

  const isPostSales    = selectedLead?.stage === 'post-sales'
  const isSalesPipeline = selectedLead?.stage === 'sales-pipeline'
  const hasDealTab     = isPostSales || isSalesPipeline
  const deal = selectedLead ? byLead[selectedLead._id] : undefined

  useEffect(() => {
    if (hasDealTab && selectedLead && byLead[selectedLead._id] === undefined) {
      fetchDeal(selectedLead._id)
    }
  }, [selectedLead?._id, hasDealTab])

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${selectedLead?.businessName}"? This cannot be undone.`)) return
    try {
      await deleteLead(selectedLead._id)
      toast.success('Lead deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  const handleEdit = () => {
    setDrawerOpen(false)
    setModalOpen(true, selectedLead)
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {drawerOpen && selectedLead && (
          <motion.div
            key="drawer"
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className={
              isMobile
                ? 'fixed bottom-0 left-0 right-0 bg-[#111] border-t border-[#222] z-50 flex flex-col shadow-2xl rounded-t-2xl'
                : 'fixed right-0 top-0 h-screen w-[440px] max-w-[94vw] bg-[#111] border-l border-[#222] z-50 flex flex-col shadow-2xl'
            }
            style={isMobile ? { height: '92dvh' } : undefined}
          >
            {/* Mobile drag handle */}
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-[#333]" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between px-5 py-3 md:py-4 border-b border-[#1e1e1e] shrink-0">
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PRIORITY_STYLES[selectedLead.priority] ?? PRIORITY_STYLES.P2}`}>
                    {selectedLead.priority}
                  </span>
                  {selectedLead.source && (
                    <span className="text-[10px] text-[#555]">
                      via {SOURCE_LABELS[selectedLead.source] ?? selectedLead.source}
                      {selectedLead.source === 'partnership' && selectedLead.partnerId?.businessName
                        ? `: ${selectedLead.partnerId.businessName}` : ''}
                    </span>
                  )}
                  <span className="text-[10px] text-[#666] px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#2a2a2a]">
                    {STAGE_LABELS[selectedLead.stage] ?? selectedLead.stage}
                  </span>
                </div>
                <h2 className="font-display font-semibold text-[#f0f0f0] text-base leading-snug truncate">
                  {selectedLead.businessName}
                </h2>
                {selectedLead.zone?.name && (
                  <p className="text-[#666] text-xs mt-0.5">{selectedLead.zone.name}</p>
                )}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Button variant="ghost" size="icon" onClick={handleEdit} className="h-7 w-7 text-[#666] hover:text-[#ccc]">
                  <Edit2 size={13} />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDelete} className="h-7 w-7 text-[#666] hover:text-p0">
                  <Trash2 size={13} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)} className="h-7 w-7 text-[#666] hover:text-[#ccc]">
                  <X size={13} />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs key={drawerTab + selectedLead._id} defaultValue={drawerTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
              <TabsList className={`mx-5 mt-3 bg-[#1a1a1a] border border-[#2a2a2a] h-8 p-0.5 rounded-md grid shrink-0 ${hasDealTab ? 'grid-cols-4' : 'grid-cols-3'}`}>
                {[
                  'details', 'interactions', 'reminders',
                  ...(hasDealTab ? ['deal'] : []),
                ].map((t) => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className="text-xs capitalize data-[state=active]:bg-[#111] data-[state=active]:text-[#f0f0f0] text-[#666] rounded h-7"
                  >
                    {t}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Details tab */}
              <TabsContent value="details" className="flex-1 overflow-y-auto px-5 py-1 mt-2 data-[state=inactive]:hidden">
                <Detail icon={Phone} label="Phone" value={selectedLead.phone} mono />
                <Detail icon={Mail} label="Email" value={selectedLead.email} />
                <Detail icon={User} label="Client POC" value={selectedLead.clientPOC} />
                <Detail icon={User} label="Internal POC" value={selectedLead.internalPOC} />
                <Detail icon={MapPin} label="Address" value={selectedLead.address} />

                {selectedLead.mapsLink && (
                  <div className="flex items-start gap-3 py-2.5 border-b border-[#1e1e1e]">
                    <ExternalLink size={13} className="text-[#555] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">Maps</p>
                      <a href={selectedLead.mapsLink} target="_blank" rel="noreferrer" className="text-info text-sm hover:underline">
                        View on Google Maps
                      </a>
                    </div>
                  </div>
                )}

                <Detail icon={Tag} label="Outcome" value={selectedLead.outcome} />
                {selectedLead.followUpDate && (
                  <Detail
                    icon={Calendar}
                    label="Follow-up"
                    value={`${dayjs(selectedLead.followUpDate).format('D MMM YYYY')}${selectedLead.followUpTime ? ' · ' + selectedLead.followUpTime : ''}`}
                  />
                )}
                {selectedLead.notes && (
                  <div className="py-2.5 border-b border-[#1e1e1e] last:border-0">
                    <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1.5">Notes</p>
                    <p className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap">{selectedLead.notes}</p>
                  </div>
                )}
                <Detail icon={Clock} label="Created" value={dayjs(selectedLead.createdAt).format('D MMM YYYY, h:mm A')} />
              </TabsContent>

              {/* Interactions tab */}
              <TabsContent value="interactions" className="flex-1 overflow-hidden data-[state=inactive]:hidden min-h-0">
                <InteractionLog leadId={selectedLead._id} leadStage={selectedLead.stage} />
              </TabsContent>

              {/* Reminders tab */}
              <TabsContent value="reminders" className="px-5 py-10 text-center data-[state=inactive]:hidden">
                <p className="text-[#555] text-sm">Per-lead reminders come in a future phase.</p>
              </TabsContent>

              {/* Deal tab — sales-pipeline + post-sales */}
              {hasDealTab && (
                <TabsContent value="deal" className="flex-1 overflow-y-auto px-5 py-3 data-[state=inactive]:hidden">
                  {deal === undefined ? (
                    <p className="text-[#555] text-xs py-4">Loading…</p>
                  ) : deal === null ? (
                    <div className="py-8 text-center space-y-3">
                      <p className="text-[#555] text-sm">
                        {isSalesPipeline ? 'No deal drafted yet.' : 'No deal logged yet.'}
                      </p>
                      <Button size="sm" onClick={() => setDealFormOpen(true)}
                        className="h-7 px-4 bg-accent text-background hover:bg-accent/90 text-xs font-semibold gap-1.5">
                        <Plus size={11} /> {isSalesPipeline ? 'Draft Deal' : 'Log Deal'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Line items */}
                      {deal.items?.length > 0 && (
                        <div className="bg-[#0d0d0d] border border-[#252525] rounded-lg p-3">
                          <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Items</p>
                          <div className="space-y-1.5">
                            {deal.items.map((it, i) => {
                              const lineTotal   = (it.unitPrice || 0) * (it.qty || 1)
                              const lineNet     = lineTotal - lineTotal * ((it.lineDiscount || 0) / 100)
                              return (
                                <div key={i} className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[#ccc] text-sm truncate">{it.name}</p>
                                    <p className="text-[#555] text-[11px] font-mono">
                                      ₹{(it.unitPrice || 0).toLocaleString('en-IN')} × {it.qty || 1}
                                      {it.lineDiscount > 0 && ` − ${it.lineDiscount}%`}
                                    </p>
                                  </div>
                                  <span className="text-[#888] text-sm font-mono shrink-0 flex items-center gap-0.5">
                                    <IndianRupee size={10} />{lineNet.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )
                            })}
                          </div>

                          {/* Subtotal / discount / tax / total */}
                          <div className="mt-3 pt-2.5 border-t border-[#1e1e1e] space-y-1 text-xs font-mono">
                            <div className="flex justify-between text-[#666]">
                              <span>Subtotal</span>
                              <span>₹ {(deal.subtotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                            </div>
                            {(deal.discountAmount || 0) > 0 && (
                              <div className="flex justify-between text-amber-500">
                                <span>Discount ({deal.discountType === 'flat' ? '₹ flat' : `${deal.discountValue}%`})</span>
                                <span>− ₹ {(deal.discountAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            {(deal.taxAmount || 0) > 0 && (
                              <div className="flex justify-between text-[#666]">
                                <span>GST ({deal.taxRate}%)</span>
                                <span>+ ₹ {(deal.taxAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-[#f0f0f0] font-bold pt-1 border-t border-[#252525] text-sm">
                              <span>Total</span>
                              <span className="flex items-center gap-0.5">
                                <IndianRupee size={11} />{(deal.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Renewal date */}
                      {deal.renewalDate && (
                        <div className="flex items-center gap-3 py-2.5 border-b border-[#1e1e1e]">
                          <RefreshCw size={13} className="text-[#555] shrink-0" />
                          <div>
                            <p className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">Renewal</p>
                            <p className="text-[#e0e0e0] text-sm">{dayjs(deal.renewalDate).format('D MMM YYYY')}</p>
                          </div>
                        </div>
                      )}

                      {/* Referred by */}
                      {deal.referredBy?.businessName && (
                        <div className="flex items-center gap-3 py-2.5 border-b border-[#1e1e1e]">
                          <User size={13} className="text-[#555] shrink-0" />
                          <div>
                            <p className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">Referred by</p>
                            <p className="text-[#e0e0e0] text-sm">{deal.referredBy.businessName}</p>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {deal.notes && (
                        <div className="py-2.5">
                          <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1.5">Notes</p>
                          <p className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap">{deal.notes}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setDealFormOpen(true)}
                          className="flex-1 h-8 border-[#2e2e2e] text-[#888] hover:text-[#f0f0f0] hover:border-[#444] text-xs">
                          Edit Deal
                        </Button>
                        <Button size="sm" variant="outline"
                          onClick={() => printInvoice(deal, selectedLead)}
                          className="h-8 px-3 border-[#2e2e2e] text-[#888] hover:text-accent hover:border-accent/40 text-xs gap-1.5">
                          <Download size={11} /> Invoice
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>

            {/* Deal form modal */}
            {hasDealTab && (
              <DealForm
                open={dealFormOpen}
                onClose={() => setDealFormOpen(false)}
                leadId={selectedLead._id}
                existingDeal={deal || null}
              />
            )}

            {/* Stage progression bar */}
            <StageBar lead={selectedLead} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
