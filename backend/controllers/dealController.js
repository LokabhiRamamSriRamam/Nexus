import Deal from '../models/Deal.js'

function computeTotals(items = [], discountType = 'percent', discountValue = 0, taxRate = 18) {
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = (item.unitPrice || 0) * (item.qty || 1)
    const lineDiscountAmt = lineTotal * ((item.lineDiscount || 0) / 100)
    return sum + lineTotal - lineDiscountAmt
  }, 0)

  const discountAmount =
    discountType === 'flat'
      ? Math.min(discountValue || 0, subtotal)
      : subtotal * ((discountValue || 0) / 100)

  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxableAmount * ((taxRate || 0) / 100)
  const totalAmount = taxableAmount + taxAmount

  return {
    subtotal:       Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxAmount:      Math.round(taxAmount * 100) / 100,
    totalAmount:    Math.round(totalAmount * 100) / 100,
  }
}

const POPULATE = [
  { path: 'items.productId', select: 'name billingCycle' },
  { path: 'referredBy',      select: 'businessName' },
  { path: 'referralsGiven',  select: 'businessName' },
]

export const getDeals = async (req, res) => {
  try {
    const deals = await Deal.find()
      .populate('leadId', 'businessName phone email clientPOC internalPOC')
      .populate(POPULATE)
      .sort({ closedAt: -1 })
    res.json(deals)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const getDealByLead = async (req, res) => {
  try {
    const deal = await Deal.findOne({ leadId: req.params.leadId }).populate(POPULATE)
    if (!deal) return res.status(404).json({ error: 'Deal not found' })
    res.json(deal)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const createDeal = async (req, res) => {
  try {
    const { items = [], discountType, discountValue, taxRate, ...rest } = req.body
    const totals = computeTotals(items, discountType, discountValue, taxRate)
    const deal = await Deal.create({ items, discountType, discountValue, taxRate, ...totals, ...rest })
    const populated = await deal.populate(POPULATE)
    res.status(201).json(populated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const updateDeal = async (req, res) => {
  try {
    const { items = [], discountType, discountValue, taxRate, ...rest } = req.body
    const totals = computeTotals(items, discountType, discountValue, taxRate)
    const deal = await Deal.findByIdAndUpdate(
      req.params.id,
      { items, discountType, discountValue, taxRate, ...totals, ...rest },
      { new: true, runValidators: true }
    ).populate(POPULATE)
    if (!deal) return res.status(404).json({ error: 'Deal not found' })
    res.json(deal)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}
