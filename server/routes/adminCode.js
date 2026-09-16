const router = require('express').Router();
const AdminCode = require('../models/AdminCode');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');

router.get('/', requireAuth, requireSuperAdmin, async (_req, res) => {
  try {
    const stored = await AdminCode.findOne({ key: 'admin-signup-code' });
    res.json({ code: stored ? stored.code : null });
  } catch {
    res.status(500).json({ message: 'Unable to load the admin code right now.' });
  }
});

router.put('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const code = String(req.body.code || '').trim();
    if (code.length < 6) return res.status(400).json({ message: 'Admin code must be at least 6 characters.' });
    const stored = await AdminCode.findOneAndUpdate(
      { key: 'admin-signup-code' },
      { code },
      { new: true, upsert: true }
    );
    res.json({ code: stored.code, message: 'Admin code updated.' });
  } catch {
    res.status(500).json({ message: 'Unable to update the admin code right now.' });
  }
});

module.exports = router;
