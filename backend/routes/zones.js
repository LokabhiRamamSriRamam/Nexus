import { Router } from 'express'
import { getZones, createZone, updateZone, deleteZone } from '../controllers/zoneController.js'

const router = Router()

router.get('/', getZones)
router.post('/', createZone)
router.put('/:id', updateZone)
router.delete('/:id', deleteZone)

export default router
