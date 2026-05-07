import Lead from '../models/Lead.js'
import Deal from '../models/Deal.js'
import Reminder from '../models/Reminder.js'
import dayjs from 'dayjs'

export const getSummary = async (req, res) => {
  try {
    const now           = dayjs()
    const todayStart    = now.startOf('day').toDate()
    const todayEnd      = now.endOf('day').toDate()
    const monthStart    = now.startOf('month').toDate()
    const monthEnd      = now.endOf('month').toDate()
    const renewalWindow = now.add(30, 'day').toDate()

    // ── 6-month revenue trend ──────────────────────────────────
    const trendMonths = Array.from({ length: 6 }, (_, i) => {
      const d = now.subtract(5 - i, 'month')
      return { label: d.format('MMM'), start: d.startOf('month').toDate(), end: d.endOf('month').toDate() }
    })

    const [
      todayReminders,
      stageBreakdown,
      priorityBreakdown,
      expiringDeals,
      dealsThisMonth,
      overdueLeads,
    ] = await Promise.all([
      Reminder.countDocuments({ reminderDate: { $gte: todayStart, $lte: todayEnd }, status: 'pending' }),

      Lead.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 } } }]),

      Lead.aggregate([
        { $match: { stage: { $in: ['pre-sales', 'sales-pipeline'] } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),

      Deal.find({ renewalDate: { $gte: todayStart, $lte: renewalWindow } })
        .populate('leadId', 'businessName phone clientPOC')
        .sort({ renewalDate: 1 })
        .limit(10),

      Deal.aggregate([
        { $match: { closedAt: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      ]),

      Lead.countDocuments({
        followUpDate: { $lt: todayStart },
        stage: { $in: ['pre-sales', 'sales-pipeline'] },
      }),
    ])

    // Revenue trend — run sequentially after knowing trendMonths
    const revenueTrend = await Promise.all(
      trendMonths.map(async ({ label, start, end }) => {
        const agg = await Deal.aggregate([
          { $match: { closedAt: { $gte: start, $lte: end } } },
          { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        ])
        return { month: label, revenue: agg[0]?.revenue ?? 0, deals: agg[0]?.count ?? 0 }
      })
    )

    const stages     = {}
    stageBreakdown.forEach((s) => { stages[s._id] = s.count })

    const priorities = {}
    priorityBreakdown.forEach((p) => { priorities[p._id] = p.count })

    const thisMonth = dealsThisMonth[0] ?? { count: 0, revenue: 0 }

    res.json({
      todayReminders,
      stages,
      priorities,
      expiringDeals,
      overdueLeads,
      dealsThisMonth: thisMonth.count,
      revenueThisMonth: thisMonth.revenue,
      revenueTrend,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
