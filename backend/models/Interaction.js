import mongoose from 'mongoose'

// method = how the interaction happened (stage-specific)
// outcome = what the result was (stage-specific, drives stage advances)
const interactionSchema = new mongoose.Schema(
  {
    // An interaction belongs to either a Lead or a Partner (partnership pipeline)
    leadId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
    date:    { type: Date, required: true, default: Date.now },
    time:    { type: String },
    method:  {
      type: String,
      enum: ['call', 'email', 'whatsapp', 'google-meet', 'in-person', 'walk-in', 'other'],
      required: true,
      default: 'call',
    },
    outcome: {
      type: String,
      enum: [
        // generic / pre-sales
        'fresh-lead', 'call-made', 'call-not-picked', 'follow-up-scheduled', 'demo-scheduled',
        'email-sent', 'email-replied', 'message-sent', 'message-replied', 'walked-in',
        // sales-pipeline
        'follow-up-needed', 'interested', 'not-interested', 'negotiation', 'deal-sent', 'paid',
        // post-sales
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
