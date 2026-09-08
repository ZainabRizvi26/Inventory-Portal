const router = require('express').Router(); const jwt = require('jsonwebtoken'); const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const tokenFor = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
router.post('/register', async (req, res) => { try { const { email, username, fullName, password, phone, dob, location } = req.body; if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' }); if (await User.findOne({ $or: [{ email }, ...(username ? [{ username }] : [])] })) return res.status(409).json({ message: 'An account with that email or username already exists.' }); const user = await User.create({ email, username, fullName, password, phone, dob, location, lastSeen: new Date() }); res.status(201).json({ token: tokenFor(user), user: { id: user._id, fullName: user.fullName, role: user.role, location: user.location } }); } catch { res.status(400).json({ message: 'Unable to create the account. Please check your details and try again.' }); } });
router.post('/login', async (req, res) => { try { const { identifier, password, role } = req.body; if (!identifier || !password) return res.status(400).json({ message: 'Username/email and password are required.' }); const user = await User.findOne({ $or: [{ email: identifier.toLowerCase() }, { username: identifier }] }); if (!user || !(await user.comparePassword(password)) || (role && user.role !== role)) return res.status(401).json({ message: 'Invalid credentials or portal type.' }); user.lastSeen = new Date(); await user.save(); res.json({ token: tokenFor(user), user: { id: user._id, fullName: user.fullName, role: user.role, location: user.location } }); } catch { res.status(500).json({ message: 'Unable to sign in.' }); } });
router.post('/heartbeat', requireAuth, async (req, res) => { try { await User.findByIdAndUpdate(req.user.id, { lastSeen: new Date() }); res.json({ ok: true }); } catch { res.status(500).json({ message: 'Unable to record activity.' }); } });
router.post('/change-password', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Please sign in to change your password.' });
    let payload;
    try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch { return res.status(401).json({ message: 'Session expired. Please sign in again.' }); }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current password and new password are both required.' });
    if (String(newPassword).length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    if (!(await user.comparePassword(currentPassword))) return res.status(401).json({ message: 'Current password is incorrect.' });
    if (await user.comparePassword(newPassword)) return res.status(400).json({ message: 'New password must be different from the current password.' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch {
    res.status(500).json({ message: 'Unable to change the password right now. Please try again.' });
  }
});
module.exports = router;
