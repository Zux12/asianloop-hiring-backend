const router = require('express').Router();
const Evaluation = require('../models/Evaluation');
const Round = require('../models/Round');
const Candidate = require('../models/Candidate');
const { requireAuth } = require('../middleware/auth');
const { redFlagForFamily, computeEvalPercent, decideRecommendation } = require('../utils/scoring');

/**
 * Create/Update an evaluation (interviewer must be assigned to the round; admin allowed too)
 * Body: { candidateId, roundId, scores:{technical,problem,safety,communication,culture}, notes? }
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { candidateId, roundId, scores, notes } = req.body || {};
    if (!candidateId || !roundId || !scores) {
      return res.status(400).json({ ok: false, error: 'candidateId, roundId, scores required' });
    }

    // Verify round & access
    const round = await Round.findById(roundId);
    if (!round || String(round.candidateId) !== String(candidateId)) {
      return res.status(404).json({ ok: false, error: 'Round not found for candidate' });
    }
    // Access control: interviewer must be assigned OR user is admin
    if (req.user.role !== 'admin') {
      const isAssigned = (round.interviewerIds || []).some(id => String(id) === String(req.user.uid));
      if (!isAssigned) return res.status(403).json({ ok: false, error: 'Not assigned to this round' });
    }

    // Fetch candidate to get family
    const cand = await Candidate.findById(candidateId);
    if (!cand) return res.status(404).json({ ok: false, error: 'Candidate not found' });

    const evalPercent = computeEvalPercent(cand.appliedFamily, scores);
    const rf = redFlagForFamily(cand.appliedFamily, scores);
    const decision = decideRecommendation(cand.appliedFamily, evalPercent, rf);

    // Upsert (one per interviewer per round)
    const doc = await Evaluation.findOneAndUpdate(
      { candidateId, roundId, interviewerId: req.user.uid },
      { candidateId, roundId, interviewerId: req.user.uid, scores, evalPercent, recommendation: decision.recommendation, notes },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ ok: true, evaluation: doc, redFlag: rf });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to submit evaluation' });
  }
});

/**
 * List evaluations (by candidate or round). Admin sees all; interviewer sees own.
 * Query: ?candidateId=... OR ?roundId=...
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { candidateId, roundId } = req.query || {};
    const q = {};
    if (candidateId) q.candidateId = candidateId;
    if (roundId) q.roundId = roundId;

    if (req.user.role !== 'admin') {
      q.interviewerId = req.user.uid;
    }

    const evals = await Evaluation.find(q).sort({ createdAt: -1 });
    res.json({ ok: true, evaluations: evals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to list evaluations' });
  }
});

/**
 * Aggregate for a candidate: averages across all evaluations (all rounds)
 * Returns: { percentAvg, n, recommendation, redFlagTriggered? }
 */
router.get('/aggregate', requireAuth, async (req, res) => {
  try {
    const { candidateId } = req.query || {};
    if (!candidateId) return res.status(400).json({ ok: false, error: 'candidateId required' });

    const cand = await Candidate.findById(candidateId);
    if (!cand) return res.status(404).json({ ok: false, error: 'Candidate not found' });

    const evals = await Evaluation.find({ candidateId });
    const n = evals.length;
    const percentAvg = n ? Math.round(evals.reduce((s, e) => s + (e.evalPercent || 0), 0) / n) : 0;

    // Recompute overall recommendation from average (red-flag if any eval had red-flag)
    let redFlagTriggered = false;
    for (const e of evals) {
      const rf = redFlagForFamily(cand.appliedFamily, e.scores || {});
      if (rf.redFlag) { redFlagTriggered = true; break; }
    }
    const decision = decideRecommendation(cand.appliedFamily, percentAvg, redFlagTriggered ? { redFlag: true, reason: 'One or more red flags' } : null);

    res.json({ ok: true, candidateId, n, percentAvg, recommendation: decision.recommendation, redFlagTriggered });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to aggregate' });
  }
});

module.exports = router;
