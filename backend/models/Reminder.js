import mongoose from 'mongoose'

const reminderSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
    reminderDate: { type: Date, required: true },
    reminderTime: { type: String },
    status: { type: String, enum: ['pending', 'done'], default: 'pending' },
  },
  { timestamps: true }
)

export default mongoose.model('Reminder', reminderSchema)
