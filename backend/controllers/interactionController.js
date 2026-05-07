import Interaction from '../models/Interaction.js'
import Lead from '../models/Lead.js'

export const getInteractions = async (req, res) => {
  try {
    const interactions = await Interaction.find({ leadId: req.params.leadId }).sort({ date: -1, createdAt: -1 })
    res.json(interactions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const createInteraction = async (req, res) => {
  try {
    const interaction = await Interaction.create(req.body)

    let stageAdvanced = false
    let newStage = null
    let updatedLead = null

    if (req.body.leadId) {
      const lead = await Lead.findById(req.body.leadId).select('stage')

      const leadUpdate = { outcome: req.body.outcome }

      // Apply next follow-up date if provided
      if (req.body.nextFollowUpDate) {
        leadUpdate.followUpDate = req.body.nextFollowUpDate
        leadUpdate.followUpTime = req.body.nextFollowUpTime || null
      }

      // Stage advance triggers
      if (req.body.outcome === 'demo-scheduled' && lead?.stage === 'pre-sales') {
        leadUpdate.stage = 'sales-pipeline'
        newStage = 'sales-pipeline'
        stageAdvanced = true
      } else if (req.body.outcome === 'paid' && lead?.stage === 'sales-pipeline') {
        leadUpdate.stage = 'post-sales'
        newStage = 'post-sales'
        stageAdvanced = true
      }

      updatedLead = await Lead.findByIdAndUpdate(req.body.leadId, leadUpdate, { new: true })
        .populate('zone', 'name')
    }

    res.status(201).json({ interaction, stageAdvanced, newStage, updatedLead })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}
