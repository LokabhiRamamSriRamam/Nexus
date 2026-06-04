import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell, Users, TrendingUp, RefreshCw, AlertTriangle,
  IndianRupee, Briefcase, Calendar, Handshake, LayoutDashboard, CalendarCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts'
import { useReminderStore } from '@/store/reminderStore'
import RepOverview from '@/components/RepOverview'
import dayjs from 'dayjs'

/* ── Stat card ────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, color = 'text-[#888]', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.18 }}
      className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex items-start gap-3"
    >
      <div className="p-2 bg-[#1a1a1a] rounded-lg mt-0.5 shrink-0">
        <Icon size={15} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-[#555] text-[11px] mb-0.5">{label}</p>
        <p className="text-[#f0f0f0] font-display font-semibold text-2xl leading-none">{value ?? '—'}</p>
        {sub && <p className="text-[#666] text-[11px] mt-1">{sub}</p>}
      </div>
    </motion.div>
  )
}

/* ── Custom tooltip for recharts ───────────────────────────────── */
function ChartTooltip({ active, payload, label, prefix = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-[#888] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono">
          {prefix}{typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}
        </p>
      ))}
    </div>
  )
}

/* ── Section heading ───────────────────────────────────────────── */
function SectionHead({ label }) {
  return (
    <h2 className="text-[#555] text-[10px] font-medium uppercase tracking-widest mb-3">{label}</h2>
  )
}

export default function Dashboard() {
  const { todayCount, todayReminders } = useReminderStore()
  const [summary, setSummary] = useState(null)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {})
  }, [])

  const stageData = summary
    ? [
        { name: 'Pre-Sales',  count: summary.stages?.['pre-sales']      ?? 0, fill: '#3B82F6' },
        { name: 'Pipeline',   count: summary.stages?.['sales-pipeline'] ?? 0, fill: '#A855F7' },
        { name: 'Post-Sales', count: summary.stages?.['post-sales']     ?? 0, fill: '#22C55E' },
        { name: 'Lost',       count: summary.stages?.['lost']           ?? 0, fill: '#FF4444' },
      ]
    : []

  const revenueData = summary?.revenueTrend ?? []

  const fmtRevenue = (n) => {
    if (!n) return '₹0'
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
    if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
    return `₹${n.toLocaleString('en-IN')}`
  }

  return (
    <div className="p-3 md:p-5 space-y-5 md:space-y-7 max-w-[1200px] mx-auto">

      {/* ── Tab toggle ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-[#141414] border border-[#242424] rounded-lg p-1 w-fit">
        {[
          { k: 'overview', l: 'Overview',        icon: LayoutDashboard },
          { k: 'today',    l: "Today's Overview", icon: CalendarCheck },
        ].map(({ k, l, icon: Icon }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === k ? 'bg-accent text-background' : 'text-[#888] hover:text-[#ccc]'
            }`}
          >
            <Icon size={13} /> {l}
          </button>
        ))}
      </div>

      {tab === 'today' ? (
        <RepOverview />
      ) : (
       <>

      {/* ── Stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 md:gap-3">
        <StatCard
          icon={Bell}
          label="Today's Follow-ups"
          value={todayCount}
          color="text-amber-400"
          delay={0}
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue Leads"
          value={summary?.overdueLeads}
          color="text-p0"
          delay={0.04}
        />
        <StatCard
          icon={Users}
          label="P0 / P1 Leads"
          value={`${summary?.priorities?.P0 ?? 0} / ${summary?.priorities?.P1 ?? 0}`}
          sub="Critical priorities"
          color="text-p1"
          delay={0.08}
        />
        <StatCard
          icon={TrendingUp}
          label="In Pipeline"
          value={summary?.stages?.['sales-pipeline']}
          sub="Sales pipeline"
          color="text-[#A855F7]"
          delay={0.12}
        />
        <StatCard
          icon={Briefcase}
          label="Deals This Month"
          value={summary?.dealsThisMonth}
          color="text-[#22C55E]"
          delay={0.16}
        />
        <StatCard
          icon={IndianRupee}
          label="Revenue This Month"
          value={summary?.revenueThisMonth != null ? fmtRevenue(summary.revenueThisMonth) : '—'}
          color="text-accent"
          delay={0.20}
        />
      </div>

      {/* ── Partnerships highlight ─────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[#555] text-[10px] font-medium uppercase tracking-widest">Partnerships</h2>
          <Link to="/partnerships" className="text-accent/70 hover:text-accent text-[11px] transition-colors">View all →</Link>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <StatCard icon={Handshake} label="Active Partners" value={summary?.activePartners} color="text-accent" delay={0} />
          <StatCard icon={Users} label="Partner-Sourced Leads" value={summary?.partnerSourcedLeads} color="text-info" delay={0.04} />
          <StatCard
            icon={IndianRupee}
            label="Partner Revenue"
            value={summary?.partnerRevenue != null ? fmtRevenue(summary.partnerRevenue) : '—'}
            color="text-[#22C55E]"
            delay={0.08}
          />
        </div>
      </div>

      {/* ── Charts row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Stage breakdown bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.2 }}
          className="bg-[#141414] border border-[#262626] rounded-xl p-4"
        >
          <SectionHead label="Leads by Stage" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stageData} barSize={28}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#555', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#444', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={28}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff08' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stageData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 6-month revenue area chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.2 }}
          className="bg-[#141414] border border-[#262626] rounded-xl p-4"
        >
          <SectionHead label="Revenue — Last 6 Months" />
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#E8FF47" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#E8FF47" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e1e1e" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: '#555', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => fmtRevenue(v)}
                tick={{ fill: '#444', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={42}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs shadow-xl">
                      <p className="text-[#888] mb-1">{label}</p>
                      <p className="text-accent font-mono">{fmtRevenue(payload[0]?.value)}</p>
                      <p className="text-[#666]">{payload[1]?.value ?? 0} deal{payload[1]?.value !== 1 ? 's' : ''}</p>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#E8FF47"
                strokeWidth={2}
                fill="url(#revGrad)"
                dot={{ fill: '#E8FF47', r: 3, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ── Lists row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Today's follow-ups */}
        {todayReminders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.2 }}
          >
            <SectionHead label="Today's Follow-ups" />
            <div className="space-y-2">
              {todayReminders.slice(0, 8).map((r) => (
                <div
                  key={r._id}
                  className="bg-[#141414] border border-[#262626] rounded-lg px-4 py-3 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[#f0f0f0] text-sm font-medium truncate">{r.leadId?.businessName}</p>
                    <p className="text-[#555] text-xs mt-0.5">
                      {[r.leadId?.clientPOC, r.leadId?.phone].filter(Boolean).join(' · ')}
                      {r.reminderTime ? ` · ${r.reminderTime}` : ''}
                    </p>
                  </div>
                  {r.leadId?.priority && (
                    <span className={`ml-3 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      r.leadId.priority === 'P0' ? 'bg-p0/10 text-p0 border border-p0/30'
                      : r.leadId.priority === 'P1' ? 'bg-p1/10 text-p1 border border-p1/30'
                      : 'bg-[#1a1a1a] text-[#666] border border-[#2a2a2a]'
                    }`}>
                      {r.leadId.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Expiring renewals */}
        {summary?.expiringDeals?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36, duration: 0.2 }}
          >
            <SectionHead label="Renewals Due (Next 30 Days)" />
            <div className="space-y-2">
              {summary.expiringDeals.map((deal) => {
                const d        = dayjs(deal.renewalDate)
                const daysLeft = d.diff(dayjs(), 'day')
                const isToday  = daysLeft === 0
                const isExpired = daysLeft < 0
                return (
                  <div
                    key={deal._id}
                    className="bg-[#141414] border border-[#262626] rounded-lg px-4 py-3 flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[#f0f0f0] text-sm font-medium truncate">{deal.leadId?.businessName}</p>
                      <p className="text-[#555] text-xs mt-0.5">{[deal.leadId?.clientPOC, deal.leadId?.phone].filter(Boolean).join(' · ')}</p>
                    </div>
                    <div className="ml-3 text-right shrink-0">
                      <p className={`text-xs font-mono ${
                        isExpired ? 'text-p0' : isToday ? 'text-amber-400' : daysLeft <= 7 ? 'text-amber-500' : 'text-[#666]'
                      }`}>
                        {isToday ? 'Today' : isExpired ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                      </p>
                      <p className="text-[#444] text-[11px]">{d.format('D MMM YYYY')}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Empty state when no follow-ups + no renewals */}
        {todayReminders.length === 0 && !summary?.expiringDeals?.length && summary && (
          <div className="col-span-2 py-12 text-center">
            <p className="text-[#444] text-sm">No follow-ups today and no renewals due soon.</p>
          </div>
        )}
      </div>
       </>
      )}
    </div>
  )
}
