const mongoose = require('mongoose');

const RoundSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    roundName: { type: String, required: true }, // e.g., "Technical Interview 1"
    scheduledAt: { type: Date },                 // optional
    durationMins: { type: Number, default: 60 }, // optional
    locationOrLink: { type: String },            // optional (Teams/Zoom link or room)

    interviewerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    stage: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Round', RoundSchema);
