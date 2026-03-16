const { getChatResponse } = require("../services/aiChatService");
const User = require("../models/user");
const ResumeAnalysis = require("../models/resumeAnalysis");

/**
 * POST /api/chat
 * Expects { message: string }
 * Returns { reply: string }
 */
exports.postMessage = async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Gather user context (optional) – e.g., skills, recent resume score
    const user = await User.findById(req.user.id).select("username skills");
    const latestResume = await ResumeAnalysis.findOne({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select("atsScore matchedKeywords");

    const context = {
      username: user?.username,
      skills: user?.skills || [],
      latestAtsScore: latestResume?.atsScore,
      topSkills: latestResume?.matchedKeywords?.slice(0, 5) || [],
    };

    const reply = await getChatResponse(message, context);
    res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};