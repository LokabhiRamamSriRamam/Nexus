import Partner from '../models/Partner.js'
import Lead from '../models/Lead.js'
import Deal from '../models/Deal.js'
import Interaction from '../models/Interaction.js'
import Reminder from '../models/Reminder.js'

/* ── CRUD ──────────────────────────────────────────────── */

export const getPartners = async (req, res) => {
  try {
    const { stage, zone, priority, partnerType, internalPOC, search } = req.query
    const filter = {}
    if (stage)        filter.stage = stage
    if (zone)         filter.zone = zone
    if (priority)     filter.priority = priority
    if (partnerType)  filter.partnerType = partnerType
    if (internalPOC)  filter.internalPOC = new RegExp(internalPOC, 'i')
    if (search) {
      filter.$or = [
        { businessName: new RegExp(search, 'i') },
        { contactName: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ]
    }
    const partners = await Partner.find(filter)
      .populate('zone', 'name')
      .sort({ createdAt: -1 })
    res.json(partners)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Active partners only — used for the lead attribution picker
export const getActivePartners = async (_req, res) => {
  try {
    const partners = await Partner.find({ stage: 'post-sales' })
      .select('businessName partnerType commissionType commissionValue')
      .sort({ businessName: 1 })
    res.json(partners)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const createPartner = async (req, res) => {
  try {
    const partner = await Partner.create(req.body)
    if (partner.followUpDate) {
      await Reminder.create({
        partnerId: partner._id,
        reminderDate: partner.followUpDate,
        reminderTime: partner.followUpTime,
      })
    }
    res.status(201).json(partner)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const updatePartner = async (req, res) => {
  try {
    const partner = await Partner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('zone', 'name')
    if (!partner) return res.status(404).json({ error: 'Partner not found' })
    res.json(partner)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findByIdAndDelete(req.params.id)
    if (!partner) return res.status(404).json({ error: 'Partner not found' })
    await Interaction.deleteMany({ partnerId: req.params.id })
    await Reminder.deleteMany({ partnerId: req.params.id })
    // Detach attribution from any sourced leads (keep the leads themselves)
    await Lead.updateMany({ partnerId: req.params.id }, { $unset: { partnerId: '' } })
    res.json({ message: 'Partner deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const updateStage = async (req, res) => {
  try {
    const { stage } = req.body
    const update = { stage }
    if (stage === 'post-sales') update.activatedAt = new Date()
    const partner = await Partner.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!partner) return res.status(404).json({ error: 'Partner not found' })
    res.json(partner)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

/* ── Partner interactions (mirrors lead interaction flow) ── */

export const getPartnerInteractions = async (req, res) => {
  try {
    const interactions = await Interaction.find({ partnerId: req.params.id }).sort({ date: -1, createdAt: -1 })
    res.json(interactions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const createPartnerInteraction = async (req, res) => {
  try {
    const partnerId = req.params.id
    const interaction = await Interaction.create({ ...req.body, partnerId, leadId: undefined })

    const partner = await Partner.findById(partnerId).select('stage')
    const update = { outcome: req.body.outcome }

    if (req.body.nextFollowUpDate) {
      update.followUpDate = req.body.nextFollowUpDate
      update.followUpTime = req.body.nextFollowUpTime || null
    }

    let stageAdvanced = false
    let newStage = null

    // Same advance triggers as leads: demo-scheduled → pipeline, paid → active
    if (req.body.outcome === 'demo-scheduled' && partner?.stage === 'pre-sales') {
      update.stage = 'sales-pipeline'
      newStage = 'sales-pipeline'
      stageAdvanced = true
    } else if (req.body.outcome === 'paid' && partner?.stage === 'sales-pipeline') {
      update.stage = 'post-sales'
      update.activatedAt = new Date()
      newStage = 'post-sales'
      stageAdvanced = true
    }

    const updatedPartner = await Partner.findByIdAndUpdate(partnerId, update, { new: true }).populate('zone', 'name')

    if (req.body.nextFollowUpDate) {
      await Reminder.findOneAndUpdate(
        { partnerId, status: 'pending' },
        { reminderDate: req.body.nextFollowUpDate, reminderTime: req.body.nextFollowUpTime || null },
        { upsert: true }
      )
    }

    res.status(201).json({ interaction, stageAdvanced, newStage, updatedPartner })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

/* ── Leads sourced by a single partner ─────────────────── */

export const getPartnerLeads = async (req, res) => {
  try {
    const leads = await Lead.find({ partnerId: req.params.id })
      .populate('zone', 'name')
      .sort({ createdAt: -1 })
    res.json(leads)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

/* ── Analytics: per-partner lead tally + revenue + commission ── */

export const getPartnerAnalytics = async (_req, res) => {
  try {
    const partners = await Partner.find()
      .select('businessName partnerType commissionType commissionValue stage activatedAt')
      .lean()

    // Lead counts grouped by partner
    const leadAgg = await Lead.aggregate([
      { $match: { partnerId: { $ne: null } } },
      {
        $group: {
          _id: '$partnerId',
          leadsBrought: { $sum: 1 },
          converted: { $sum: { $cond: [{ $eq: ['$stage', 'post-sales'] }, 1, 0] } },
        },
      },
    ])
    const leadMap = {}
    leadAgg.forEach((l) => { leadMap[String(l._id)] = l })

    // Closed revenue attributed to each partner (Deal → its Lead → partnerId)
    const revAgg = await Deal.aggregate([
      { $lookup: { from: 'leads', localField: 'leadId', foreignField: '_id', as: 'lead' } },
      { $unwind: '$lead' },
      { $match: { 'lead.partnerId': { $ne: null } } },
      { $group: { _id: '$lead.partnerId', revenue: { $sum: '$totalAmount' }, deals: { $sum: 1 } } },
    ])
    const revMap = {}
    revAgg.forEach((r) => { revMap[String(r._id)] = r })

    const rows = partners.map((p) => {
      const id = String(p._id)
      const leadsBrought = leadMap[id]?.leadsBrought ?? 0
      const converted    = leadMap[id]?.converted ?? 0
      const revenue      = revMap[id]?.revenue ?? 0
      const deals        = revMap[id]?.deals ?? 0
      const conversionRate = leadsBrought ? Math.round((converted / leadsBrought) * 100) : 0
      const commissionOwed = p.commissionType === 'flat'
        ? converted * (p.commissionValue || 0)
        : Math.round(revenue * ((p.commissionValue || 0) / 100))

      return {
        _id: p._id,
        businessName: p.businessName,
        partnerType: p.partnerType,
        stage: p.stage,
        commissionType: p.commissionType,
        commissionValue: p.commissionValue,
        leadsBrought,
        converted,
        conversionRate,
        revenue,
        deals,
        commissionOwed,
      }
    })

    // Sort: most revenue first, then most leads
    rows.sort((a, b) => b.revenue - a.revenue || b.leadsBrought - a.leadsBrought)

    const totals = rows.reduce(
      (acc, r) => {
        acc.leadsBrought   += r.leadsBrought
        acc.converted      += r.converted
        acc.revenue        += r.revenue
        acc.commissionOwed += r.commissionOwed
        return acc
      },
      { leadsBrought: 0, converted: 0, revenue: 0, commissionOwed: 0 }
    )
    totals.activePartners = rows.filter((r) => r.stage === 'post-sales').length
    totals.conversionRate = totals.leadsBrought ? Math.round((totals.converted / totals.leadsBrought) * 100) : 0

    res.json({ rows, totals })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
