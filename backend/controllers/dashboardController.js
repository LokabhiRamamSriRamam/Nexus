import Lead from '../models/Lead.js'
import Deal from '../models/Deal.js'
import Reminder from '../models/Reminder.js'
import Partner from '../models/Partner.js'
import SalesRep from '../models/SalesRep.js'
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
      activePartners,
      partnerSourcedLeads,
      partnerRevenueAgg,
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

      Partner.countDocuments({ stage: 'post-sales' }),

      Lead.countDocuments({ partnerId: { $ne: null } }),

      Deal.aggregate([
        { $lookup: { from: 'leads', localField: 'leadId', foreignField: '_id', as: 'lead' } },
        { $unwind: '$lead' },
        { $match: { 'lead.partnerId': { $ne: null } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
      ]),
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
      activePartners,
      partnerSourcedLeads,
      partnerRevenue: partnerRevenueAgg[0]?.revenue ?? 0,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

/* ── Shared aggregation stages ─────────────────────────────────────
 * Joins a pending reminder to its lead OR partner and derives the
 * owning sales rep (internalPOC). Reused by summary + agenda so the
 * rep filtering happens at the DB level, not in Node.
 */
const repResolutionStages = [
  { $lookup: { from: 'leads',    localField: 'leadId',    foreignField: '_id', as: 'lead' } },
  { $lookup: { from: 'partners', localField: 'partnerId', foreignField: '_id', as: 'partner' } },
  {
    $addFields: {
      subject:   { $ifNull: [{ $arrayElemAt: ['$lead', 0] }, { $arrayElemAt: ['$partner', 0] }] },
      isPartner: { $gt: [{ $size: '$partner' }, 0] },
    },
  },
  { $match: { subject: { $ne: null } } },
  {
    $addFields: {
      repName: {
        $let: {
          vars: { t: { $trim: { input: { $ifNull: ['$subject.internalPOC', ''] } } } },
          in:   { $cond: [{ $eq: ['$$t', ''] }, 'Unassigned', '$$t'] },
        },
      },
    },
  },
]

/* ── Lightweight per-rep counts — for the rep selector badges ────── */
export const getRepSummary = async (_req, res) => {
  try {
    const now        = dayjs()
    const todayStart = now.startOf('day').toDate()
    const todayEnd   = now.endOf('day').toDate()
    const weekEnd    = now.endOf('week').toDate()
    const upper      = now.add(90, 'day').endOf('day').toDate()

    const agg = await Reminder.aggregate([
      { $match: { status: 'pending', reminderDate: { $lte: upper } } },
      ...repResolutionStages,
      {
        $group: {
          _id: '$repName',
          overdue:  { $sum: { $cond: [{ $lt: ['$reminderDate', todayStart] }, 1, 0] } },
          today:    { $sum: { $cond: [{ $and: [{ $gte: ['$reminderDate', todayStart] }, { $lte: ['$reminderDate', todayEnd] }] }, 1, 0] } },
          week:     { $sum: { $cond: [{ $and: [{ $gt: ['$reminderDate', todayEnd] }, { $lte: ['$reminderDate', weekEnd] }] }, 1, 0] } },
          upcoming: { $sum: { $cond: [{ $gt: ['$reminderDate', weekEnd] }, 1, 0] } },
        },
      },
    ])

    const map = {}
    agg.forEach((a) => { map[a._id] = a })

    const reps = await SalesRep.find().select('name').sort({ name: 1 })
    const mk = (name) => ({
      rep: name,
      counts: {
        overdue:  map[name]?.overdue  ?? 0,
        today:    map[name]?.today    ?? 0,
        week:     map[name]?.week     ?? 0,
        upcoming: map[name]?.upcoming ?? 0,
      },
    })

    const rows = reps.map((r) => mk(r.name))
    if (map['Unassigned']) rows.push(mk('Unassigned'))

    res.json({ rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

/* ── Ranged agenda for one rep — fetches only the requested slice ──
 * Query: ?rep=<name>&from=<ISO>&to=<ISO>  (from/to optional)
 * Returns chronological follow-ups, resolved + filtered in the DB.
 */
export const getRepAgenda = async (req, res) => {
  try {
    const { rep, from, to } = req.query

    const match = { status: 'pending' }
    if (from || to) {
      match.reminderDate = {}
      if (from) match.reminderDate.$gte = new Date(from)
      if (to)   match.reminderDate.$lte = new Date(to)
    }

    const pipeline = [
      { $match: match },
      ...repResolutionStages,
      ...(rep ? [{ $match: { repName: rep } }] : []),
      { $sort: { reminderDate: 1 } },
      {
        $project: {
          _id: 1,
          date:      '$reminderDate',
          time:      '$reminderTime',
          name:      '$subject.businessName',
          priority:  '$subject.priority',
          phone:     '$subject.phone',
          stage:     '$subject.stage',
          rep:       '$repName',
          contact:   { $ifNull: ['$subject.clientPOC', '$subject.contactName'] },
          type:      { $cond: ['$isPartner', 'partner', 'lead'] },
          subjectId: '$subject._id',
        },
      },
    ]

    const items = await Reminder.aggregate(pipeline)
    res.json({
      items: items.map((i) => ({
        id: i._id,
        subjectId: i.subjectId,
        name: i.name,
        priority: i.priority,
        phone: i.phone,
        stage: i.stage,
        rep: i.rep,
        contact: i.contact,
        type: i.type,
        date: i.date,
        time: i.time || null,
      })),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
