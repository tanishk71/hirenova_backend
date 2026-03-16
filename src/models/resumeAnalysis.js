const mongoose = require("mongoose");

const resumeAnalysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    file: {
      originalName: String,
      filename: String,
      mimeType: String,
      size: Number,
      path: String,
    },

    extractedText: { type: String, default: "" },

    jobDescription: { type: String, default: "" },
    rejectionProbability: { type: Number, default: 0 },
    aiSummary: String,
    strengths: [String],
    weaknesses: [String],
    formattingIssues: [String],
    atsScore: { type: Number, default: 0 }, // 0-100
    keywordMatchPercent: { type: Number, default: 0 }, // 0-100

    matchedKeywords: [{ type: String }],
    missingKeywords: [{ type: String }],
    tips: [{ type: String }],

    meta: {
      wordCount: Number,
      hasEmail: Boolean,
      hasPhone: Boolean,
      hasLinkedIn: Boolean,
      hasEducation: Boolean,
      hasExperience: Boolean,
      hasSkillsSection: Boolean,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.ResumeAnalysis || mongoose.model('ResumeAnalysis', resumeAnalysisSchema);