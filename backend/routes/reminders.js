import { Router } from 'express'
import { getTodayReminders, getUpcomingReminders, markReminderDone } from '../controllers/reminderController.js'

const router = Router()

router.get('/today', getTodayReminders)
router.get('/upcoming', getUpcomingReminders)
router.patch('/:id/done', markReminderDone)

export default router
