import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, Bell, CalendarRange, CalendarDays, Clock3,
  User, Handshake, Phone, CheckCircle2, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react'
import dayjs from 'dayjs'
import { useSalesRepStore } from '@/store/salesRepStore'
import { useLeadStore } from '@/store/leadStore'
import { usePartnerStore } from '@/store/partnerStore'
import LeadDrawer from '@/components/LeadDrawer'
import PartnerDrawer from '@/components/PartnerDrawer'

const PRIORITY_CLS = {
  P0: 'bg-p0/10 text-p0 border-p0/30',
  P1: 'bg-p1/10 text-p1 border-p1/30',
  P2: 'bg-[#1a1a1a] text-[#888] border-[#2a2a2a]',
  P3: 'bg-[#161616] text-[#666] border-[#222]',
  P4: 'bg-[#131313] text-[#555] border-[#1e1e1e]',
}

/* Build the [from,to] range (ISO) for each view, relative to now */
function scopeRange(scope, monthAnchor) {
  const now = dayjs()
  switch (scope) {
    case 'overdue':
      return { to: now.startOf('day').subtract(1, 'millisecond').toISOString() }
    case 'today':
      return { from: now.startOf('day').toISOString(), to: now.endOf('day').toISOString() }
    case 'week':
      return { from: now.add(1, 'day').startOf('day').toISOString(), to: now.endOf('week').toISOString() }
    case 'upcoming':
      return { from: now.endOf('week').add(1, 'millisecond').toISOString(), to: now.add(90, 'day').endOf('day').toISOString() }
    case 'calendar': {
      const m = monthAnchor ?? now
      return { from: m.startOf('month').toISOString(), to: m.endOf('month').toISOString() }
    }
    default:
      return {}
  }
}

async function fetchAgenda(rep, range) {
  const params = new URLSearchParams()
  if (rep) params.set('rep', rep)
  if (range.from) params.set('from', range.from)
  if (range.to)   params.set('to', range.to)
  const res = await fetch(`/api/dashboard/rep-agenda?${params}`)
  const data = await res.json()
  return Array.isArray(data.items) ? data.items : []
}

/* ── Single action row ── */
function ActionItem({ item, showDate = true, onOpen, loading }) {
  return (
    <button
      onClick={() => item.subjectId && onOpen?.(item)}
      disabled={loading}
      className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 border-b border-[#1c1c1c] last:border-0 transition-colors ${
        item.subjectId ? 'hover:bg-[#1a1a1a] cursor-pointer' : 'cursor-default'
      } ${loading ? 'opacity-60' : ''}`}
    >
      {item.priority && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${PRIORITY_CLS[item.priority] ?? PRIORITY_CLS.P2}`}>
          {item.priority}
        </span>
      )}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {item.type === 'partner'
          ? <Handshake size={12} className="text-[#666] shrink-0" />
          : <User size={12} className="text-[#555] shrink-0" />}
        <div className="min-w-0">
          <p className="text-[#e8e8e8] text-sm truncate leading-tight">{item.name}</p>
          {item.contact && <p className="text-[#555] text-[11px] truncate">{item.contact}</p>}
        </div>
      </div>
      {item.phone && (
        <span className="hidden sm:flex items-center gap-1 text-[#666] text-[11px] font-mono shrink-0">
          <Phone size={10} /> {item.phone}
        </span>
      )}
      <span className="text-right shrink-0 w-14">
        {loading
          ? <Loader2 size={11} className="animate-spin text-accent ml-auto" />
          : <>
              <span className="block text-[#999] text-[11px] font-mono">{item.time || '—'}</span>
              {showDate && <span className="block text-[#555] text-[10px] font-mono">{dayjs(item.date).format('D MMM')}</span>}
            </>
        }
      </span>
    </button>
  )
}

function Loading() {
  return (
    <div className="flex items-center gap-2 text-[#666] text-xs py-10 justify-center">
      <Loader2 size={13} className="animate-spin" /> Loading…
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-8 flex flex-col items-center gap-2">
      <CheckCircle2 size={18} className="text-[#3a3a3a]" />
      <p className="text-[#555] text-xs">{text}</p>
    </div>
  )
}

/* ── List view (overdue / today / this week / upcoming) ── */
function ListPane({ rep, scope, emptyText, groupByDate, onItemClick, loadingId }) {
  const [items, setItems] = useState(null)

  useEffect(() => {
    let active = true
    setItems(null)
    fetchAgenda(rep, scopeRange(scope))
      .then((d) => { if (active) setItems(d) })
      .catch(() => { if (active) setItems([]) })
    return () => { active = false }
  }, [rep, scope])

  if (items === null) return <Loading />
  if (items.length === 0) return <EmptyState text={emptyText} />

  if (!groupByDate) {
    return (
      <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg overflow-hidden">
        {items.map((it) => (
          <ActionItem key={it.id} item={it} showDate={false} onOpen={onItemClick} loading={loadingId === String(it.id)} />
        ))}
      </div>
    )
  }

  // Group chronologically by day with date headers
  const groups = []
  const byDay = {}
  for (const it of items) {
    const k = dayjs(it.date).format('YYYY-MM-DD')
    if (!byDay[k]) { byDay[k] = []; groups.push(k) }
    byDay[k].push(it)
  }

  return (
    <div className="space-y-3">
      {groups.map((k) => {
        const d = dayjs(k)
        const rel = d.isSame(dayjs(), 'day') ? 'Today'
          : d.isSame(dayjs().add(1, 'day'), 'day') ? 'Tomorrow'
          : d.format('dddd')
        return (
          <div key={k}>
            <div className="flex items-center gap-2 mb-1.5 px-0.5">
              <span className="text-[#ccc] text-xs font-medium">{rel}</span>
              <span className="text-[#555] text-[11px]">{d.format('D MMM YYYY')}</span>
              <span className="text-[#444] text-[11px] ml-auto">{byDay[k].length}</span>
            </div>
            <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg overflow-hidden">
              {byDay[k].map((it) => (
                <ActionItem key={it.id} item={it} showDate={false} onOpen={onItemClick} loading={loadingId === String(it.id)} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Calendar view ── */
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function CalendarPane({ rep, onItemClick, loadingId }) {
  const [anchor, setAnchor] = useState(dayjs().startOf('month'))
  const [items, setItems] = useState(null)
  const [selected, setSelected] = useState(dayjs().format('YYYY-MM-DD'))

  useEffect(() => {
    let active = true
    setItems(null)
    fetchAgenda(rep, scopeRange('calendar', anchor))
      .then((d) => { if (active) setItems(d) })
      .catch(() => { if (active) setItems([]) })
    return () => { active = false }
  }, [rep, anchor])

  const byDay = useMemo(() => {
    const m = {}
    ;(items ?? []).forEach((it) => {
      const k = dayjs(it.date).format('YYYY-MM-DD')
      ;(m[k] = m[k] || []).push(it)
    })
    return m
  }, [items])

  const daysInMonth = anchor.daysInMonth()
  const startOffset = anchor.day()
  const todayKey = dayjs().format('YYYY-MM-DD')
  const selectedItems = byDay[selected] ?? []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
      {/* Calendar grid */}
      <div className="bg-[#141414] border border-[#242424] rounded-xl p-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setAnchor((a) => a.subtract(1, 'month'))}
            className="p-1 text-[#666] hover:text-[#ccc] transition-colors"><ChevronLeft size={15} /></button>
          <span className="text-[#ddd] text-sm font-medium">{anchor.format('MMMM YYYY')}</span>
          <button onClick={() => setAnchor((a) => a.add(1, 'month'))}
            className="p-1 text-[#666] hover:text-[#ccc] transition-colors"><ChevronRight size={15} /></button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {DOW.map((d) => <div key={d} className="text-center text-[10px] text-[#555] py-0.5">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {Array(startOffset).fill(null).map((_, i) => <div key={'e' + i} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const d = anchor.date(i + 1)
            const k = d.format('YYYY-MM-DD')
            const count = byDay[k]?.length ?? 0
            const isToday = k === todayKey
            const isSel = k === selected
            const overdue = count > 0 && d.isBefore(dayjs(), 'day')
            return (
              <button
                key={k}
                onClick={() => setSelected(k)}
                className={`relative aspect-square rounded-md text-xs flex flex-col items-center justify-center transition-colors ${
                  isSel ? 'bg-accent text-background font-bold'
                  : isToday ? 'bg-[#1e1e1e] text-accent font-semibold'
                  : 'text-[#bbb] hover:bg-[#1c1c1c]'
                }`}
              >
                {d.date()}
                {count > 0 && (
                  <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                    isSel ? 'bg-background' : overdue ? 'bg-p0' : 'bg-accent'
                  }`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day's items */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays size={13} className="text-accent" />
          <h3 className="text-[11px] font-medium uppercase tracking-widest text-[#777]">
            {dayjs(selected).format('dddd, D MMM')}
          </h3>
          <span className="text-[11px] font-bold text-accent">{selectedItems.length}</span>
        </div>
        {items === null ? <Loading />
          : selectedItems.length === 0 ? <EmptyState text="No follow-ups on this day." />
          : (
            <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg overflow-hidden">
              {selectedItems.map((it) => (
                <ActionItem key={it.id} item={it} showDate={false} onOpen={onItemClick} loading={loadingId === String(it.id)} />
              ))}
            </div>
          )}
      </div>
    </div>
  )
}

/* ── View tabs config ── */
const VIEWS = [
  { k: 'overdue',  label: 'Past Due',  icon: AlertTriangle, color: 'text-p0',        countKey: 'overdue' },
  { k: 'today',    label: 'Today',     icon: Bell,          color: 'text-amber-400', countKey: 'today' },
  { k: 'week',     label: 'This Week', icon: CalendarRange, color: 'text-[#3B82F6]', countKey: 'week' },
  { k: 'upcoming', label: 'Upcoming',  icon: Clock3,        color: 'text-[#A855F7]', countKey: 'upcoming' },
  { k: 'calendar', label: 'Calendar',  icon: CalendarDays,  color: 'text-accent',    countKey: null },
]

export default function RepOverview() {
  const { reps, fetchReps } = useSalesRepStore()
  const { setDrawerOpen: openLeadDrawer } = useLeadStore()
  const { setDrawerOpen: openPartnerDrawer } = usePartnerStore()
  const [summary, setSummary] = useState(null)
  const [selectedRep, setSelectedRep] = useState(null)
  const [view, setView] = useState('today')
  const [loadingId, setLoadingId] = useState(null)

  const handleItemClick = useCallback(async (item) => {
    if (!item.subjectId || loadingId) return
    setLoadingId(String(item.id))
    try {
      const url = item.type === 'partner'
        ? `/api/partners/${item.subjectId}`
        : `/api/leads/${item.subjectId}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      if (item.type === 'partner') {
        openPartnerDrawer(true, data)
      } else {
        openLeadDrawer(true, data)
      }
    } catch {
      // silently ignore — item may have been deleted
    } finally {
      setLoadingId(null)
    }
  }, [loadingId, openLeadDrawer, openPartnerDrawer])

  const loadSummary = useCallback(() => {
    fetch('/api/dashboard/rep-summary')
      .then((r) => r.json())
      .then((d) => setSummary(Array.isArray(d.rows) ? d.rows : []))
      .catch(() => setSummary([]))
  }, [])

  useEffect(() => { fetchReps(); loadSummary() }, [])

  const summaryByRep = useMemo(() => {
    const m = {}
    ;(summary ?? []).forEach((r) => { m[r.rep] = r })
    return m
  }, [summary])

  const repNames = useMemo(() => {
    const names = reps.map((r) => r.name)
    if (summaryByRep['Unassigned']) names.push('Unassigned')
    return names
  }, [reps, summaryByRep])

  // Default to the rep with the most overdue, else first
  useEffect(() => {
    if (selectedRep || !summary || repNames.length === 0) return
    const withOverdue = [...repNames].sort((a, b) => (summaryByRep[b]?.counts.overdue ?? 0) - (summaryByRep[a]?.counts.overdue ?? 0))[0]
    setSelectedRep(withOverdue ?? repNames[0])
  }, [summary, repNames, selectedRep, summaryByRep])

  if (summary === null) return <Loading />

  if (repNames.length === 0) {
    return (
      <div className="bg-[#141414] border border-[#262626] rounded-xl py-12 text-center">
        <p className="text-[#555] text-sm">No sales reps yet.</p>
        <p className="text-[#444] text-xs mt-1">Add reps in Settings to build their daily plans.</p>
      </div>
    )
  }

  const counts = (selectedRep && summaryByRep[selectedRep]?.counts) || { overdue: 0, today: 0, week: 0, upcoming: 0 }

  return (
    <div className="space-y-4">
      {/* Rep selector — anyone can view any rep's plan (transparency) */}
      <div className="flex items-center gap-2 flex-wrap">
        {repNames.map((name) => {
          const overdue = summaryByRep[name]?.counts.overdue ?? 0
          const active = selectedRep === name
          return (
            <button
              key={name}
              onClick={() => setSelectedRep(name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                active ? 'bg-accent text-background border-accent'
                  : 'bg-[#141414] text-[#aaa] border-[#262626] hover:border-[#3a3a3a] hover:text-[#ddd]'
              }`}
            >
              {name}
              {overdue > 0 && (
                <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full ${active ? 'bg-background/20 text-background' : 'bg-p0/15 text-p0'}`}>
                  {overdue}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Rep header */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
          selectedRep === 'Unassigned' ? 'bg-[#1a1a1a] text-[#555]' : 'bg-accent/15 text-accent'
        }`}>
          {selectedRep === 'Unassigned' ? '—' : selectedRep?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div>
          <p className="text-[#f0f0f0] font-display font-semibold text-base leading-tight">{selectedRep}</p>
          <p className="text-[#555] text-xs">Plan of action · {dayjs().format('dddd, D MMM YYYY')}</p>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-1 bg-[#141414] border border-[#242424] rounded-lg p-1 overflow-x-auto">
        {VIEWS.map(({ k, label, icon: Icon, countKey }) => {
          const c = countKey ? counts[countKey] : null
          const active = view === k
          return (
            <button
              key={k}
              onClick={() => setView(k)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                active ? 'bg-accent text-background' : 'text-[#888] hover:text-[#ccc]'
              }`}
            >
              <Icon size={13} /> {label}
              {c > 0 && (
                <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full ${active ? 'bg-background/20 text-background' : 'bg-[#222] text-[#999]'}`}>
                  {c}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Active view */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view + selectedRep}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          {view === 'overdue'  && <ListPane rep={selectedRep} scope="overdue"  groupByDate emptyText="Nothing overdue — all caught up."           onItemClick={handleItemClick} loadingId={loadingId} />}
          {view === 'today'    && <ListPane rep={selectedRep} scope="today"              emptyText="No follow-ups scheduled for today."             onItemClick={handleItemClick} loadingId={loadingId} />}
          {view === 'week'     && <ListPane rep={selectedRep} scope="week"     groupByDate emptyText="Nothing else scheduled this week."            onItemClick={handleItemClick} loadingId={loadingId} />}
          {view === 'upcoming' && <ListPane rep={selectedRep} scope="upcoming" groupByDate emptyText="No upcoming follow-ups in the next 90 days."  onItemClick={handleItemClick} loadingId={loadingId} />}
          {view === 'calendar' && <CalendarPane rep={selectedRep} onItemClick={handleItemClick} loadingId={loadingId} />}
        </motion.div>
      </AnimatePresence>

      <LeadDrawer />
      <PartnerDrawer />
    </div>
  )
}
