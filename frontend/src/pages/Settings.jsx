import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Pencil, Check, X, Loader2, IndianRupee } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSalesRepStore } from '@/store/salesRepStore'
import { useZoneStore } from '@/store/zoneStore'
import { useProductStore } from '@/store/productStore'
import toast from 'react-hot-toast'

/* ── Inline-editable row ── */
function EditableRow({ item, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(item.name)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  const startEdit = () => {
    setValue(item.name)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 30)
  }

  const cancel = () => {
    setValue(item.name)
    setEditing(false)
  }

  const save = async () => {
    const trimmed = value.trim()
    if (!trimmed || trimmed === item.name) { cancel(); return }
    setSaving(true)
    try {
      await onUpdate(item._id, trimmed)
      setEditing(false)
      toast.success('Updated')
    } catch (err) {
      toast.error(err.message || 'Already exists')
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') cancel()
  }

  const handleDelete = async () => {
    if (!window.confirm(`Remove "${item.name}"?`)) return
    try {
      await onDelete(item._id)
      toast.success('Removed')
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.12 }}
      className="flex items-center gap-2 px-3 py-2 rounded-md bg-surface-raised border border-border group"
    >
      {editing ? (
        <>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={save}
            className="flex-1 bg-transparent text-text-primary text-sm outline-none border-b border-accent pb-0.5"
          />
          <button
            onMouseDown={(e) => { e.preventDefault(); save() }}
            disabled={saving}
            className="text-success hover:text-success/80 transition-colors shrink-0"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); cancel() }}
            className="text-text-muted hover:text-text-secondary transition-colors shrink-0"
          >
            <X size={13} />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-text-primary text-sm">{item.name}</span>
          <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={startEdit}
              className="text-text-muted hover:text-text-secondary transition-colors p-1"
              title="Rename"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={handleDelete}
              className="text-text-muted hover:text-p0 transition-colors p-1"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </>
      )}
    </motion.div>
  )
}

/* ── Full manager panel ── */
function ListManager({ title, description, items, onAdd, onUpdate, onDelete, placeholder }) {
  const [value, setValue] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    const trimmed = value.trim()
    if (!trimmed) return
    setAdding(true)
    try {
      await onAdd(trimmed)
      setValue('')
      toast.success('Added')
    } catch (err) {
      toast.error(err.message || 'Already exists')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-5 space-y-4">
      <div>
        <h2 className="font-display font-semibold text-text-primary text-sm">{title}</h2>
        <p className="text-text-muted text-xs mt-0.5">{description}</p>
      </div>

      {/* Add row */}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder}
          className="h-8 bg-surface-raised border-border text-text-primary placeholder:text-text-muted text-sm focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0"
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={adding || !value.trim()}
          className="h-8 bg-accent text-background hover:bg-accent/90 font-semibold text-xs px-3 shrink-0"
        >
          {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        </Button>
      </div>

      {/* Count */}
      {items.length > 0 && (
        <p className="text-text-muted text-[11px]">{items.length} {items.length === 1 ? 'entry' : 'entries'} — hover to edit or delete</p>
      )}

      {/* List */}
      {items.length === 0 ? (
        <p className="text-text-muted text-xs py-1">Nothing added yet.</p>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-1.5">
            {items.map((item) => (
              <EditableRow
                key={item._id}
                item={item}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}

const CYCLE_OPTS = ['monthly', 'quarterly', 'yearly', 'one-time']
const CYCLE_LABELS = { monthly: '/mo', quarterly: '/qtr', yearly: '/yr', 'one-time': 'one-time' }
const inputCls = 'bg-[#0d0d0d] border-[#2e2e2e] text-[#f0f0f0] placeholder:text-[#555] text-sm h-8 focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0'
const selectCls = 'bg-[#0d0d0d] border border-[#2e2e2e] rounded-md px-2 h-8 text-sm text-[#f0f0f0] focus:outline-none focus:ring-1 focus:ring-accent'

/* ── Product manager ── */
function ProductManager({ products, onCreate, onUpdate, onDelete }) {
  const EMPTY = { name: '', basePrice: '', billingCycle: 'monthly', description: '' }
  const [form,    setForm]    = useState(EMPTY)
  const [editing, setEditing] = useState(null)  // product _id being edited
  const [saving,  setSaving]  = useState(false)

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const startEdit = (p) => {
    setEditing(p._id)
    setForm({ name: p.name, basePrice: String(p.basePrice), billingCycle: p.billingCycle, description: p.description || '' })
  }

  const cancel = () => { setEditing(null); setForm(EMPTY) }

  const save = async () => {
    if (!form.name.trim() || !form.basePrice) return
    setSaving(true)
    try {
      const payload = { name: form.name.trim(), basePrice: parseFloat(form.basePrice), billingCycle: form.billingCycle, description: form.description.trim() }
      if (editing) { await onUpdate(editing, payload); toast.success('Updated') }
      else          { await onCreate(payload);           toast.success('Product added') }
      cancel()
    } catch (err) {
      toast.error(err.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return
    try { await onDelete(p._id); toast.success('Deleted') }
    catch { toast.error('Delete failed') }
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-5 space-y-4 md:col-span-2">
      <div>
        <h2 className="font-display font-semibold text-text-primary text-sm">Products / Plans</h2>
        <p className="text-text-muted text-xs mt-0.5">Plans selectable in the deal form.</p>
      </div>

      {/* Add / Edit form */}
      <div className="bg-[#0a0a0a] border border-[#252525] rounded-lg p-3 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Plan name" className={inputCls} />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <IndianRupee size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555]" />
              <Input type="number" value={form.basePrice} onChange={e => setField('basePrice', e.target.value)} placeholder="Base price" className={inputCls + ' pl-7'} />
            </div>
            <select value={form.billingCycle} onChange={e => setField('billingCycle', e.target.value)} className={selectCls}>
              {CYCLE_OPTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <Input value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Description (optional)" className={inputCls} />
        <div className="flex items-center justify-between pt-1">
          {editing && <button onClick={cancel} className="text-xs text-[#555] hover:text-[#aaa]">Cancel</button>}
          <Button size="sm" onClick={save} disabled={saving || !form.name.trim() || !form.basePrice}
            className={`h-7 px-3 bg-accent text-background hover:bg-accent/90 text-xs font-semibold gap-1 ${!editing ? 'ml-auto' : ''}`}>
            {saving ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
            {editing ? 'Update' : 'Add Product'}
          </Button>
        </div>
      </div>

      {/* Product list */}
      {products.length === 0 ? (
        <p className="text-text-muted text-xs">No products yet.</p>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence mode="popLayout">
            {products.map(p => (
              <motion.div key={p._id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-3 px-3 py-2 rounded-md bg-surface-raised border border-border group">
                <div className="flex-1 min-w-0">
                  <span className="text-text-primary text-sm">{p.name}</span>
                  {p.description && <span className="text-text-muted text-xs ml-2">{p.description}</span>}
                </div>
                <span className="text-[#888] text-xs font-mono shrink-0">
                  ₹{p.basePrice.toLocaleString('en-IN')} {CYCLE_LABELS[p.billingCycle]}
                </span>
                <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => startEdit(p)} className="text-text-muted hover:text-text-secondary p-1"><Pencil size={13} /></button>
                  <button onClick={() => handleDelete(p)} className="text-text-muted hover:text-p0 p-1"><Trash2 size={13} /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

/* ── Page ── */
export default function Settings() {
  const { reps, fetchReps, createRep, updateRep, deleteRep } = useSalesRepStore()
  const { zones, fetchZones, createZone, updateZone, deleteZone } = useZoneStore()
  const { products, fetchProducts, createProduct, updateProduct, deleteProduct } = useProductStore()

  useEffect(() => {
    fetchReps()
    fetchZones()
    fetchProducts()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="p-3 md:p-5"
    >
      <div className="mb-6">
        <h1 className="font-display font-semibold text-text-primary text-base">Settings</h1>
        <p className="text-text-muted text-xs mt-0.5">Manage sales reps, zones, and products.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ListManager
          title="Sales Reps"
          description="Internal POC options shown in the lead form."
          items={reps}
          onAdd={createRep}
          onUpdate={updateRep}
          onDelete={deleteRep}
          placeholder="e.g. Rahul Sharma"
        />
        <ListManager
          title="Zones"
          description="Geographic zones used to categorise leads."
          items={zones}
          onAdd={createZone}
          onUpdate={updateZone}
          onDelete={deleteZone}
          placeholder="e.g. North Delhi"
        />
        <ProductManager
          products={products}
          onCreate={createProduct}
          onUpdate={updateProduct}
          onDelete={deleteProduct}
        />
      </div>
    </motion.div>
  )
}
