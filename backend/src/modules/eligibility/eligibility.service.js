export const RULES_VERSION = 'V2';

/**
 * Deterministic Eligibility Engine (Rule Version V2)
 * Evaluates student metrics against job requirements
 * 
 * @param {Object} student 
 * @param {Object} job 
 * @param {Object} options - { hasApplied, hasConsent }
 * @returns {{ eligible: boolean, reasons: Array<{ rule: string, required: any, actual: any, message: string }>, checkedAt: string, rulesVersion: string }}
 */
export function evaluateEligibility(student, job, options = {}) {
  const { hasApplied = false, hasConsent = true } = options;
  const reasons = [];
  const now = new Date();

  // 1. Check Job Existence & Status
  if (!job) {
    return {
      eligible: false,
      reasons: [{
        rule: 'JOB_EXISTENCE',
        required: 'Existing job drive',
        actual: 'Job not found',
        message: 'The requested job drive does not exist.',
      }],
      checkedAt: now.toISOString(),
      rulesVersion: RULES_VERSION,
    };
  }

  if (job.status !== 'ACTIVE') {
    reasons.push({
      rule: 'JOB_STATUS',
      required: 'ACTIVE',
      actual: job.status,
      message: `This placement drive is currently ${job.status.toLowerCase()} and not accepting applications.`,
    });
  }

  // 2. Check Application Window
  const startDate = new Date(job.applicationStart);
  const endDate = new Date(job.applicationEnd);

  if (now < startDate) {
    reasons.push({
      rule: 'APPLICATION_WINDOW_NOT_STARTED',
      required: startDate.toISOString(),
      actual: now.toISOString(),
      message: `Applications for this job open on ${startDate.toLocaleDateString()}.`,
    });
  } else if (now > endDate) {
    reasons.push({
      rule: 'APPLICATION_WINDOW_EXPIRED',
      required: endDate.toISOString(),
      actual: now.toISOString(),
      message: `The application deadline (${endDate.toLocaleDateString()}) has passed.`,
    });
  }

  // 3. Check Duplicate Application
  if (hasApplied) {
    reasons.push({
      rule: 'DUPLICATE_APPLICATION',
      required: 'No previous application',
      actual: 'Application exists',
      message: 'You have already submitted an application for this placement drive.',
    });
  }

  // 4. Check Consent
  if (!hasConsent) {
    reasons.push({
      rule: 'CONSENT_REQUIRED',
      required: true,
      actual: false,
      message: 'You must accept the campus placement policy and data consent terms before applying.',
    });
  }

  // 5. Check Student Profile Complete
  if (!student.profileComplete) {
    reasons.push({
      rule: 'PROFILE_COMPLETION',
      required: true,
      actual: false,
      message: 'Please complete your academic and personal profile before applying.',
    });
  }

  // 6. Check CGPA
  const studentCgpa = Number(student.cgpa || 0);
  const minCgpa = Number(job.minCgpa || 0);
  if (studentCgpa < minCgpa) {
    reasons.push({
      rule: 'CGPA',
      required: minCgpa,
      actual: studentCgpa,
      message: `Minimum CGPA required is ${minCgpa}. Your current CGPA is ${studentCgpa}.`,
    });
  }

  // 7. Check Allowed Branches
  const allowedBranches = Array.isArray(job.branches)
    ? job.branches.map(b => (typeof b === 'string' ? b.toUpperCase() : b.branch?.toUpperCase()))
    : [];

  const studentBranch = (student.branch || '').toUpperCase();
  if (allowedBranches.length > 0 && !allowedBranches.includes(studentBranch)) {
    reasons.push({
      rule: 'BRANCH',
      required: allowedBranches,
      actual: studentBranch,
      message: `Allowed branches are ${allowedBranches.join(', ')}. Your branch is ${studentBranch}.`,
    });
  }

  // 8. Check Active Backlogs
  const studentBacklogs = Number(student.activeBacklogs || 0);
  const maxBacklogs = Number(job.maxBacklogs ?? 0);
  if (studentBacklogs > maxBacklogs) {
    reasons.push({
      rule: 'BACKLOGS',
      required: maxBacklogs,
      actual: studentBacklogs,
      message: `Maximum allowed active backlogs is ${maxBacklogs}. You currently have ${studentBacklogs} active backlog(s).`,
    });
  }

  const eligibleBatches = Array.isArray(job.eligibleBatches)
    ? job.eligibleBatches.map(Number)
    : job.eligibleBatch == null ? [] : [Number(job.eligibleBatch)];
  const studentBatch = Number(student.batch);
  if (eligibleBatches.length > 0 && !eligibleBatches.includes(studentBatch)) {
    reasons.push({
      rule: 'BATCH',
      required: eligibleBatches,
      actual: studentBatch,
      message: `Eligible batches are ${eligibleBatches.join(', ')}. Your batch is ${studentBatch}.`,
    });
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    checkedAt: now.toISOString(),
    rulesVersion: RULES_VERSION,
  };
}

/**
 * Creates an immutable eligibility snapshot to permanently store with the application
 */
export function createEligibilitySnapshot(student, job, eligibilityResult) {
  const allowedBranches = Array.isArray(job.branches)
    ? job.branches.map(b => (typeof b === 'string' ? b : b.branch))
    : [];

  return {
    rulesVersion: RULES_VERSION,
    timestamp: eligibilityResult.checkedAt || new Date().toISOString(),
    studentCgpa: Number(student.cgpa || 0),
    requiredCgpa: Number(job.minCgpa || 0),
    studentBranch: student.branch,
    allowedBranches,
    studentBacklogs: Number(student.activeBacklogs || 0),
    allowedBacklogs: Number(job.maxBacklogs ?? 0),
    batch: student.batch,
    eligibleBatches: Array.isArray(job.eligibleBatches)
      ? job.eligibleBatches
      : job.eligibleBatch == null ? [] : [Number(job.eligibleBatch)],
    eligible: eligibilityResult.eligible,
    reasons: eligibilityResult.reasons,
  };
}

export default {
  RULES_VERSION,
  evaluateEligibility,
  createEligibilitySnapshot,
};
