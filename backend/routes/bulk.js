import { Router } from 'express'
import multer from 'multer'
import { downloadSample, bulkUpload } from '../controllers/bulkController.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ok = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ].includes(file.mimetype)
    cb(ok ? null : new Error('Only .xlsx and .csv files are accepted'), ok)
  },
})

const router = Router()

router.get('/sample', downloadSample)
router.post('/upload', upload.single('file'), bulkUpload)

export default router
