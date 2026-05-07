import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, IndianRupee, Calendar, Loader2, ChevronDown } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProductStore } from '@/store/productStore'
import { useDealStore } from '@/store/dealStore'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'

const CYCLE_LABELS = { monthly: '/mo', quarterly: '/qtr', yearly: '/yr', 'one-time': '' }

const inputCls    = 'bg-[#0d0d0d] border-[#2e2e2e] text-[#f0f0f0] placeholder:text-[#555] text-sm h-9 focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0'
const selectCls   = 'w-full bg-[#0d0d0d] border border-[#2e2e2e] rounded-md px-3 h-9 text-sm text-[#f0f0f0] focus:outline-none focus:ring-1 focus:ring-accent'
const textareaCls = 'w-full bg-[#0d0d0d] border border-[#2e2e2e] rounded-md px-3 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#555] resize-none focus:outline-none focus:ring-1 focus:ring-accent'

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[#aaa] text-[11px] font-medium tracking-wide">{label}</Label>
      {children}
    </div>
  )
}

function MiniDatePicker({ value, onChange, placeholder = 'Select date' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const current = value ? dayjs(value) : null
  const [viewYear,  setViewYear]  = useState((current ?? dayjs()).year())
  const [viewMonth, setViewMonth] = useState((current ?? dayjs()).month())

  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1)
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1)

  const first    = dayjs(new Date(viewYear, viewMonth, 1))
  const daysInMo = first.daysInMonth()
  const startOff = first.day()
  const MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const DAYS     = ['Su','Mo','Tu','We','Th','Fr','Sa']

  const pick = (d) => {
    onChange(dayjs(new Date(viewYear, viewMonth, d)).format('YYYY-MM-DD'))
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-[#0d0d0d] border border-[#2e2e2e] rounded-md px-3 h-9 text-sm text-left focus:outline-none focus:ring-1 focus:ring-accent hover:border-[#444] transition-colors">
        <span className={current ? 'text-[#f0f0f0]' : 'text-[#555]'}>
          {current ? current.format('D MMM YYYY') : placeholder}
        </span>
        <Calendar size={13} className="text-[#555]" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1.5 z-50 bg-[#111] border border-[#2a2a2a] rounded-lg p-3 shadow-xl w-[220px]"
          >
            <div className="flex items-center justify-between mb-2">
              <button onClick={prevMonth} className="text-[#666] hover:text-[#ccc] px-1 text-sm">‹</button>
              <span className="text-[#ddd] text-xs font-medium">{MONTHS[viewMonth]} {viewYear}</span>
              <button onClick={nextMonth} className="text-[#666] hover:text-[#ccc] px-1 text-sm">›</button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => <div key={d} className="text-center text-[10px] text-[#555] py-0.5">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
              {Array(startOff).fill(null).map((_, i) => <div key={'e'+i} />)}
              {Array(daysInMo).fill(null).map((_, i) => {
                const d = i + 1
                const isSel = current && current.date() === d && current.month() === viewMonth && current.year() === viewYear
                const isNow = dayjs().date() === d && dayjs().month() === viewMonth && dayjs().year() === viewYear
                return (
                  <button key={d} onClick={() => pick(d)}
                    className={`text-center text-xs py-1 rounded transition-colors ${
                      isSel ? 'bg-accent text-background font-bold'
                      : isNow ? 'text-accent font-semibold hover:bg-[#222]'
                      : 'text-[#ccc] hover:bg-[#222]'
                    }`}>{d}</button>
                )
              })}
            </div>
            {value && (
              <button onClick={() => { onChange(''); setOpen(false) }}
                className="mt-2 w-full text-center text-[11px] text-[#555] hover:text-[#aaa]">Clear date</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const EMPTY_ITEM = { productId: '', name: '', unitPrice: '', qty: 1, lineDiscount: 0 }

function fmt(n) { return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function DealForm({ open, onClose, leadId, existingDeal }) {
  const { products, fetchProducts } = useProductStore()
  const { createDeal, updateDeal }  = useDealStore()

  const [items,         setItems]         = useState([{ ...EMPTY_ITEM }])
  const [discountType,  setDiscountType]  = useState('percent')
  const [discountValue, setDiscountValue] = useState('')
  const [taxRate,       setTaxRate]       = useState('18')
  const [renewalDate,   setRenewalDate]   = useState('')
  const [notes,         setNotes]         = useState('')
  const [saving,        setSaving]        = useState(false)

  useEffect(() => {
    if (!open) return
    fetchProducts()
    if (existingDeal) {
      setItems(
        existingDeal.items?.length
          ? existingDeal.items.map(it => ({
              productId:    it.productId?._id || it.productId || '',
              name:         it.name || '',
              unitPrice:    String(it.unitPrice ?? ''),
              qty:          it.qty ?? 1,
              lineDiscount: it.lineDiscount ?? 0,
            }))
          : [{ ...EMPTY_ITEM }]
      )
      setDiscountType(existingDeal.discountType || 'percent')
      setDiscountValue(String(existingDeal.discountValue ?? ''))
      setTaxRate(String(existingDeal.taxRate ?? 18))
      setRenewalDate(existingDeal.renewalDate ? dayjs(existingDeal.renewalDate).format('YYYY-MM-DD') : '')
      setNotes(existingDeal.notes || '')
    } else {
      setItems([{ ...EMPTY_ITEM }])
      setDiscountType('percent')
      setDiscountValue('')
      setTaxRate('18')
      setRenewalDate('')
      setNotes('')
    }
  }, [open, existingDeal])

  /* When a product is selected from the catalog, populate name + unit price */
  const selectProduct = (index, productId) => {
    const product = products.find(p => p._id === productId)
    setItems(prev => prev.map((it, i) =>
      i !== index ? it : {
        ...it,
        productId,
        name:      product ? product.name : it.name,
        unitPrice: product ? String(product.basePrice) : it.unitPrice,
      }
    ))
  }

  const setItem = (index, key, val) =>
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [key]: val } : it))

  const addItem    = () => setItems(prev => [...prev, { ...EMPTY_ITEM }])
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))

  /* ── Live totals ── */
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, it) => {
      const price = parseFloat(it.unitPrice) || 0
      const qty   = parseInt(it.qty) || 1
      const disc  = parseFloat(it.lineDiscount) || 0
      const line  = price * qty
      return sum + line - (line * disc / 100)
    }, 0)

    const dv = parseFloat(discountValue) || 0
    const discountAmount = discountType === 'flat'
      ? Math.min(dv, subtotal)
      : subtotal * dv / 100

    const taxable   = subtotal - discountAmount
    const taxAmount = taxable * (parseFloat(taxRate) || 0) / 100
    const total     = taxable + taxAmount

    return {
      subtotal:       Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      taxAmount:      Math.round(taxAmount * 100) / 100,
      total:          Math.round(total * 100) / 100,
    }
  }, [items, discountType, discountValue, taxRate])

  const submit = async () => {
    if (!renewalDate) { toast.error('Renewal date is required'); return }
    const validItems = items.filter(it => it.name.trim() && (parseFloat(it.unitPrice) || 0) > 0)
    if (!validItems.length) { toast.error('Add at least one line item'); return }
    setSaving(true)
    try {
      const payload = {
        leadId,
        items: validItems.map(it => ({
          productId:    it.productId || undefined,
          name:         it.name.trim(),
          unitPrice:    parseFloat(it.unitPrice) || 0,
          qty:          parseInt(it.qty) || 1,
          lineDiscount: parseFloat(it.lineDiscount) || 0,
        })),
        discountType,
        discountValue: parseFloat(discountValue) || 0,
        taxRate:       parseFloat(taxRate) || 0,
        renewalDate,
        notes: notes.trim() || undefined,
      }
      if (existingDeal) {
        await updateDeal(existingDeal._id, leadId, payload)
        toast.success('Deal updated')
      } else {
        await createDeal(payload)
        toast.success('Deal saved')
      }
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to save deal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="bg-[#111] border-[#222] p-0 gap-0 max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="px-5 py-4 border-b border-[#1e1e1e] shrink-0">
          <DialogTitle className="font-display font-semibold text-[#f0f0f0] text-sm">
            {existingDeal ? 'Edit Deal' : 'Log Deal'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* ── Line items ─────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[#aaa] text-[11px] font-medium tracking-wide">Items</Label>
              <button onClick={addItem} className="flex items-center gap-1 text-[11px] text-[#666] hover:text-accent transition-colors">
                <Plus size={11} /> Add item
              </button>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_100px_52px_60px_28px] gap-1.5 mb-1 px-0.5">
              {['Product / description', 'Unit price', 'Qty', 'Disc %', ''].map((h, i) => (
                <p key={i} className="text-[10px] text-[#555] uppercase tracking-wider">{h}</p>
              ))}
            </div>

            <div className="space-y-1.5">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_100px_52px_60px_28px] gap-1.5 items-center">
                  {/* Name + optional product dropdown */}
                  <div className="relative">
                    <Input
                      value={item.name}
                      onChange={(e) => setItem(i, 'name', e.target.value)}
                      placeholder="Item name"
                      className={inputCls}
                      list={`products-list-${i}`}
                    />
                    {products.length > 0 && (
                      <datalist id={`products-list-${i}`}>
                        {products.map(p => (
                          <option key={p._id} value={p.name}
                            onClick={() => selectProduct(i, p._id)}
                          />
                        ))}
                      </datalist>
                    )}
                  </div>

                  {/* Unit price */}
                  <div className="relative">
                    <IndianRupee size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555]" />
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => setItem(i, 'unitPrice', e.target.value)}
                      placeholder="0"
                      className={inputCls + ' pl-6 pr-2'}
                      min="0"
                    />
                  </div>

                  {/* Qty */}
                  <Input
                    type="number"
                    value={item.qty}
                    onChange={(e) => setItem(i, 'qty', e.target.value)}
                    placeholder="1"
                    min="1"
                    className={inputCls + ' text-center px-2'}
                  />

                  {/* Line discount % */}
                  <div className="relative">
                    <Input
                      type="number"
                      value={item.lineDiscount}
                      onChange={(e) => setItem(i, 'lineDiscount', e.target.value)}
                      placeholder="0"
                      min="0"
                      max="100"
                      className={inputCls + ' pr-5 pl-2'}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#555] text-[10px]">%</span>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    className="text-[#444] hover:text-p0 transition-colors disabled:opacity-20"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick-add from catalog */}
            {products.length > 0 && (
              <div className="mt-2">
                <select
                  value=""
                  onChange={(e) => {
                    const p = products.find(pr => pr._id === e.target.value)
                    if (!p) return
                    setItems(prev => {
                      const empty = prev.findIndex(it => !it.name.trim())
                      if (empty !== -1) {
                        return prev.map((it, i) => i === empty
                          ? { ...it, productId: p._id, name: p.name, unitPrice: String(p.basePrice) }
                          : it)
                      }
                      return [...prev, { productId: p._id, name: p.name, unitPrice: String(p.basePrice), qty: 1, lineDiscount: 0 }]
                    })
                    e.target.value = ''
                  }}
                  className="bg-transparent border-0 text-[11px] text-[#555] hover:text-accent cursor-pointer focus:outline-none transition-colors"
                >
                  <option value="">+ Add from catalog…</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} — ₹{p.basePrice.toLocaleString('en-IN')}{CYCLE_LABELS[p.billingCycle] || ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ── Discount + Tax ─────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Deal Discount">
              <div className="flex gap-1.5">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="bg-[#0d0d0d] border border-[#2e2e2e] rounded-md px-2 h-9 text-xs text-[#f0f0f0] focus:outline-none focus:ring-1 focus:ring-accent w-20 shrink-0"
                >
                  <option value="percent">%</option>
                  <option value="flat">₹ flat</option>
                </select>
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="0"
                  min="0"
                  className={inputCls + ' flex-1'}
                />
              </div>
            </Field>

            <Field label="Tax Rate (GST %)">
              <div className="relative">
                <Input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="18"
                  min="0"
                  max="100"
                  className={inputCls + ' pr-6'}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555] text-xs">%</span>
              </div>
            </Field>
          </div>

          {/* ── Live total preview ─────────────────────────────── */}
          <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg p-3 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-[#666]">
              <span>Subtotal</span>
              <span>₹ {fmt(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-amber-500">
                <span>Discount ({discountType === 'percent' ? `${discountValue}%` : 'flat'})</span>
                <span>− ₹ {fmt(totals.discountAmount)}</span>
              </div>
            )}
            {totals.taxAmount > 0 && (
              <div className="flex justify-between text-[#666]">
                <span>GST ({taxRate}%)</span>
                <span>+ ₹ {fmt(totals.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#f0f0f0] font-bold pt-1.5 border-t border-[#1e1e1e] text-sm">
              <span>Total</span>
              <span>₹ {fmt(totals.total)}</span>
            </div>
          </div>

          {/* ── Renewal date ───────────────────────────────────── */}
          <Field label="Renewal Date *">
            <MiniDatePicker value={renewalDate} onChange={setRenewalDate} placeholder="Select renewal date" />
          </Field>

          {/* ── Notes ─────────────────────────────────────────── */}
          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Deal context, special terms, any remarks…"
              rows={3}
              className={textareaCls}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-[#1e1e1e] shrink-0">
          <button onClick={onClose} className="text-xs text-[#666] hover:text-[#aaa] transition-colors">Cancel</button>
          <Button
            size="sm"
            onClick={submit}
            disabled={saving}
            className="h-7 px-5 bg-accent text-background hover:bg-accent/90 text-xs font-semibold gap-1.5"
          >
            {saving && <Loader2 size={11} className="animate-spin" />}
            {saving ? 'Saving…' : existingDeal ? 'Update Deal' : 'Save Deal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
