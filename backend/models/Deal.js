import mongoose from 'mongoose'

const dealItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // optional ref
    name:        { type: String, required: true, trim: true },
    unitPrice:   { type: Number, required: true, min: 0 },
    qty:         { type: Number, default: 1, min: 1 },
    lineDiscount:{ type: Number, default: 0, min: 0, max: 100 }, // % off this line
  },
  { _id: false }
)

const dealSchema = new mongoose.Schema(
  {
    leadId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    items:         [dealItemSchema],
    discountType:  { type: String, enum: ['flat', 'percent'], default: 'percent' },
    discountValue: { type: Number, default: 0, min: 0 },
    taxRate:       { type: Number, default: 18, min: 0 }, // GST %
    subtotal:      { type: Number, default: 0 },
    discountAmount:{ type: Number, default: 0 },
    taxAmount:     { type: Number, default: 0 },
    totalAmount:   { type: Number, default: 0 },
    renewalDate:   { type: Date },
    referredBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    referralsGiven:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Lead' }],
    notes:         { type: String, trim: true },
    closedAt:      { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export default mongoose.model('Deal', dealSchema)
