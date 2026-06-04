import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, ChevronDown, Calendar } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useLeadStore } from '@/store/leadStore'
import { useZoneStore } from '@/store/zoneStore'
import { useSalesRepStore } from '@/store/salesRepStore'
import DatePicker from '@/components/ui/DatePicker'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'

const STEPS = ['Business Info', 'Contact & POC', 'Classification', 'Follow-up']

const COUNTRY_CODES = [
  { code: '+91',  label: 'IN +91'  },
  { code: '+1',   label: 'US +1'   },
  { code: '+44',  label: 'GB +44'  },
  { code: '+971', label: 'AE +971' },
  { code: '+61',  label: 'AU +61'  },
  { code: '+65',  label: 'SG +65'  },
  { code: '+60',  label: 'MY +60'  },
  { code: '+974', label: 'QA +974' },
  { code: '+966', label: 'SA +966' },
  { code: '+49',  label: 'DE +49'  },
]

/* Generate half-hour time slots from 6:00 AM to 10:00 PM */
const TIME_SLOTS = (() => {
  const slots = []
  for (let h = 6; h <= 22; h++) {
    for (const m of [0, 30]) {
      if (h === 22 && m === 30) break
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const value = `${hh}:${mm}`
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
      const ampm = h < 12 ? 'AM' : 'PM'
      slots.push({ value, label: `${hour12}:${mm} ${ampm}` })
    }
  }
  return slots
})()

const EMPTY = {
  businessName: '',
  mapsLink: '',
  address: '',
  countryCode: '+91',
  phone: '',
  email: '',
  clientPOC: '',
  internalPOC: '',
  priority: 'P2',
  zone: '',
  source: 'call',
  partnerId: '',
  followUpDate: '',
  followUpTime: '',
  notes: '',
}

export default function LeadForm() {
  const { modalOpen, editingLead, setModalOpen, createLead, updateLead } = useLeadStore()
  const { zones, fetchZones } = useZoneStore()
  const { reps, fetchReps } = useSalesRepStore()
  const [step, setStep] = useState(0)
  const [form, setFormState] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [partners, setPartners] = useState([])

  const setField = (key, value) => setFormState((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    if (!modalOpen) return
    fetchZones()
    fetchReps()
    fetch('/api/partners/active')
      .then((r) => r.json())
      .then((d) => setPartners(Array.isArray(d) ? d : []))
      .catch(() => setPartners([]))
    if (editingLead) {
      // Parse stored phone: strip leading country code if present
      let storedPhone = editingLead.phone || ''
      let storedCode = '+91'
      for (const { code } of COUNTRY_CODES) {
        if (storedPhone.startsWith(code + ' ')) {
          storedCode = code
          storedPhone = storedPhone.slice(code.length + 1)
          break
        }
      }
      setFormState({
        businessName: editingLead.businessName || '',
        mapsLink:     editingLead.mapsLink || '',
        address:      editingLead.address || '',
        countryCode:  storedCode,
        phone:        storedPhone,
        email:        editingLead.email || '',
        clientPOC:    editingLead.clientPOC || '',
        internalPOC:  editingLead.internalPOC || '',
        priority:     editingLead.priority || 'P2',
        zone:         editingLead.zone?._id || editingLead.zone || '',
        source:       editingLead.source || 'call',
        partnerId:    editingLead.partnerId?._id || editingLead.partnerId || '',
        followUpDate: editingLead.followUpDate ? editingLead.followUpDate.split('T')[0] : '',
        followUpTime: editingLead.followUpTime || '',
        notes:        editingLead.notes || '',
      })
    } else {
      setFormState(EMPTY)
    }
    setStep(0)
    setErrors({})
  }, [modalOpen, editingLead])

  const validate = () => {
    const e = {}
    if (step === 0 && !form.businessName.trim()) e.businessName = 'Business name is required'
    return e
  }

  const next = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setStep((s) => s + 1)
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      const payload = { ...form }
      // Combine country code + phone into one field
      payload.phone = form.phone.trim() ? `${form.countryCode} ${form.phone.trim()}` : ''
      delete payload.countryCode
      if (!payload.zone)         delete payload.zone
      if (!payload.followUpDate) delete payload.followUpDate
      if (!payload.followUpTime) delete payload.followUpTime
      if (!payload.phone)        delete payload.phone
      // Only attribute to a partner when source is partnership
      if (payload.source !== 'partnership' || !payload.partnerId) delete payload.partnerId

      if (editingLead) {
        await updateLead(editingLead._id, payload)
        toast.success('Lead updated')
      } else {
        await createLead(payload)
        toast.success('Lead created')
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
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-border flex-row items-center justify-between space-y-0">
          <DialogTitle className="font-display font-semibold text-text-primary text-sm">
            {editingLead ? 'Edit Lead' : 'New Lead'}
          </DialogTitle>
          <div className="flex items-center gap-1.5 mr-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-200 ${
                  i === step ? 'w-6 bg-accent' : i < step ? 'w-3 bg-accent/40' : 'w-3 bg-border'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <p className="px-5 pt-4 text-[10px] text-text-muted font-medium uppercase tracking-widest">
          Step {step + 1} — {STEPS[step]}
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.13 }}
            className="px-5 py-4 space-y-4 min-h-[220px]"
          >
            {step === 0 && <StepBusinessInfo form={form} setField={setField} errors={errors} />}
            {step === 1 && <StepContact form={form} setField={setField} reps={reps} />}
            {step === 2 && <StepClassify form={form} setField={setField} zones={zones} partners={partners} />}
            {step === 3 && <StepFollowUp form={form} setField={setField} />}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step === 0 ? setModalOpen(false) : setStep((s) => s - 1)}
            className="text-text-secondary hover:text-text-primary text-xs h-7"
          >
            {step === 0 ? 'Cancel' : <><ChevronLeft size={11} className="mr-1" />Back</>}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={next}
              className="bg-accent text-background hover:bg-accent/90 text-xs font-semibold h-7 px-4"
            >
              Next <ChevronRight size={11} className="ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={submit}
              disabled={submitting}
              className="bg-accent text-background hover:bg-accent/90 text-xs font-semibold h-7 px-4"
            >
              {submitting ? 'Saving…' : editingLead ? 'Update Lead' : 'Create Lead'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Field wrapper ── */
function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[#aaaaaa] text-[11px] font-medium tracking-wide">{label}</Label>
      {children}
      {error && <p className="text-p0 text-[11px] mt-0.5">{error}</p>}
    </div>
  )
}

const inputCls    = 'bg-[#0d0d0d] border-[#2e2e2e] text-[#f0f0f0] placeholder:text-[#555] text-sm h-9 focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:border-accent/50'
const selectCls   = 'w-full bg-[#0d0d0d] border border-[#2e2e2e] rounded-md px-3 h-9 text-sm text-[#f0f0f0] focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent/50'
const textareaCls = 'w-full bg-[#0d0d0d] border border-[#2e2e2e] rounded-md px-3 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#555] resize-none focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent/50'

function StyledInput(props) { return <Input {...props} className={inputCls} /> }
function StyledTextarea({ value, onChange, placeholder, rows = 2 }) {
  return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} className={textareaCls} />
}
function StepCard({ children }) {
  return <div className="bg-[#0a0a0a] border border-[#252525] rounded-lg p-4 space-y-4">{children}</div>
}

/* ── Step 1: Business Info ── */
function StepBusinessInfo({ form, setField, errors }) {
  return (
    <StepCard>
      <Field label="Business Name *" error={errors.businessName}>
        <StyledInput
          value={form.businessName}
          onChange={(e) => setField('businessName', e.target.value)}
          placeholder="e.g. Sharma Traders"
          autoFocus
        />
      </Field>
      <Field label="Google Maps Link">
        <StyledInput
          value={form.mapsLink}
          onChange={(e) => setField('mapsLink', e.target.value)}
          placeholder="https://maps.google.com/…"
        />
      </Field>
      <Field label="Address">
        <StyledTextarea
          value={form.address}
          onChange={(e) => setField('address', e.target.value)}
          placeholder="Full address"
        />
      </Field>
    </StepCard>
  )
}

/* ── Step 2: Contact & POC ── */
function StepContact({ form, setField, reps }) {
  return (
    <StepCard>
      {/* Phone with country code */}
      <Field label="Phone">
        <div className="flex gap-2">
          <select
            value={form.countryCode}
            onChange={(e) => setField('countryCode', e.target.value)}
            className="bg-[#0d0d0d] border border-[#2e2e2e] rounded-md px-2 h-9 text-sm text-[#f0f0f0] focus:outline-none focus:ring-1 focus:ring-accent shrink-0 w-28"
          >
            {COUNTRY_CODES.map(({ code, label }) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
          <StyledInput
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            placeholder="98765 43210"
            className={inputCls + ' flex-1'}
          />
        </div>
      </Field>

      <Field label="Email">
        <StyledInput
          type="email"
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
          placeholder="contact@business.com"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Client POC">
          <StyledInput
            value={form.clientPOC}
            onChange={(e) => setField('clientPOC', e.target.value)}
            placeholder="Their contact name"
          />
        </Field>
        <Field label="Internal POC">
          <select
            value={form.internalPOC}
            onChange={(e) => setField('internalPOC', e.target.value)}
            className={selectCls}
          >
            <option value="">Select sales rep</option>
            {reps.map((r) => (
              <option key={r._id} value={r.name}>{r.name}</option>
            ))}
          </select>
          {reps.length === 0 && (
            <p className="text-[11px] text-text-muted mt-1">No reps yet — add them in Settings.</p>
          )}
        </Field>
      </div>
    </StepCard>
  )
}

/* ── Step 3: Classification ── */
function StepClassify({ form, setField, zones, partners = [] }) {
  return (
    <StepCard>
      <Field label="Priority">
        <div className="flex gap-1.5">
          {[
            { p: 'P0', active: 'bg-p0/15 border-p0/40 text-p0' },
            { p: 'P1', active: 'bg-p1/15 border-p1/40 text-p1' },
            { p: 'P2', active: 'bg-[#1e1e1e] border-[#444] text-[#aaa]' },
            { p: 'P3', active: 'bg-[#1a1a1a] border-[#333] text-[#777]' },
            { p: 'P4', active: 'bg-[#161616] border-[#2a2a2a] text-[#555]' },
          ].map(({ p, active }) => (
            <button
              key={p}
              type="button"
              onClick={() => setField('priority', p)}
              className={`flex-1 py-1.5 rounded-md text-xs font-bold border transition-colors ${
                form.priority === p ? active : 'bg-surface-raised border-border text-text-muted hover:border-text-muted'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Zone">
        <select
          value={form.zone}
          onChange={(e) => setField('zone', e.target.value)}
          className={selectCls}
        >
          <option value="">No zone</option>
          {zones.map((z) => (
            <option key={z._id} value={z._id}>{z.name}</option>
          ))}
        </select>
        {zones.length === 0 && (
          <p className="text-[11px] text-text-muted mt-1">No zones yet — add them in Settings.</p>
        )}
      </Field>

      <Field label="Source">
        <div className="flex flex-wrap gap-2">
          {['call', 'mail', 'referral', 'walk-in', 'partnership', 'other'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setField('source', s)}
              className={`px-3 py-1.5 rounded-md text-xs border capitalize transition-colors ${
                form.source === s
                  ? 'bg-accent/10 border-accent/40 text-accent'
                  : 'bg-[#0d0d0d] border-[#2e2e2e] text-[#888] hover:border-[#444] hover:text-[#ccc]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>

      {/* Partner attribution — only when sourced from a partnership */}
      {form.source === 'partnership' && (
        <Field label="Sourced by Partner">
          <select
            value={form.partnerId}
            onChange={(e) => setField('partnerId', e.target.value)}
            className={selectCls}
          >
            <option value="">Select partner</option>
            {partners.map((p) => (
              <option key={p._id} value={p._id}>{p.businessName}</option>
            ))}
          </select>
          {partners.length === 0 && (
            <p className="text-[11px] text-text-muted mt-1">No active partners yet — add one in Partnerships.</p>
          )}
        </Field>
      )}
    </StepCard>
  )
}

/* ── Step 4: Follow-up ── */
function StepFollowUp({ form, setField }) {
  return (
    <StepCard>
      <div className="grid grid-cols-2 gap-3">
        {/* Calendar date picker */}
        <Field label="Follow-up Date">
          <DatePicker
            value={form.followUpDate}
            onChange={(v) => setField('followUpDate', v)}
          />
        </Field>

        {/* Time slot dropdown */}
        <Field label="Follow-up Time">
          <select
            value={form.followUpTime}
            onChange={(e) => setField('followUpTime', e.target.value)}
            className={selectCls}
          >
            <option value="">No time set</option>
            {TIME_SLOTS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Notes">
        <StyledTextarea
          value={form.notes}
          onChange={(e) => setField('notes', e.target.value)}
          placeholder="Any additional context…"
          rows={3}
        />
      </Field>
    </StepCard>
  )
}

