import { Router } from 'express'
import { getDeals, getDealByLead, createDeal, updateDeal } from '../controllers/dealController.js'

const router = Router()

router.get('/', getDeals)
router.get('/:leadId', getDealByLead)
router.post('/', createDeal)
router.put('/:id', updateDeal)

export default router
