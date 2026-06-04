import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar } from 'lucide-react'
import dayjs from 'dayjs'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

/* Inline calendar date picker — value/onChange use 'YYYY-MM-DD' strings */
export default function DatePicker({ value, onChange, placeholder = 'Select date' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = value ? dayjs(value) : null
  const [viewYear, setViewYear]   = useState((current ?? dayjs()).year())
  const [viewMonth, setViewMonth] = useState((current ?? dayjs()).month())

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  const firstDay = dayjs(new Date(viewYear, viewMonth, 1))
  const daysInMonth = firstDay.daysInMonth()
  const startOffset = firstDay.day()

  const selectDay = (d) => {
    onChange(dayjs(new Date(viewYear, viewMonth, d)).format('YYYY-MM-DD'))
    setOpen(false)
  }

  const displayLabel = current ? current.format('D MMM YYYY') : placeholder

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between bg-[#0d0d0d] border border-[#2e2e2e] rounded-md px-3 h-9 text-sm text-left focus:outline-none focus:ring-1 focus:ring-accent transition-colors hover:border-[#444]"
      >
        <span className={current ? 'text-[#f0f0f0]' : 'text-[#555]'}>{displayLabel}</span>
        <Calendar size={13} className="text-[#555] shrink-0" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1.5 z-50 bg-[#111] border border-[#2a2a2a] rounded-lg p-3 shadow-xl w-[220px]"
          >
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={prevMonth} className="text-[#666] hover:text-[#ccc] px-1 transition-colors text-sm">‹</button>
              <span className="text-[#ddd] text-xs font-medium">{MONTHS[viewMonth]} {viewYear}</span>
              <button type="button" onClick={nextMonth} className="text-[#666] hover:text-[#ccc] px-1 transition-colors text-sm">›</button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[10px] text-[#555] py-0.5">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-0.5">
              {Array(startOffset).fill(null).map((_, i) => <div key={'e' + i} />)}
              {Array(daysInMonth).fill(null).map((_, i) => {
                const d = i + 1
                const isSelected = current && current.date() === d && current.month() === viewMonth && current.year() === viewYear
                const isToday = dayjs().date() === d && dayjs().month() === viewMonth && dayjs().year() === viewYear
                const cls = isSelected ? 'bg-accent text-background font-bold'
                  : isToday ? 'text-accent font-semibold hover:bg-[#222]'
                  : 'text-[#ccc] hover:bg-[#222]'
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => selectDay(d)}
                    className={`text-center text-xs py-1 rounded transition-colors ${cls}`}
                  >
                    {d}
                  </button>
                )
              })}
            </div>

            {value && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false) }}
                className="mt-2 w-full text-center text-[11px] text-[#555] hover:text-[#aaa] transition-colors"
              >
                Clear date
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
