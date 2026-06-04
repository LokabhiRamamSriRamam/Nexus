import { Router } from 'express'
import { getSummary, getRepSummary, getRepAgenda } from '../controllers/dashboardController.js'

const router = Router()

router.get('/summary', getSummary)
router.get('/rep-summary', getRepSummary)
router.get('/rep-agenda', getRepAgenda)

export default router
