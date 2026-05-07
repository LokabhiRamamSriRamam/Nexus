import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function NexusLoader({ fullScreen = false }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf
    let start = null
    const duration = 1800

    const tick = (ts) => {
      if (!start) start = ts
      const elapsed = ts - start
      const pct = Math.min((elapsed / duration) * 100, 95)
      setProgress(Math.round(pct))
      if (elapsed < duration) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const wrapper = fullScreen
    ? 'fixed inset-0 z-50 bg-[#0A0A0A] flex flex-col items-center justify-center gap-8'
    : 'flex flex-col items-center justify-center gap-6 py-20'

  return (
    <div className={wrapper}>
      {/* Blinking Nexus logo */}
      <motion.img
        src="/Nexus.png"
        alt="Nexus CRM"
        className="h-20 w-auto object-contain"
        draggable={false}
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Progress bar */}
      <div className="w-40 h-[2px] rounded-full bg-[#1f1f1f] overflow-hidden">
        <motion.div
          className="h-full bg-accent rounded-full"
          style={{ width: `${progress}%` }}
          transition={{ ease: 'easeOut' }}
        />
      </div>

      <span className="text-[#333] text-[10px] tracking-widest uppercase tabular-nums">
        {progress}%
      </span>
    </div>
  )
}
