import mongoose from 'mongoose'

// method = how the interaction happened (stage-specific)
// outcome = what the result was (stage-specific, drives stage advances)
const interactionSchema = new mongoose.Schema(
  {
    leadId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    date:    { type: Date, required: true, default: Date.now },
    time:    { type: String },
    method:  {
      type: String,
      enum: ['call', 'email', 'whatsapp', 'google-meet', 'in-person', 'other'],
      required: true,
      default: 'call',
    },
    outcome: {
      type: String,
      enum: [
        // pre-sales outcomes
        'fresh-lead', 'call-made', 'call-not-picked', 'follow-up-scheduled', 'demo-scheduled',
        // sales-pipeline outcomes
        'follow-up-needed', 'interested', 'not-interested', 'negotiation', 'demo-scheduled', 'deal-sent', 'paid',
        // post-sales outcomes
        'renewal-discussion', 'renewal-confirmed', 'churned',
      ],
      required: true,
    },
    mom:              { type: String, trim: true },
    loggedBy:         { type: String, trim: true },
    nextFollowUpDate: { type: Date },
    nextFollowUpTime: { type: String, trim: true },
  },
  { timestamps: true }
)

export default mongoose.model('Interaction', interactionSchema)
