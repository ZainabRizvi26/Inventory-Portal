const router = require('express').Router();
const User = require('../models/User');
const { requireAuth, requireAdmin, requireSuperAdmin } = require('../middleware/auth');

const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'fullName email username role isSuperAdmin location lastSeen createdAt').sort({ createdAt: -1 }).lean();
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

router.put('/:id/revoke-admin', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ message: 'You cannot revoke your own admin rights.' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found.' });
    if (target.isSuperAdmin) return res.status(403).json({ message: 'The main admin cannot be demoted.' });
    target.role = 'user';
    await target.save();
    res.json({ message: 'Admin rights revoked.' });
  } catch {
    res.status(500).json({ message: 'Unable to revoke admin rights right now.' });
  }
});

module.exports = router;
