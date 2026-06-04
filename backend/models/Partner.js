import mongoose from 'mongoose'

// A Partner is a partnership prospect that flows through its own pipeline
// (pre-sales → sales-pipeline → post-sales) exactly like a sales lead.
// Once "active" (post-sales) the partner sources customer leads, which are
// attributed back via Lead.partnerId and tallied in analytics.
const partnerSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true },   // partner org name
    contactName:  { type: String, trim: true },                   // their POC
    phone:        { type: String, trim: true },
    email:        { type: String, trim: true, lowercase: true },
    address:      { type: String, trim: true },
    website:      { type: String, trim: true },

    partnerType: {
      type: String,
      enum: ['reseller', 'referral', 'affiliate', 'channel', 'franchise', 'other'],
      default: 'referral',
    },

    // Commission / revenue-share owed to the partner on attributed business
    commissionType:  { type: String, enum: ['percent', 'flat'], default: 'percent' },
    commissionValue: { type: Number, default: 0, min: 0 }, // percent: % of closed revenue; flat: ₹ per converted lead

    internalPOC: { type: String, trim: true },
    zone:        { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
    priority:    { type: String, enum: ['P0', 'P1', 'P2', 'P3', 'P4'], default: 'P2' },
    source:      { type: String, enum: ['call', 'mail', 'referral', 'walk-in', 'event', 'other'], default: 'other' },

    outcome: {
      type: String,
      enum: [
        'fresh-lead', 'call-made', 'call-not-picked', 'follow-up-scheduled', 'demo-scheduled',
        'follow-up-needed', 'interested', 'not-interested', 'negotiation', 'deal-sent', 'paid',
        'renewal-discussion', 'renewal-confirmed', 'churned',
      ],
      default: 'fresh-lead',
    },

    followUpDate: { type: Date },
    followUpTime: { type: String },
    notes:        { type: String, trim: true },

    stage: {
      type: String,
      enum: ['pre-sales', 'sales-pipeline', 'post-sales', 'lost'],
      default: 'pre-sales',
    },
    activatedAt: { type: Date }, // set when the partnership becomes active (post-sales)
  },
  { timestamps: true }
)

export default mongoose.model('Partner', partnerSchema)
