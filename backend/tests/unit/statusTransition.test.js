import { validateStatusTransition, APPLICATION_STATUS } from '../../src/modules/applications/statusTransition.service.js';

describe('Application Status Transition State Machine Tests', () => {
  test('Allowed transition: APPLIED -> SHORTLISTED is valid for COMPANY', () => {
    const res = validateStatusTransition(APPLICATION_STATUS.APPLIED, APPLICATION_STATUS.SHORTLISTED, 'COMPANY');
    expect(res.valid).toBe(true);
  });

  test('Allowed transition: APPLIED -> REJECTED is valid for COMPANY', () => {
    const res = validateStatusTransition(APPLICATION_STATUS.APPLIED, APPLICATION_STATUS.REJECTED, 'COMPANY');
    expect(res.valid).toBe(true);
  });

  test('Only ADMIN can transition SHORTLISTED -> SELECTED', () => {
    const res = validateStatusTransition(APPLICATION_STATUS.SHORTLISTED, APPLICATION_STATUS.SELECTED, 'COMPANY');
    expect(res.valid).toBe(false);
    const adminRes = validateStatusTransition(APPLICATION_STATUS.SHORTLISTED, APPLICATION_STATUS.SELECTED, 'ADMIN');
    expect(adminRes.valid).toBe(true);
  });

  test('Allowed transition: SHORTLISTED -> REJECTED is valid for COMPANY', () => {
    const res = validateStatusTransition(APPLICATION_STATUS.SHORTLISTED, APPLICATION_STATUS.REJECTED, 'COMPANY');
    expect(res.valid).toBe(true);
  });

  test('Students cannot change an application status', () => {
    const res = validateStatusTransition(APPLICATION_STATUS.APPLIED, APPLICATION_STATUS.REJECTED, 'STUDENT');
    expect(res.valid).toBe(false);
  });

  test('Disallowed transition: REJECTED -> SELECTED is rejected', () => {
    const res = validateStatusTransition(APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.SELECTED, 'COMPANY');
    expect(res.valid).toBe(false);
    expect(res.message).toContain('Cannot transition application status');
  });

  test('Disallowed transition: SELECTED -> APPLIED is rejected', () => {
    const res = validateStatusTransition(APPLICATION_STATUS.SELECTED, APPLICATION_STATUS.APPLIED, 'COMPANY');
    expect(res.valid).toBe(false);
  });

  test('Disallowed transition: Arbitrary status string is rejected', () => {
    const res = validateStatusTransition(APPLICATION_STATUS.APPLIED, 'INTERVIEWED', 'COMPANY');
    expect(res.valid).toBe(false);
    expect(res.message).toContain('Invalid application status');
  });
});
