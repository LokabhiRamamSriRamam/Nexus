import { Router } from 'express'
import { getInteractions, createInteraction } from '../controllers/interactionController.js'

const router = Router()

router.get('/:leadId', getInteractions)
router.post('/', createInteraction)

export default router
