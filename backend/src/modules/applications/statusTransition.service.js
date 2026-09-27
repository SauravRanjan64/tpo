export const APPLICATION_STATUS = {
  APPLIED: 'APPLIED',
  SHORTLISTED: 'SHORTLISTED',
  REJECTED: 'REJECTED',
  SELECTED: 'SELECTED',
};

export const ALLOWED_TRANSITIONS = {
  [APPLICATION_STATUS.APPLIED]: [
    APPLICATION_STATUS.SHORTLISTED,
    APPLICATION_STATUS.REJECTED,
  ],
  [APPLICATION_STATUS.SHORTLISTED]: [
    APPLICATION_STATUS.SELECTED,
    APPLICATION_STATUS.REJECTED,
  ],
  [APPLICATION_STATUS.REJECTED]: [],
  [APPLICATION_STATUS.SELECTED]: [],
};

/**
 * Validates whether transitioning from currentStatus to requestedStatus is permitted
 * @param {string} currentStatus 
 * @param {string} requestedStatus 
 * @param {string} userRole 
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateStatusTransition(currentStatus, requestedStatus, userRole = 'COMPANY') {
  if (!Object.values(APPLICATION_STATUS).includes(requestedStatus)) {
    return {
      valid: false,
      message: `Invalid application status '${requestedStatus}'. Allowed statuses: ${Object.values(APPLICATION_STATUS).join(', ')}.`,
    };
  }

  if (requestedStatus === APPLICATION_STATUS.SELECTED && userRole !== 'ADMIN') {
    return {
      valid: false,
      message: 'Cannot transition application status to SELECTED: only the T&P Cell can select applicants.',
    };
  }

  if (userRole === 'STUDENT') {
    return {
      valid: false,
      message: 'Students cannot change an application status.',
    };
  }

  // Company / Admin transitions
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(requestedStatus)) {
    return {
      valid: false,
      message: `Cannot transition application status from '${currentStatus}' to '${requestedStatus}'. Permitted transitions: [${allowed.join(', ') || 'None (Terminal state)'}].`,
    };
  }

  return { valid: true };
}

export default {
  APPLICATION_STATUS,
  ALLOWED_TRANSITIONS,
  validateStatusTransition,
};
