const router = require('express').Router();
const Accessory = require('../models/Accessory');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { q, type, location, status } = req.query;
    const filter = {};
    if (type) filter.deviceType = type;
    if (location) filter.location = location;
    if (status) filter.status = status;
    if (q) {
      const regex = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ deviceName: regex }, { displayName: regex }, { serviceTag: regex }, { shipTag: regex }, { username: regex }, { customAccMainU: regex }];
    }
    const items = await Accessory.find(filter).sort({ srfNo: 1, createdAt: -1 }).lean();
    res.json({ items, total: items.length });
  } catch {
    res.status(500).json({ message: 'Unable to load accessories right now.' });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { srfNo, deviceName, displayName, deviceType, serviceTag, shipTag, shipDate, expiryDate, username, customAccMainU, status, location } = req.body;
    if (!deviceName || !deviceType || !location) {
      return res.status(400).json({ message: 'Device name, device type and location are required.' });
    }
    const item = await Accessory.create({ srfNo, deviceName, displayName, deviceType, serviceTag, shipTag, shipDate, expiryDate, username, customAccMainU, status, location });
    res.status(201).json({ item });
  } catch {
    res.status(400).json({ message: 'Unable to add the accessory. Please check your details and try again.' });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { srfNo, deviceName, displayName, deviceType, serviceTag, shipTag, shipDate, expiryDate, username, customAccMainU, status, location } = req.body;
    const item = await Accessory.findByIdAndUpdate(
      req.params.id,
      { srfNo, deviceName, displayName, deviceType, serviceTag, shipTag, shipDate, expiryDate, username, customAccMainU, status, location },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Accessory not found.' });
    res.json({ item });
  } catch {
    res.status(400).json({ message: 'Unable to update the accessory. Please check your details and try again.' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await Accessory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted.' });
  } catch {
    res.status(400).json({ message: 'Unable to delete this accessory.' });
  }
});

module.exports = router;
