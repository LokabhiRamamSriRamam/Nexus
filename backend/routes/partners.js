import { Router } from 'express'
import {
  getPartners,
  getPartner,
  getActivePartners,
  createPartner,
  updatePartner,
  deletePartner,
  updateStage,
  getPartnerInteractions,
  createPartnerInteraction,
  getPartnerLeads,
  getPartnerAnalytics,
} from '../controllers/partnerController.js'

const router = Router()

router.get('/', getPartners)
router.get('/active', getActivePartners)
router.get('/analytics', getPartnerAnalytics)
router.get('/:id', getPartner)
router.post('/', createPartner)
router.put('/:id', updatePartner)
router.delete('/:id', deletePartner)
router.patch('/:id/stage', updateStage)
router.get('/:id/interactions', getPartnerInteractions)
router.post('/:id/interactions', createPartnerInteraction)
router.get('/:id/leads', getPartnerLeads)

export default router
