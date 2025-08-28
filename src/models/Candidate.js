const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    phone: { type: String },

    // Which job family they applied for (keeps app simple & efficient)
    appliedFamily: {
      type: String,
      enum: [
        'engineering_projects',
        'qaqc_metrology',
        'operations_planning',
        'safety_security',
        'data_analytics',
        'proc_fin_hr_admin',
        'sales_bd'
      ],
      required: true
    },

    status: {
      type: String,
      enum: [
        'applied',
        'shortlisted',
        'interviewing',
        'offer',
        'rejected',
        'on_hold',
        'talent_pool'
      ],
      default: 'applied',
      index: true
    },

    yearsExp: { type: Number, default: 0 },

    skills: { type: [String], default: [] },   // free-form tags (e.g. "Coriolis","ISO5167")
    tags:   { type: [String], default: [] },   // admin labels (e.g. "Terengganu","Immediate")

    notes: [
      {
        byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        at: { type: Date, default: Date.now }
      }
    ],

    cv: {
      url: String,        // file link (S3/GridFS later)
      filename: String,
      size: Number        // in bytes
    }
  },
  { timestamps: true }
);

// Helpful compound index for quick de-dup checks
CandidateSchema.index({ email: 1, appliedFamily: 1 });

module.exports = mongoose.model('Candidate', CandidateSchema);
