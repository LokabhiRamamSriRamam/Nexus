import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import cron from 'node-cron'

import authRoutes from './routes/auth.js'
import leadRoutes from './routes/leads.js'
import interactionRoutes from './routes/interactions.js'
import dealRoutes from './routes/deals.js'
import partnerRoutes from './routes/partners.js'
import productRoutes from './routes/products.js'
import zoneRoutes from './routes/zones.js'
import reminderRoutes from './routes/reminders.js'
import dashboardRoutes from './routes/dashboard.js'
import salesRepRoutes from './routes/salesReps.js'
import bulkRoutes from './routes/bulk.js'
import { requireAuth } from './middleware/auth.js'

import Lead from './models/Lead.js'
import Reminder from './models/Reminder.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// Public — no auth required
app.use('/api/auth', authRoutes)

// Protected — all routes below require a valid JWT
app.use('/api', requireAuth)
app.use('/api/leads', leadRoutes)
app.use('/api/interactions', interactionRoutes)
app.use('/api/deals', dealRoutes)
app.use('/api/partners', partnerRoutes)
app.use('/api/products', productRoutes)
app.use('/api/zones', zoneRoutes)
app.use('/api/reminders', reminderRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/sales-reps', salesRepRoutes)
app.use('/api/bulk', bulkRoutes)

// Sync reminders from lead follow-up dates daily at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const leads = await Lead.find({ followUpDate: { $exists: true, $ne: null } })
    for (const lead of leads) {
      await Reminder.findOneAndUpdate(
        { leadId: lead._id, status: 'pending' },
        { reminderDate: lead.followUpDate, reminderTime: lead.followUpTime },
        { upsert: true }
      )
    }
    console.log('[cron] Reminders synced')
  } catch (err) {
    console.error('[cron] Reminder sync failed:', err.message)
  }
})

const PORT = process.env.PORT || 5000

mongoose
  .connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME })
  .then(() => {
    console.log(`[db] Connected to MongoDB — ${process.env.DB_NAME}`)
    app.listen(PORT, () => console.log(`[server] Running on port ${PORT}`))
  })
  .catch((err) => {
    console.error('[db] Connection failed:', err.message)
    process.exit(1)
  })
