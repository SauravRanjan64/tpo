import { evaluateEligibility, createEligibilitySnapshot, RULES_VERSION } from '../../src/modules/eligibility/eligibility.service.js';

describe('Eligibility Engine Unit Tests (Rules Version V2)', () => {
  const baseJob = {
    id: 'job-test-1',
    title: 'Software Development Engineer',
    minCgpa: 7.0,
    maxBacklogs: 0,
    branches: [{ branch: 'CSE' }, { branch: 'ECE' }, { branch: 'IT' }],
    status: 'ACTIVE',
    applicationStart: new Date(Date.now() - 86400000).toISOString(),
    applicationEnd: new Date(Date.now() + 86400000).toISOString(),
  };

  const baseStudent = {
    id: 'std-test-1',
    fullName: 'Test Candidate',
    branch: 'CSE',
    cgpa: 8.0,
    activeBacklogs: 0,
    batch: 2025,
    profileComplete: true,
  };

  test('Critical Case: Student with CGPA 8.0 and requirement 7.0 is Eligible', () => {
    const result = evaluateEligibility(baseStudent, baseJob, { hasApplied: false, hasConsent: true });
    expect(result.eligible).toBe(true);
    expect(result.reasons).toHaveLength(0);
    expect(result.rulesVersion).toBe(RULES_VERSION);
  });

  test('Critical Case: Student with CGPA 6.5 and requirement 7.0 is Ineligible with exact reason', () => {
    const student = { ...baseStudent, cgpa: 6.5 };
    const result = evaluateEligibility(student, baseJob, { hasApplied: false, hasConsent: true });
    expect(result.eligible).toBe(false);
    const cgpaReason = result.reasons.find(r => r.rule === 'CGPA');
    expect(cgpaReason).toBeDefined();
    expect(cgpaReason.required).toBe(7.0);
    expect(cgpaReason.actual).toBe(6.5);
    expect(cgpaReason.message).toContain('Minimum CGPA required is 7');
  });

  test('Critical Case: Wrong branch is Ineligible with allowed branches listed', () => {
    const student = { ...baseStudent, branch: 'MECHANICAL' };
    const result = evaluateEligibility(student, baseJob, { hasApplied: false, hasConsent: true });
    expect(result.eligible).toBe(false);
    const branchReason = result.reasons.find(r => r.rule === 'BRANCH');
    expect(branchReason).toBeDefined();
    expect(branchReason.actual).toBe('MECHANICAL');
    expect(branchReason.required).toEqual(['CSE', 'ECE', 'IT']);
  });

  test('Critical Case: Too many active backlogs is Ineligible with exact reason', () => {
    const student = { ...baseStudent, activeBacklogs: 2 };
    const result = evaluateEligibility(student, baseJob, { hasApplied: false, hasConsent: true });
    expect(result.eligible).toBe(false);
    const backlogReason = result.reasons.find(r => r.rule === 'BACKLOGS');
    expect(backlogReason).toBeDefined();
    expect(backlogReason.required).toBe(0);
    expect(backlogReason.actual).toBe(2);
  });

  test('Critical Case: Duplicate application is rejected by eligibility engine', () => {
    const result = evaluateEligibility(baseStudent, baseJob, { hasApplied: true, hasConsent: true });
    expect(result.eligible).toBe(false);
    expect(result.reasons.some(r => r.rule === 'DUPLICATE_APPLICATION')).toBe(true);
  });

  test('Critical Case: Closed job drive is rejected by eligibility engine', () => {
    const closedJob = { ...baseJob, status: 'CLOSED' };
    const result = evaluateEligibility(baseStudent, closedJob, { hasApplied: false, hasConsent: true });
    expect(result.eligible).toBe(false);
    expect(result.reasons.some(r => r.rule === 'JOB_STATUS')).toBe(true);
  });

  test('Critical Case: Expired application deadline is rejected', () => {
    const expiredJob = {
      ...baseJob,
      applicationStart: new Date(Date.now() - 172800000).toISOString(),
      applicationEnd: new Date(Date.now() - 86400000).toISOString(),
    };
    const result = evaluateEligibility(baseStudent, expiredJob, { hasApplied: false, hasConsent: true });
    expect(result.eligible).toBe(false);
    expect(result.reasons.some(r => r.rule === 'APPLICATION_WINDOW_EXPIRED')).toBe(true);
  });

  test('Critical Case: Missing consent is rejected', () => {
    const result = evaluateEligibility(baseStudent, baseJob, { hasApplied: false, hasConsent: false });
    expect(result.eligible).toBe(false);
    expect(result.reasons.some(r => r.rule === 'CONSENT_REQUIRED')).toBe(true);
  });

  test('Critical Case: Incomplete profile is rejected', () => {
    const student = { ...baseStudent, profileComplete: false };
    const result = evaluateEligibility(student, baseJob, { hasApplied: false, hasConsent: true });
    expect(result.eligible).toBe(false);
    expect(result.reasons.some(r => r.rule === 'PROFILE_COMPLETION')).toBe(true);
  });

  test('Eligibility Snapshot contains historical rules version and metrics', () => {
    const result = evaluateEligibility(baseStudent, baseJob, { hasApplied: false, hasConsent: true });
    const snapshot = createEligibilitySnapshot(baseStudent, baseJob, result);
    expect(snapshot.rulesVersion).toBe('V2');
    expect(snapshot.studentCgpa).toBe(8.0);
    expect(snapshot.requiredCgpa).toBe(7.0);
    expect(snapshot.studentBranch).toBe('CSE');
    expect(snapshot.allowedBranches).toEqual(['CSE', 'ECE', 'IT']);
    expect(snapshot.eligible).toBe(true);
  });

  test('Eligibility result includes criterion details for the student UI', () => {
    const result = evaluateEligibility(baseStudent, baseJob, { hasApplied: false, hasConsent: true });
    expect(result.details.cgpa).toEqual({ required: 7, student: 8, pass: true });
    expect(result.details.branch.allowed).toEqual(['CSE', 'ECE', 'IT']);
    expect(result.details.branch.pass).toBe(true);
    expect(result.details.backlogs.pass).toBe(true);
  });
});
