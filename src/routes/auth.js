const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// quick ping
router.get('/', (req, res) => {
  res.json({ ok: true, message: 'Auth route works' });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password required' });
    }
    const user = await User.findOne({ email, active: true });
    if (!user) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    const ok = await user.validatePassword(password);
    if (!ok) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    const token = jwt.sign({ uid: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ ok: true, token, role: user.role, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Login failed' });
  }
});

module.exports = router;
