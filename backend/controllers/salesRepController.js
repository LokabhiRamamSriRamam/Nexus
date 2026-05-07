import SalesRep from '../models/SalesRep.js'

export const getSalesReps = async (req, res) => {
  try {
    const reps = await SalesRep.find().sort({ name: 1 })
    res.json(reps)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const createSalesRep = async (req, res) => {
  try {
    const rep = await SalesRep.create(req.body)
    res.status(201).json(rep)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const updateSalesRep = async (req, res) => {
  try {
    const rep = await SalesRep.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true, runValidators: true })
    if (!rep) return res.status(404).json({ error: 'Sales rep not found' })
    res.json(rep)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const deleteSalesRep = async (req, res) => {
  try {
    const rep = await SalesRep.findByIdAndDelete(req.params.id)
    if (!rep) return res.status(404).json({ error: 'Sales rep not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
