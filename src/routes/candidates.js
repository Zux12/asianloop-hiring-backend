const router = require('express').Router();
const Candidate = require('../models/Candidate');
const { requireAuth, requireRole } = require('../middleware/auth');

/**
 * Create candidate (Admin only)
 * Body: { fullName, email, phone?, appliedFamily, yearsExp?, skills?, tags? }
 */
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { fullName, email, phone, appliedFamily, yearsExp, skills, tags } = req.body || {};
    if (!fullName || !email || !appliedFamily) {
      return res.status(400).json({ ok: false, error: 'fullName, email, appliedFamily required' });
    }

    // Optional: simple de-dup check by email+family
    const exists = await Candidate.findOne({ email, appliedFamily });
    if (exists) {
      return res.status(409).json({ ok: false, error: 'Candidate already exists for this family' });
    }

    const c = await Candidate.create({
      fullName,
      email,
      phone,
      appliedFamily,
      yearsExp: yearsExp ?? 0,
      skills: Array.isArray(skills) ? skills : [],
      tags: Array.isArray(tags) ? tags : []
    });

    res.json({ ok: true, candidate: { id: c._id, fullName: c.fullName, email: c.email, appliedFamily: c.appliedFamily, status: c.status } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to create candidate' });
  }
});

/**
 * List candidates (Admin & Interviewers)
 * Filters: ?family=...&status=...&q=searchText
 * Pagination: ?page=1&limit=20
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { family, status, q, page = 1, limit = 20 } = req.query;
    const where = {};
    if (family) where.appliedFamily = family;
    if (status) where.status = status;

    // Basic text-ish search on name/email/skills/tags
    if (q) {
      const re = new RegExp(q, 'i');
      where.$or = [{ fullName: re }, { email: re }, { skills: re }, { tags: re }];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const lim = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [items, total] = await Promise.all([
      Candidate.find(where)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * lim)
        .limit(lim)
        .select('_id fullName email appliedFamily status yearsExp skills tags createdAt'),
      Candidate.countDocuments(where)
    ]);

    res.json({ ok: true, total, page: pageNum, limit: lim, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to list candidates' });
  }
});

/**
 * Get candidate by id
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const c = await Candidate.findById(req.params.id);
    if (!c) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, candidate: c });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to get candidate' });
  }
});

/**
 * Update candidate (Admin only)
 * Body can include: status, phone, yearsExp, skills, tags, notes (append), cv
 */
router.patch('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const allowed = ['fullName', 'email', 'phone', 'status', 'yearsExp', 'skills', 'tags', 'cv'];
    const updates = {};
    for (const k of allowed) {
      if (k in req.body) updates[k] = req.body[k];
    }

    // Append note if provided
    if (req.body.noteText) {
      updates.$push = updates.$push || {};
      updates.$push.notes = { byUserId: req.user?.uid, text: req.body.noteText, at: new Date() };
    }

    const c = await Candidate.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!c) return res.status(404).json({ ok: false, error: 'Not found' });

    res.json({ ok: true, candidate: c });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to update candidate' });
  }
});

module.exports = router;
