const router = require('express').Router();
const PortMapping = require('../models/PortMapping');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    const filter = {};
    if (q) {
      const regex = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ username: regex }, { dataPort: regex }, { voicePort: regex }];
    }
    const items = await PortMapping.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ items, total: items.length });
  } catch {
    res.status(500).json({ message: 'Unable to load port mappings right now.' });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, dataPort, voicePort } = req.body;
    if (!username || !dataPort || !voicePort) {
      return res.status(400).json({ message: 'Username, data port and voice port are all required.' });
    }
    const item = await PortMapping.create({ username, dataPort, voicePort });
    res.status(201).json({ item });
  } catch {
    res.status(400).json({ message: 'Unable to add the port mapping. Please check your details and try again.' });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, dataPort, voicePort } = req.body;
    if (!username || !dataPort || !voicePort) {
      return res.status(400).json({ message: 'Username, data port and voice port are all required.' });
    }
    const item = await PortMapping.findByIdAndUpdate(req.params.id, { username, dataPort, voicePort }, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Port mapping not found.' });
    res.json({ item });
  } catch {
    res.status(400).json({ message: 'Unable to update the port mapping. Please check your details and try again.' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await PortMapping.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted.' });
  } catch {
    res.status(400).json({ message: 'Unable to delete this entry.' });
  }
});

module.exports = router;
