import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    basePrice: { type: Number, required: true },
    billingCycle: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'one-time'], default: 'monthly' },
    features: [{ type: String, trim: true }],
  },
  { timestamps: true }
)

export default mongoose.model('Product', productSchema)
