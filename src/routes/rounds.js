const router = require('express').Router();
const Round = require('../models/Round');
const Candidate = require('../models/Candidate');
const { requireAuth, requireRole } = require('../middleware/auth');

/**
 * Create round (Admin only)
 * Body: { candidateId, roundName, scheduledAt?, durationMins?, locationOrLink?, interviewerIds: [] }
 */
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { candidateId, roundName, scheduledAt, durationMins, locationOrLink, interviewerIds } = req.body || {};
    if (!candidateId || !roundName) {
      return res.status(400).json({ ok: false, error: 'candidateId and roundName required' });
    }
    const exists = await Candidate.findById(candidateId);
    if (!exists) return res.status(404).json({ ok: false, error: 'Candidate not found' });

    const round = await Round.create({
      candidateId,
      roundName,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      durationMins: durationMins ?? 60,
      locationOrLink,
      interviewerIds: Array.isArray(interviewerIds) ? interviewerIds : [],
      createdBy: req.user?.uid
    });

    res.json({ ok: true, round });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to create round' });
  }
});

/**
 * List rounds by candidate (Admin & Interviewers assigned)
 * Query: ?candidateId=...
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { candidateId } = req.query || {};
    const q = {};
    if (candidateId) q.candidateId = candidateId;

    // Interviewers only see rounds where they are assigned
    if (req.user.role === 'interviewer') {
      q.interviewerIds = req.user.uid;
    }

    const rounds = await Round.find(q).sort({ scheduledAt: 1, createdAt: -1 });
    res.json({ ok: true, rounds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to list rounds' });
  }
});

/**
 * Update round (Admin only)
 * Body can include: roundName, scheduledAt, durationMins, locationOrLink, interviewerIds, stage
 */
router.patch('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const allowed = ['roundName', 'scheduledAt', 'durationMins', 'locationOrLink', 'interviewerIds', 'stage'];
    const updates = {};
    for (const k of allowed) {
      if (k in req.body) updates[k] = req.body[k];
    }
    if (updates.scheduledAt) updates.scheduledAt = new Date(updates.scheduledAt);

    const round = await Round.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!round) return res.status(404).json({ ok: false, error: 'Not found' });

    res.json({ ok: true, round });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to update round' });
  }
});

module.exports = router;
