import { Router } from 'express'
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  updateStage,
  updateOutcome,
} from '../controllers/leadController.js'

const router = Router()

router.get('/', getLeads)
router.post('/', createLead)
router.put('/:id', updateLead)
router.delete('/:id', deleteLead)
router.patch('/:id/stage', updateStage)
router.patch('/:id/outcome', updateOutcome)

export default router
