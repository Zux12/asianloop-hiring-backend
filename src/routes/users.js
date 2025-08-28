const router = require('express').Router();
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

/**
 * Create an interviewer user (admin only)
 * Body: { name, email, password }
 */
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ ok: false, error: 'name, email, password required' });
    }
    let existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ ok: false, error: 'User already exists' });
    }
    const user = new User({ name, email, role: 'interviewer', passwordHash: '' });
    await user.setPassword(password);
    await user.save();
    res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to create user' });
  }
});

/**
 * List users (admin only). Optional filter: ?role=interviewer
 */
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const q = {};
    if (req.query.role) q.role = req.query.role;
    const users = await User.find(q).select('_id name email role active createdAt');
    res.json({ ok: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to list users' });
  }
});

module.exports = router;
