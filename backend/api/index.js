import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from '../routes/auth.js'
import leadRoutes from '../routes/leads.js'
import interactionRoutes from '../routes/interactions.js'
import dealRoutes from '../routes/deals.js'
import productRoutes from '../routes/products.js'
import zoneRoutes from '../routes/zones.js'
import reminderRoutes from '../routes/reminders.js'
import dashboardRoutes from '../routes/dashboard.js'
import salesRepRoutes from '../routes/salesReps.js'
import bulkRoutes from '../routes/bulk.js'
import { requireAuth } from '../middleware/auth.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// DB connection — cached for Vercel serverless (avoids reconnecting on every request)
let isConnected = false
async function connectDB() {
  if (isConnected) return
  await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME })
  isConnected = true
}

app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (err) {
    console.error('[db] Connection failed:', err.message)
    res.status(500).json({ error: 'Database connection failed' })
  }
})

// Public
app.use('/api/auth', authRoutes)

// Protected
app.use('/api', requireAuth)
app.use('/api/leads', leadRoutes)
app.use('/api/interactions', interactionRoutes)
app.use('/api/deals', dealRoutes)
app.use('/api/products', productRoutes)
app.use('/api/zones', zoneRoutes)
app.use('/api/reminders', reminderRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/sales-reps', salesRepRoutes)
app.use('/api/bulk', bulkRoutes)

// Required by Vercel
export default function handler(req, res) {
  return app(req, res)
}
