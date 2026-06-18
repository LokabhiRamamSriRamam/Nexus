import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { initNative } from '@/lib/nativeInit'

import Sidebar    from '@/components/layout/Sidebar'
import TopBar     from '@/components/layout/TopBar'
import BottomNav  from '@/components/layout/BottomNav'
import ReminderBanner from '@/components/layout/ReminderBanner'
import LeadForm   from '@/components/LeadForm'
import { useReminderStore } from '@/store/reminderStore'
import { useAuthStore } from '@/store/authStore'

import Dashboard    from '@/pages/Dashboard'
import PreSales     from '@/pages/PreSales'
import SalesPipeline from '@/pages/SalesPipeline'
import FreeTrial    from '@/pages/FreeTrial'
import PostSales    from '@/pages/PostSales'
import Partnerships from '@/pages/Partnerships'
import Settings     from '@/pages/Settings'
import Reminders    from '@/pages/Reminders'
import Login        from '@/pages/Login'

function Layout() {
  const fetchToday = useReminderStore((s) => s.fetchToday)

  useEffect(() => {
    initNative()
    fetchToday()
    const interval = setInterval(fetchToday, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchToday])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — hidden on mobile, visible md+ */}
      <Sidebar />

      {/* Main column */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <ReminderBanner />
        {/* pb-16 reserves space for BottomNav on mobile */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* LeadForm modal — always mounted */}
      <LeadForm />

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/',                element: <Dashboard /> },
      { path: '/pre-sales',       element: <PreSales /> },
      { path: '/sales-pipeline',  element: <SalesPipeline /> },
      { path: '/free-trial',      element: <FreeTrial /> },
      { path: '/post-sales',      element: <PostSales /> },
      { path: '/partnerships',    element: <Partnerships /> },
      { path: '/settings',        element: <Settings /> },
      { path: '/reminders',       element: <Reminders /> },
    ],
  },
])

export default function App() {
  const token = useAuthStore((s) => s.token)

  if (!token) {
    return (
      <>
        <Login />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1A1A1A',
              color: '#F5F5F5',
              border: '1px solid #222222',
              fontSize: '13px',
            },
          }}
        />
      </>
    )
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1A1A1A',
            color: '#F5F5F5',
            border: '1px solid #222222',
            fontSize: '13px',
          },
        }}
      />
    </>
  )
}
