import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PhoneCall, TrendingUp, Handshake, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReminderStore } from '@/store/reminderStore'

const NAV = [
  { to: '/',               icon: LayoutDashboard, label: 'Home' },
  { to: '/pre-sales',      icon: PhoneCall,        label: 'Pre-Sales' },
  { to: '/sales-pipeline', icon: TrendingUp,       label: 'Pipeline' },
  { to: '/post-sales',     icon: Handshake,        label: 'Post-Sales' },
  { to: '/reminders',      icon: Bell,             label: 'Reminders' },
]

export default function BottomNav() {
  const { todayCount } = useReminderStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden bg-[#0e0e0e] border-t border-[#1e1e1e]"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {NAV.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
              isActive ? 'text-accent' : 'text-[#555]'
            )
          }
        >
          <div className="relative">
            <Icon size={20} />
            {to === '/reminders' && todayCount > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-accent text-background text-[8px] font-bold rounded-full min-w-[13px] h-[13px] flex items-center justify-center px-0.5">
                {todayCount > 99 ? '99+' : todayCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-medium tracking-wide">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
