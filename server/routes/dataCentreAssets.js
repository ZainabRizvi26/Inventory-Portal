const router = require('express').Router();
const DataCentreAsset = require('../models/DataCentreAsset');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { q, type, location, status, name } = req.query;
    const filter = {};
    if (type) filter.assetType = type;
    if (location) filter.location = location;
    if (status) filter.status = status;
    const andConditions = [];
    if (name) {
      const nameRegex = new RegExp(String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      andConditions.push({ assetName: nameRegex });
    }
    if (q) {
      const regex = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      andConditions.push({ $or: [{ assetName: regex }, { serviceTag: regex }, { ipAddress: regex }, { rackLocation: regex }] });
    }
    if (andConditions.length) filter.$and = andConditions;
    const items = await DataCentreAsset.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ items, total: items.length });
  } catch {
    res.status(500).json({ message: 'Unable to load data centre assets right now.' });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { assetName, assetType, serviceTag, ipAddress, rackLocation, installDate, warrantyExpiry, status, location } = req.body;
    if (!assetName || !assetType || !location) {
      return res.status(400).json({ message: 'Asset name, asset type and location are required.' });
    }
    const item = await DataCentreAsset.create({ assetName, assetType, serviceTag, ipAddress, rackLocation, installDate, warrantyExpiry, status, location });
    res.status(201).json({ item });
  } catch {
    res.status(400).json({ message: 'Unable to add the asset. Please check your details and try again.' });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { assetName, assetType, serviceTag, ipAddress, rackLocation, installDate, warrantyExpiry, status, location } = req.body;
    const item = await DataCentreAsset.findByIdAndUpdate(
      req.params.id,
      { assetName, assetType, serviceTag, ipAddress, rackLocation, installDate, warrantyExpiry, status, location },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Asset not found.' });
    res.json({ item });
  } catch {
    res.status(400).json({ message: 'Unable to update the asset. Please check your details and try again.' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await DataCentreAsset.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted.' });
  } catch {
    res.status(400).json({ message: 'Unable to delete this asset.' });
  }
});

module.exports = router;
