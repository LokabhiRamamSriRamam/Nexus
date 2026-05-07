import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, PhoneCall, TrendingUp, Handshake,
  Settings, ChevronRight, ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/',               icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pre-sales',      icon: PhoneCall,        label: 'Pre-Sales' },
  { to: '/sales-pipeline', icon: TrendingUp,       label: 'Sales Pipeline' },
  { to: '/post-sales',     icon: Handshake,        label: 'Post-Sales' },
  { to: '/settings',       icon: Settings,         label: 'Settings' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(window.innerWidth < 1280)

  /* Auto-collapse at lg, expand at xl */
  useEffect(() => {
    const fn = () => setCollapsed(window.innerWidth < 1280)
    window.addEventListener('resize', fn, { passive: true })
    return () => window.removeEventListener('resize', fn)
  }, [])

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 220 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative hidden md:flex flex-col h-screen bg-surface border-r border-border shrink-0 overflow-hidden"
    >
      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors group',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-surface-raised text-text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={16}
                  className={cn(
                    'shrink-0 transition-colors',
                    isActive ? 'text-accent' : 'text-text-secondary group-hover:text-text-primary'
                  )}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logo — bottom of sidebar */}
      <div className="flex items-center justify-center py-4 border-t border-border">
        <img
          src="/connect.png"
          alt="Connect"
          className="h-15 w-auto object-contain opacity-60"
          draggable={false}
        />
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-16 w-6 h-6 bg-surface border border-border rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  )
}
