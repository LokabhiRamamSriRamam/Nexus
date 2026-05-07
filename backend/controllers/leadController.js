import Lead from '../models/Lead.js'
import Reminder from '../models/Reminder.js'

export const getLeads = async (req, res) => {
  try {
    const { stage, zone, priority, internalPOC, search } = req.query
    const filter = {}
    if (stage) filter.stage = stage
    if (zone) filter.zone = zone
    if (priority) filter.priority = priority
    if (internalPOC) filter.internalPOC = new RegExp(internalPOC, 'i')
    if (search) {
      filter.$or = [
        { businessName: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { clientPOC: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ]
    }
    const leads = await Lead.find(filter)
      .populate('zone', 'name')
      .populate('referredBy', 'businessName')
      .sort({ createdAt: -1 })
    res.json(leads)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const createLead = async (req, res) => {
  try {
    const lead = await Lead.create(req.body)
    if (lead.followUpDate) {
      await Reminder.create({
        leadId: lead._id,
        reminderDate: lead.followUpDate,
        reminderTime: lead.followUpTime,
      })
    }
    res.status(201).json(lead)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('zone', 'name')
      .populate('referredBy', 'businessName')
    if (!lead) return res.status(404).json({ error: 'Lead not found' })

    if (req.body.followUpDate) {
      await Reminder.findOneAndUpdate(
        { leadId: lead._id, status: 'pending' },
        { reminderDate: req.body.followUpDate, reminderTime: req.body.followUpTime || lead.followUpTime },
        { upsert: true, new: true }
      )
    }
    res.json(lead)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id)
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    await Reminder.deleteMany({ leadId: req.params.id })
    res.json({ message: 'Lead deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const updateStage = async (req, res) => {
  try {
    const { stage } = req.body
    const lead = await Lead.findByIdAndUpdate(req.params.id, { stage }, { new: true })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    res.json(lead)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const updateOutcome = async (req, res) => {
  try {
    const { outcome } = req.body
    const lead = await Lead.findByIdAndUpdate(req.params.id, { outcome }, { new: true })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    res.json(lead)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}
