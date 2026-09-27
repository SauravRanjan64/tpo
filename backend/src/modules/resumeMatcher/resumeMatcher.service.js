import { tokenizeText, normalizeSkill } from '../../utils/textTokenizer.js';

/**
 * Deterministic Resume Matcher
 * Matches candidate skills/resume text against required job skills
 * 
 * @param {string|string[]} resumeInput - Raw resume text or explicit candidate skills array
 * @param {string[]|string} jobSkillsInput - Array of job skills or raw job description
 * @returns {{ score: number, matchedSkills: string[], missingSkills: string[] }}
 */
export function calculateSkillMatch(resumeInput, jobSkillsInput) {
  // Normalize job skills list
  let requiredSkills = [];
  if (Array.isArray(jobSkillsInput)) {
    requiredSkills = jobSkillsInput.map(s => (typeof s === 'string' ? s.trim() : s.skill?.trim())).filter(Boolean);
  } else if (typeof jobSkillsInput === 'string') {
    requiredSkills = tokenizeText(jobSkillsInput);
  }

  if (requiredSkills.length === 0) {
    return {
      score: 0,
      matchedSkills: [],
      missingSkills: [],
    };
  }

  // Tokenize resume
  let resumeTokens = new Set();
  let candidateSkillsList = [];

  if (Array.isArray(resumeInput)) {
    candidateSkillsList = resumeInput;
    resumeInput.forEach(s => {
      resumeTokens.add(normalizeSkill(s));
      tokenizeText(s).forEach(t => resumeTokens.add(t));
    });
  } else if (typeof resumeInput === 'string') {
    const tokens = tokenizeText(resumeInput);
    tokens.forEach(t => resumeTokens.add(t));
    candidateSkillsList = tokens;
  }

  const matchedSkills = [];
  const missingSkills = [];

  for (const skill of requiredSkills) {
    const normalized = normalizeSkill(skill);
    const words = tokenizeText(skill);

    // Direct normalized match or token containment match
    const isMatched =
      resumeTokens.has(normalized) ||
      words.every(w => resumeTokens.has(w)) ||
      candidateSkillsList.some(cs => normalizeSkill(cs) === normalized || normalizeSkill(cs).includes(normalized));

    if (isMatched) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  // Calculate percentage
  const rawScore = (matchedSkills.length / requiredSkills.length) * 100;
  const score = Math.round(rawScore * 10) / 10; // Round to 1 decimal place

  return {
    score,
    matchedSkills,
    missingSkills,
  };
}

export default {
  calculateSkillMatch,
};
