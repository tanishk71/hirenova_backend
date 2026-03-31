const ResumeAnalysis = require("../models/resumeAnalysis");
const { extractTextFromFile } = require("../services/resumeExtractService");
const { scoreATS } = require("../services/atsScoreService");
const { analyzeResumeWithAI } = require("../services/aiResumeService");

// 🔹 Resume Rejection Predictor
function calculateRejectionProbability({
  atsScore,
  keywordMatchPercent,
  meta,
}) {
  // Base risk from ATS
  let risk = 100 - atsScore;

  // Keyword influence (mild modifier)
  if (keywordMatchPercent < 40) risk += 10;
  else if (keywordMatchPercent < 60) risk += 5;

  // Structural penalties
  if (!meta.hasSkillsSection) risk += 5;
  if (!meta.hasExperience) risk += 5;
  if (meta.wordCount < 120) risk += 5;

  if (risk < 0) risk = 0;
  if (risk > 100) risk = 100;

  return Math.round(risk);
}

function getIndustryBenchmark(atsScore) {
  if (atsScore >= 85) return "Top-tier (FAANG level)";
  if (atsScore >= 75) return "Strong corporate standard";
  if (atsScore >= 60) return "Industry average";
  return "Below industry benchmark";
}

function calculateRecruiterScore({ atsScore, meta }) {
  let score = atsScore;

  if (meta.wordCount > 500) score -= 5;
  if (!meta.hasLinkedIn) score -= 5;
  if (!meta.hasExperience) score -= 10;

  if (score < 0) score = 0;
  return score;
}

// POST /api/resume/analyze
const analyzeResume = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  if (!req.file)
    return res.status(400).json({ message: "Resume file is required" });

  const jobDescription = req.body?.jobDescription || "";

  try {
    console.log('File path:', req.file.path);
    const extractedText = await extractTextFromFile(
      req.file.path,
      req.file.mimetype
    );

    // 🔹 Rule-based analysis
    const ruleResult = scoreATS({
      resumeText: extractedText,
      jobDescription,
    });

    // 🔹 AI analysis (safe)
    let aiResult = {};
    try {
      aiResult = await analyzeResumeWithAI({
        resumeText: extractedText,
        jobDescription,
      });
    } catch (err) {
      console.log("AI failed → Using rule-based only");
      aiResult = {};
    }

    // 🔥 HYBRID SCORE CALCULATION
    const atsScore =
      typeof aiResult.aiScore === "number"
        ? Math.round((ruleResult.atsScore * 0.6) + (aiResult.aiScore * 0.4))
        : ruleResult.atsScore;

    const BenchmarkLevel = getIndustryBenchmark(atsScore);
    
    const recruiterScore = calculateRecruiterScore({
      atsScore,
      meta: ruleResult.meta,
    });

    // 🔥 MERGED TIPS
    const mergedTips = [
       
      ...new Set([
        ...(ruleResult.tips || []),
        ...(aiResult.improvementSuggestions || []),
        ...(aiResult.rewrittenBullets || [])

      ]),
    ];

    // 🔥 MERGED STRENGTHS
    const strengths = [
      ...(aiResult.strengths || []),
      ...(ruleResult.matchedKeywords?.slice(0, 5).map(
        (k) => `Strong keyword presence: ${k}`
      ) || []),
    ];

    // 🔥 MERGED WEAKNESSES
    const weaknesses = [
      ...(aiResult.weaknesses || []),
      ...(ruleResult.missingKeywords?.slice(0, 5).map(
        (k) => `Missing important keyword: ${k}`
      ) || []),
    ];

    // 🔹 Rejection Probability
    const rejectionProbability = calculateRejectionProbability({
      atsScore,
      keywordMatchPercent: ruleResult.keywordMatchPercent,
      missingKeywordsCount: ruleResult.missingKeywords.length,
      meta: ruleResult.meta,
    });

    const finalResult = {
      atsScore,
      keywordMatchPercent: ruleResult.keywordMatchPercent,
      matchedKeywords: ruleResult.matchedKeywords,
      missingKeywords: ruleResult.missingKeywords,
      tips: mergedTips,
      meta: ruleResult.meta,
      benchmark: BenchmarkLevel,
      recruiterScore,
      aiSummary: aiResult.summary || "",
      strengths,
      weaknesses,
      formattingIssues: aiResult.formattingIssues || [],

      rejectionProbability,
    };

    const saved = await ResumeAnalysis.create({
      user: userId,
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      },
      extractedText,
      jobDescription,
      ...finalResult,
    });

    // 🔹 Calculate percentile ranking
    const totalResumes = await ResumeAnalysis.countDocuments();
    const lowerScores = await ResumeAnalysis.countDocuments({
      atsScore: { $lt: atsScore },
    });

    const percentile =
      totalResumes > 0
        ? Math.round((lowerScores / totalResumes) * 100)
        : 0;

    return res.status(201).json({
      message: "Resume analyzed successfully",
      analysis: {
        id: saved._id,
        ...finalResult,
        percentile,
        createdAt: saved.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

// GET Resume History
const getResumeHistory = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const history = await ResumeAnalysis.find({ user: userId })
    .sort({ createdAt: -1 })
    .select("atsScore rejectionProbability createdAt");

  res.json({ history });
};



module.exports = {
  analyzeResume,
  getResumeHistory,
};