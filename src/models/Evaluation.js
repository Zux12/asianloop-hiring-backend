const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    roundId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Round',     required: true, index: true },
    interviewerId:{ type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true, index: true },

    // Scores are 1..5 (integers). Keep names generic to work across families.
    scores: {
      technical:     { type: Number, min: 1, max: 5, required: true },
      problem:       { type: Number, min: 1, max: 5, required: true },
      safety:        { type: Number, min: 1, max: 5, required: true }, // safety/integrity/compliance
      communication: { type: Number, min: 1, max: 5, required: true },
      culture:       { type: Number, min: 1, max: 5, required: true }
    },

    // Computed single-evaluation score (0..100)
    evalPercent: { type: Number, required: true },

    recommendation: { type: String, enum: ['hire','no_hire','hold'], default: 'hold' },
    notes: { type: String }
  },
  { timestamps: true }
);

// One evaluation per interviewer per round
EvaluationSchema.index({ candidateId: 1, roundId: 1, interviewerId: 1 }, { unique: true });

module.exports = mongoose.model('Evaluation', EvaluationSchema);
