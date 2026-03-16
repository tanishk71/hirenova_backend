const { extractKeywordsFromJD, findKeywordMatches, normalizeText } = require("../utils/keywordUtils");

function detectMeta(resumeText = "") {
  const t = normalizeText(resumeText);

  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(resumeText);
  const hasPhone = /(\+?\d{1,3}[-\s]?)?(\(?\d{3}\)?[-\s]?)?\d{3}[-\s]?\d{4}/.test(resumeText);
  const hasLinkedIn = /linkedin\.com\/in\//i.test(resumeText);

  const hasEducation = /education|university|college|b\.?tech|m\.?tech|degree|bachelor|master/i.test(resumeText);
  const hasExperience = /experience|intern|employment|worked|project/i.test(resumeText);
  const hasSkillsSection = /skills|technologies|tools/i.test(resumeText);

  const wordCount = t ? t.split(" ").length : 0;

  return { wordCount, hasEmail, hasPhone, hasLinkedIn, hasEducation, hasExperience, hasSkillsSection };
}

function buildTips(meta, missingKeywordsCount) {
  const tips = [];

  if (!meta.hasEmail) tips.push("Add a professional email address in the header.");
  if (!meta.hasPhone) tips.push("Add a reachable phone number in the header.");
  if (!meta.hasLinkedIn) tips.push("Add a LinkedIn profile link (ATS + recruiter friendly).");
  if (!meta.hasSkillsSection) tips.push("Add a clear 'Skills' section with bullet keywords.");
  if (!meta.hasExperience) tips.push("Add an 'Experience' or 'Projects' section with measurable impact.");
  if (meta.wordCount < 150) tips.push("Resume seems too short — add more project/work detail.");
  if (missingKeywordsCount > 10) tips.push("Your resume is missing many job keywords — tailor skills and project bullets.");

  tips.push("Use simple headings: Summary, Skills, Experience, Education (ATS-friendly).");
  tips.push("Avoid tables/images for critical text; ATS can miss them.");
  return tips;
}

function scoreATS({ resumeText, jobDescription }) {
  const meta = detectMeta(resumeText);

  // keyword score
  const jdKeywords = extractKeywordsFromJD(jobDescription || "");
  const { matched, missing } = findKeywordMatches(resumeText, jdKeywords);

  const keywordMatchPercent = jdKeywords.length
    ? Math.round((matched.length / jdKeywords.length) * 100)
    : 0;

  // heuristic scoring out of 100
  let score = 0;

  // structure (40 pts)
  score += meta.hasEmail ? 8 : 0;
  score += meta.hasPhone ? 8 : 0;
  score += meta.hasLinkedIn ? 6 : 0;
  score += meta.hasSkillsSection ? 8 : 0;
  score += meta.hasExperience ? 6 : 0;
  score += meta.hasEducation ? 4 : 0;

  // length (10 pts)
  if (meta.wordCount >= 250) score += 10;
  else if (meta.wordCount >= 150) score += 7;
  else if (meta.wordCount >= 80) score += 4;

  // keywords (50 pts)
  score += Math.round((keywordMatchPercent / 100) * 55);

  if (score > 100) score = 100;

  const tips = buildTips(meta, missing.length);

  return {
    atsScore: score,
    keywordMatchPercent,
    matchedKeywords: matched,
    missingKeywords: missing,
    tips,
    meta,
  };
}

module.exports = { scoreATS };
