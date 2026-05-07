import { useLocation, NavLink } from 'react-router-dom'
import { Plus, Settings, Bell } from 'lucide-react'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { useLeadStore } from '@/store/leadStore'
import { useReminderStore } from '@/store/reminderStore'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/pre-sales': 'Pre-Sales',
  '/sales-pipeline': 'Sales Pipeline',
  '/post-sales': 'Post-Sales',
  '/settings': 'Settings',
  '/reminders': 'Reminders',
}

const LEAD_PAGES = ['/pre-sales', '/sales-pipeline', '/post-sales']

export default function TopBar() {
  const { pathname } = useLocation()
  const setModalOpen = useLeadStore((s) => s.setModalOpen)
  const todayCount = useReminderStore((s) => s.todayCount)
  const title = PAGE_TITLES[pathname] ?? 'CRM'
  const today = dayjs().format('ddd, D MMM YYYY')

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 md:px-5 shrink-0">
      <h1 className="font-display font-semibold text-text-primary text-base tracking-tight">{title}</h1>

      <div className="flex items-center gap-2 md:gap-3">
        <span className="font-mono text-[11px] text-text-muted hidden lg:block">{today}</span>

        {LEAD_PAGES.includes(pathname) && (
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="bg-accent text-background hover:bg-accent/90 font-semibold text-xs h-8 px-3 gap-1.5"
          >
            <Plus size={13} />
            <span className="hidden xs:inline">Add Lead</span>
          </Button>
        )}

        {/* Reminders bell */}
        <NavLink
          to="/reminders"
          className="relative p-1.5 rounded text-[#555] hover:text-[#aaa] transition-colors"
        >
          <Bell size={17} />
          {todayCount > 0 && (
            <span className="absolute top-0 right-0 bg-accent text-background text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
              {todayCount > 99 ? '99+' : todayCount}
            </span>
          )}
        </NavLink>

        {/* Settings icon — mobile shortcut */}
        <NavLink
          to="/settings"
          className="md:hidden p-1.5 rounded text-[#555] hover:text-[#aaa] transition-colors"
        >
          <Settings size={17} />
        </NavLink>
      </div>
    </header>
  )
}
