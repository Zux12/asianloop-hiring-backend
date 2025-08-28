// Weights per family (sum to 1.0)
const WEIGHTS = {
  engineering_projects: { technical: 0.40, problem: 0.25, safety: 0.15, communication: 0.10, culture: 0.10 },
  qaqc_metrology:       { technical: 0.35, problem: 0.20, safety: 0.10, communication: 0.10, culture: 0.10 }, // 'technical' ≈ standards/compliance
  operations_planning:  { technical: 0.30, problem: 0.25, safety: 0.20, communication: 0.10, culture: 0.15 },
  safety_security:      { technical: 0.40, problem: 0.25, safety: 0.15, communication: 0.10, culture: 0.10 }, // 'technical' ≈ HSE regs
  data_analytics:       { technical: 0.40, problem: 0.30, safety: 0.10, communication: 0.15, culture: 0.05 }, // 'safety' ≈ integrity/confidentiality
  proc_fin_hr_admin:    { technical: 0.35, problem: 0.10, safety: 0.20, communication: 0.25, culture: 0.10 }, // 'technical' ≈ process accuracy
  sales_bd:             { technical: 0.25, problem: 0.10, safety: 0.10, communication: 0.20, culture: 0.10 }  // 'technical' ≈ market/product knowledge
};

// Thresholds for final recommendation
const THRESHOLDS = {
  engineering_projects: { hire: 70, considerMin: 60 },
  qaqc_metrology:       { hire: 75, considerMin: 65 },
  operations_planning:  { hire: 70, considerMin: 60 },
  safety_security:      { hire: 75, considerMin: 65 },
  data_analytics:       { hire: 70, considerMin: 60 },
  proc_fin_hr_admin:    { hire: 70, considerMin: 60 },
  sales_bd:             { hire: 70, considerMin: 60 }
};

// Red-flag rules by family
function redFlagForFamily(family, scores) {
  // universal: safety<=2 is a red flag
  if (scores.safety <= 2) return { redFlag: true, reason: 'Safety/Integrity ≤ 2' };

  // family-specific mappings using 'technical' proxy where needed
  if (family === 'qaqc_metrology' && scores.technical <= 2) {
    return { redFlag: true, reason: 'Standards/Compliance (technical) ≤ 2' };
  }
  if (family === 'safety_security' && scores.technical <= 2) {
    return { redFlag: true, reason: 'HSE/Regulatory knowledge (technical) ≤ 2' };
  }
  // For others, no extra checks
  return { redFlag: false };
}

function computeEvalPercent(family, scores) {
  const w = WEIGHTS[family] || WEIGHTS.engineering_projects;
  // normalize 1..5 → 0..1 and weight
  const to01 = s => Math.max(1, Math.min(5, s)) / 5;
  const pct =
    100 * (
      (to01(scores.technical)     * (w.technical     ?? 0)) +
      (to01(scores.problem)       * (w.problem       ?? 0)) +
      (to01(scores.safety)        * (w.safety        ?? 0)) +
      (to01(scores.communication) * (w.communication ?? 0)) +
      (to01(scores.culture)       * (w.culture       ?? 0))
    );
  return Math.round(pct); // whole percent
}

function decideRecommendation(family, percent, redFlag) {
  if (redFlag?.redFlag) return { recommendation: 'no_hire', reason: redFlag.reason };

  const t = THRESHOLDS[family] || THRESHOLDS.engineering_projects;
  if (percent >= t.hire) return { recommendation: 'hire' };
  if (percent >= t.considerMin) return { recommendation: 'hold' };
  return { recommendation: 'no_hire' };
}

module.exports = {
  WEIGHTS, THRESHOLDS,
  redFlagForFamily,
  computeEvalPercent,
  decideRecommendation
};
