function normalizeText(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// simple keyword extraction from JD
function extractKeywordsFromJD(jdText = "") {
  const text = normalizeText(jdText);

  // keep common tech tokens
  const keep = new Set([
    "react", "node", "express", "mongodb", "mysql", "postgres",
    "javascript", "typescript", "html", "css", "tailwind",
    "python", "java", "c++", "aws", "azure", "gcp",
    "docker", "kubernetes", "git", "github", "rest", "api",
    "jwt", "oauth", "sql", "nosql", "redux", "next", "vite",
  ]);

  const tokens = text.split(" ");
  const keywords = new Set();

  for (const t of tokens) {
    if (t.length >= 3 && (keep.has(t) || /^[a-z][a-z0-9+.-]{2,}$/.test(t))) {
      keywords.add(t);
    }
  }

  // limit to avoid noise
  return Array.from(keywords).slice(0, 60);
}

function findKeywordMatches(resumeText, jdKeywords) {
  const r = normalizeText(resumeText);
  const matched = [];
  const missing = [];

  for (const kw of jdKeywords) {
    if (r.includes(kw.toLowerCase())) matched.push(kw);
    else missing.push(kw);
  }
  return { matched, missing };
}

module.exports = { normalizeText, extractKeywordsFromJD, findKeywordMatches };
