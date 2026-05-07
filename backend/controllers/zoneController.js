import Zone from '../models/Zone.js'

export const getZones = async (req, res) => {
  try {
    const zones = await Zone.find().sort({ name: 1 })
    res.json(zones)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const createZone = async (req, res) => {
  try {
    const zone = await Zone.create(req.body)
    res.status(201).json(zone)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const updateZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true, runValidators: true })
    if (!zone) return res.status(404).json({ error: 'Zone not found' })
    res.json(zone)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id)
    if (!zone) return res.status(404).json({ error: 'Zone not found' })
    res.json({ message: 'Zone deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
