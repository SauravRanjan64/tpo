export const RULES_VERSION = 'V2';

function getAllowedBranches(job) {
  const source = Array.isArray(job?.branches) && job.branches.length
    ? job.branches
    : Array.isArray(job?.allowedBranches)
      ? job.allowedBranches
      : [];
  return source
    .map((item) => (typeof item === 'string' ? item : item?.branch))
    .filter(Boolean)
    .map((branch) => String(branch).toUpperCase());
}

function getEligibleBatches(job) {
  if (Array.isArray(job?.eligibleBatches) && job.eligibleBatches.length) {
    return job.eligibleBatches.map(Number);
  }
  if (job?.eligibleBatch == null) return [];
  return [Number(job.eligibleBatch)];
}

function isDateOnlyUtcMidnight(date) {
  return date.getUTCHours() === 0
    && date.getUTCMinutes() === 0
    && date.getUTCSeconds() === 0
    && date.getUTCMilliseconds() === 0;
}

function getApplicationCloseAt(endValue) {
  const endDate = new Date(endValue);
  if (Number.isNaN(endDate.getTime())) return endDate;
  // Date-only deadlines are stored at 00:00 UTC; keep that calendar day open.
  if (isDateOnlyUtcMidnight(endDate)) {
    return new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1);
  }
  return endDate;
}

function buildEligibilityDetails(student, job) {
  const allowedBranches = getAllowedBranches(job);
  const eligibleBatches = getEligibleBatches(job);
  const studentCgpa = Number(student.cgpa || 0);
  const minCgpa = Number(job.minCgpa || 0);
  const studentBacklogs = Number(student.activeBacklogs || 0);
  const maxBacklogs = Number(job.maxBacklogs ?? 0);
  const studentBranch = (student.branch || '').toUpperCase();
  const studentBatch = Number(student.batch);

  return {
    cgpa: {
      required: minCgpa,
      student: studentCgpa,
      pass: studentCgpa >= minCgpa,
    },
    branch: {
      allowed: allowedBranches,
      student: studentBranch,
      pass: allowedBranches.length === 0 || allowedBranches.includes(studentBranch),
    },
    backlogs: {
      maxAllowed: maxBacklogs,
      student: studentBacklogs,
      pass: studentBacklogs <= maxBacklogs,
    },
    batch: {
      required: eligibleBatches.length ? eligibleBatches.join(', ') : 'All batches',
      student: Number.isNaN(studentBatch) ? '—' : studentBatch,
      pass: eligibleBatches.length === 0 || eligibleBatches.includes(studentBatch),
    },
  };
}

/**
 * Deterministic Eligibility Engine (Rule Version V2)
 * Evaluates student metrics against job requirements
 * 
 * @param {Object} student 
 * @param {Object} job 
 * @param {Object} options - { hasApplied, hasConsent }
 * @returns {{ eligible: boolean, reasons: Array<{ rule: string, required: any, actual: any, message: string }>, details: object, checkedAt: string, rulesVersion: string }}
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
      details: null,
      checkedAt: now.toISOString(),
      rulesVersion: RULES_VERSION,
    };
  }

  const details = buildEligibilityDetails(student, job);

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
  const closeAt = getApplicationCloseAt(job.applicationEnd);

  if (now < startDate) {
    reasons.push({
      rule: 'APPLICATION_WINDOW_NOT_STARTED',
      required: startDate.toISOString(),
      actual: now.toISOString(),
      message: `Applications for this job open on ${startDate.toLocaleDateString('en-IN')}.`,
    });
  } else if (now > closeAt) {
    reasons.push({
      rule: 'APPLICATION_WINDOW_EXPIRED',
      required: closeAt.toISOString(),
      actual: now.toISOString(),
      message: `The application deadline (${closeAt.toLocaleDateString('en-IN')}) has passed.`,
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
  const allowedBranches = getAllowedBranches(job);
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

  const eligibleBatches = getEligibleBatches(job);
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
    details,
    checkedAt: now.toISOString(),
    rulesVersion: RULES_VERSION,
  };
}

/**
 * Creates an immutable eligibility snapshot to permanently store with the application
 */
export function createEligibilitySnapshot(student, job, eligibilityResult) {
  return {
    rulesVersion: RULES_VERSION,
    timestamp: eligibilityResult.checkedAt || new Date().toISOString(),
    studentCgpa: Number(student.cgpa || 0),
    requiredCgpa: Number(job.minCgpa || 0),
    studentBranch: student.branch,
    allowedBranches: getAllowedBranches(job),
    studentBacklogs: Number(student.activeBacklogs || 0),
    allowedBacklogs: Number(job.maxBacklogs ?? 0),
    batch: student.batch,
    eligibleBatches: getEligibleBatches(job),
    eligible: eligibilityResult.eligible,
    reasons: eligibilityResult.reasons,
  };
}

export default {
  RULES_VERSION,
  evaluateEligibility,
  createEligibilitySnapshot,
};
