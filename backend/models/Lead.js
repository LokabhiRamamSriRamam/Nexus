import mongoose from 'mongoose'

const leadSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true },
    mapsLink: { type: String, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    clientPOC: { type: String, trim: true },
    internalPOC: { type: String, trim: true },
    zone: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
    priority: { type: String, enum: ['P0', 'P1', 'P2', 'P3', 'P4'], default: 'P2' },
    source: { type: String, enum: ['call', 'mail', 'referral', 'walk-in', 'partnership', 'other'], default: 'call' },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' }, // which partner sourced this lead
    outcome: {
      type: String,
      enum: [
        'fresh-lead', 'call-made', 'call-not-picked', 'follow-up-scheduled', 'demo-scheduled',
        'follow-up-needed', 'interested', 'not-interested', 'negotiation', 'demo-scheduled', 'deal-sent', 'paid',
        'renewal-discussion', 'renewal-confirmed', 'churned',
      ],
      default: 'fresh-lead',
    },
    followUpDate: { type: Date },
    followUpTime: { type: String },
    notes: { type: String, trim: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    stage: {
      type: String,
      enum: ['pre-sales', 'sales-pipeline', 'post-sales', 'lost'],
      default: 'pre-sales',
    },
  },
  { timestamps: true }
)

export default mongoose.model('Lead', leadSchema)
