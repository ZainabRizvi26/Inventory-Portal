const router = require('express').Router();
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'fullName email username role location lastSeen createdAt').sort({ createdAt: -1 }).lean();
    const now = Date.now();
    const items = users.map((u) => ({
      ...u,
      isActive: u.lastSeen ? now - new Date(u.lastSeen).getTime() < ACTIVE_WINDOW_MS : false,
    }));
    res.json({ items, total: items.length });
  } catch {
    res.status(500).json({ message: 'Unable to load users right now.' });
  }
});

module.exports = router;
