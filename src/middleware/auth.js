const jwt = require('jsonwebtoken');

/**
 * Verify JWT; attaches req.user = { uid, role, name }
 */
function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, error: 'Missing token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { uid, role, name }
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: 'Invalid/expired token' });
  }
}

/**
 * Require a specific role (e.g., 'admin')
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
