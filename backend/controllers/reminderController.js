import Reminder from '../models/Reminder.js'
import dayjs from 'dayjs'

export const getTodayReminders = async (req, res) => {
  try {
    const start = dayjs().startOf('day').toDate()
    const end = dayjs().endOf('day').toDate()
    const reminders = await Reminder.find({
      reminderDate: { $gte: start, $lte: end },
      status: 'pending',
    }).populate('leadId', 'businessName phone clientPOC internalPOC priority')
    res.json(reminders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const getUpcomingReminders = async (req, res) => {
  try {
    const start = dayjs().add(1, 'day').startOf('day').toDate()
    const end = dayjs().add(7, 'day').endOf('day').toDate()
    const reminders = await Reminder.find({
      reminderDate: { $gte: start, $lte: end },
      status: 'pending',
    })
      .populate('leadId', 'businessName phone clientPOC internalPOC priority')
      .sort({ reminderDate: 1 })
    res.json(reminders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const markReminderDone = async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndUpdate(req.params.id, { status: 'done' }, { new: true })
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' })
    res.json(reminder)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}
