import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { usePartnerStore } from '@/store/partnerStore'
import { useZoneStore } from '@/store/zoneStore'
import { useSalesRepStore } from '@/store/salesRepStore'
import DatePicker from '@/components/ui/DatePicker'
import toast from 'react-hot-toast'

const COUNTRY_CODES = [
  { code: '+91',  label: 'IN +91'  },
  { code: '+1',   label: 'US +1'   },
  { code: '+44',  label: 'GB +44'  },
  { code: '+971', label: 'AE +971' },
  { code: '+65',  label: 'SG +65'  },
]

const PARTNER_TYPES = [
  { v: 'referral',  l: 'Referral'  },
  { v: 'reseller',  l: 'Reseller'  },
  { v: 'affiliate', l: 'Affiliate' },
  { v: 'channel',   l: 'Channel'   },
  { v: 'franchise', l: 'Franchise' },
  { v: 'other',     l: 'Other'     },
]

const EMPTY = {
  businessName: '',
  contactName: '',
  countryCode: '+91',
  phone: '',
  email: '',
  website: '',
  address: '',
  partnerType: 'referral',
  commissionType: 'percent',
  commissionValue: '',
  internalPOC: '',
  zone: '',
  priority: 'P2',
  followUpDate: '',
  notes: '',
}

const inputCls  = 'bg-[#0d0d0d] border-[#2e2e2e] text-[#f0f0f0] placeholder:text-[#555] text-sm h-9 focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:border-accent/50'
const selectCls = 'w-full bg-[#0d0d0d] border border-[#2e2e2e] rounded-md px-3 h-9 text-sm text-[#f0f0f0] focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent/50'

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[#aaaaaa] text-[11px] font-medium tracking-wide">{label}</Label>
      {children}
    </div>
  )
}

export default function PartnerForm() {
  const { modalOpen, editingPartner, setModalOpen, createPartner, updatePartner } = usePartnerStore()
  const { zones, fetchZones } = useZoneStore()
  const { reps, fetchReps } = useSalesRepStore()
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!modalOpen) return
    fetchZones()
    fetchReps()
    if (editingPartner) {
      let storedPhone = editingPartner.phone || ''
      let storedCode = '+91'
      for (const { code } of COUNTRY_CODES) {
        if (storedPhone.startsWith(code + ' ')) { storedCode = code; storedPhone = storedPhone.slice(code.length + 1); break }
      }
      setForm({
        businessName:    editingPartner.businessName || '',
        contactName:     editingPartner.contactName || '',
        countryCode:     storedCode,
        phone:           storedPhone,
        email:           editingPartner.email || '',
        website:         editingPartner.website || '',
        address:         editingPartner.address || '',
        partnerType:     editingPartner.partnerType || 'referral',
        commissionType:  editingPartner.commissionType || 'percent',
        commissionValue: editingPartner.commissionValue ?? '',
        internalPOC:     editingPartner.internalPOC || '',
        zone:            editingPartner.zone?._id || editingPartner.zone || '',
        priority:        editingPartner.priority || 'P2',
        followUpDate:    editingPartner.followUpDate ? editingPartner.followUpDate.split('T')[0] : '',
        notes:           editingPartner.notes || '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [modalOpen, editingPartner])

  const submit = async () => {
    if (!form.businessName.trim()) { toast.error('Partner name is required'); return }
    setSubmitting(true)
    try {
      const payload = { ...form }
      payload.phone = form.phone.trim() ? `${form.countryCode} ${form.phone.trim()}` : ''
      delete payload.countryCode
      payload.commissionValue = Number(form.commissionValue) || 0
      if (!payload.zone)         delete payload.zone
      if (!payload.followUpDate) delete payload.followUpDate
      if (!payload.phone)        delete payload.phone

      if (editingPartner) {
        await updatePartner(editingPartner._id, payload)
        toast.success('Partner updated')
      } else {
        await createPartner(payload)
        toast.success('Partner added')
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) setModalOpen(false) }}>
      <DialogContent className="bg-surface border-border p-0 gap-0 max-w-lg">
        <DialogHeader className="px-5 py-4 border-b border-border">
          <DialogTitle className="font-display font-semibold text-text-primary text-sm">
            {editingPartner ? 'Edit Partner' : 'New Partner'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
          <Field label="Partner / Organization Name *">
            <Input className={inputCls} value={form.businessName}
              onChange={(e) => setField('businessName', e.target.value)} placeholder="e.g. Acme Partners LLP" autoFocus />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact Person">
              <Input className={inputCls} value={form.contactName}
                onChange={(e) => setField('contactName', e.target.value)} placeholder="Their POC" />
            </Field>
            <Field label="Partner Type">
              <select className={selectCls} value={form.partnerType} onChange={(e) => setField('partnerType', e.target.value)}>
                {PARTNER_TYPES.map(({ v, l }) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Phone">
            <div className="flex gap-2">
              <select value={form.countryCode} onChange={(e) => setField('countryCode', e.target.value)}
                className="bg-[#0d0d0d] border border-[#2e2e2e] rounded-md px-2 h-9 text-sm text-[#f0f0f0] focus:outline-none focus:ring-1 focus:ring-accent shrink-0 w-28">
                {COUNTRY_CODES.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
              </select>
              <Input className={inputCls + ' flex-1'} value={form.phone}
                onChange={(e) => setField('phone', e.target.value)} placeholder="98765 43210" />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input className={inputCls} type="email" value={form.email}
                onChange={(e) => setField('email', e.target.value)} placeholder="contact@partner.com" />
            </Field>
            <Field label="Website">
              <Input className={inputCls} value={form.website}
                onChange={(e) => setField('website', e.target.value)} placeholder="partner.com" />
            </Field>
          </div>

          {/* Commission / revenue-share */}
          <div className="bg-[#0a0a0a] border border-[#252525] rounded-lg p-3 space-y-3">
            <p className="text-[10px] text-[#666] uppercase tracking-wider">Commission / Revenue-share</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <div className="flex gap-1.5">
                  {[{ v: 'percent', l: '% of revenue' }, { v: 'flat', l: '₹ / lead' }].map(({ v, l }) => (
                    <button key={v} type="button" onClick={() => setField('commissionType', v)}
                      className={`flex-1 py-1.5 rounded-md text-xs border transition-colors ${
                        form.commissionType === v ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-[#0d0d0d] border-[#2e2e2e] text-[#888] hover:border-[#444]'
                      }`}>
                      {l}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={form.commissionType === 'flat' ? 'Amount per converted lead (₹)' : 'Rate (% of closed revenue)'}>
                <Input className={inputCls} type="number" min="0" value={form.commissionValue}
                  onChange={(e) => setField('commissionValue', e.target.value)} placeholder={form.commissionType === 'flat' ? '500' : '10'} />
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Internal POC">
              <select className={selectCls} value={form.internalPOC} onChange={(e) => setField('internalPOC', e.target.value)}>
                <option value="">Select sales rep</option>
                {reps.map((r) => <option key={r._id} value={r.name}>{r.name}</option>)}
              </select>
            </Field>
            <Field label="Zone">
              <select className={selectCls} value={form.zone} onChange={(e) => setField('zone', e.target.value)}>
                <option value="">No zone</option>
                {zones.map((z) => <option key={z._id} value={z._id}>{z.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <select className={selectCls} value={form.priority} onChange={(e) => setField('priority', e.target.value)}>
                {['P0', 'P1', 'P2', 'P3', 'P4'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="First Follow-up">
              <DatePicker value={form.followUpDate} onChange={(v) => setField('followUpDate', v)} />
            </Field>
          </div>

          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} rows={2}
              placeholder="Partnership context, terms discussed…"
              className="w-full bg-[#0d0d0d] border border-[#2e2e2e] rounded-md px-3 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#555] resize-none focus:outline-none focus:ring-1 focus:ring-accent" />
          </Field>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-border">
          <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}
            className="text-text-secondary hover:text-text-primary text-xs h-7">
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={submitting}
            className="bg-accent text-background hover:bg-accent/90 text-xs font-semibold h-7 px-4">
            {submitting ? 'Saving…' : editingPartner ? 'Update Partner' : 'Add Partner'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
