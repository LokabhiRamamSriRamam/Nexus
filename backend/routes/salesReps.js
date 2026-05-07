import { Router } from 'express'
import { getSalesReps, createSalesRep, updateSalesRep, deleteSalesRep } from '../controllers/salesRepController.js'

const router = Router()

router.get('/', getSalesReps)
router.post('/', createSalesRep)
router.put('/:id', updateSalesRep)
router.delete('/:id', deleteSalesRep)

export default router
