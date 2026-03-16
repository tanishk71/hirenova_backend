const ResumeAnalysis = require('../models/resumeAnalysis');
const InterviewTest = require('../models/InterviewTest');
const UserProgress = require('../models/UserProgress');
const User = require('../models/user');

/**
 * Get KPI data for dashboard
 * Returns: jobReadiness, atsScore, interviewReadiness, skillGap
 */
exports.getKPIs = async (req, res) => {
  try {
    const userId = req.user.id;

    const latestResume = await ResumeAnalysis.findOne({ user: userId }).sort({ createdAt: -1 });
    const latestInterview = await InterviewTest.findOne({ user: userId }).sort({ createdAt: -1 });

    const atsScore = latestResume?.atsScore || 0;
    let interviewReadiness = 0;
    if (latestInterview && latestInterview.score !== undefined && latestInterview.totalQuestions) {
      interviewReadiness = Math.round((latestInterview.score / latestInterview.totalQuestions) * 100);
    }
    const jobReadiness = Math.round((atsScore + interviewReadiness) / 2);

    let completedSkills = 0;
    if (latestResume && latestResume.matchedKeywords) {
      completedSkills = Math.min(latestResume.matchedKeywords.length, 10);
    }
    const skillGap = { total: 10, completed: completedSkills };

    res.json({ jobReadiness, atsScore, interviewReadiness, skillGap });
  } catch (error) {
    console.error('Error in getKPIs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get weekly activity counts for the last 7 days
 * Returns array of percentages (max 100) for each day
 */
exports.getWeeklyActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { range } = req.query; // 'week', 'month', 'year' – for now only week is fully supported

    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push(d);
    }

    const activity = await Promise.all(days.map(async (start) => {
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const counts = await Promise.all([
        ResumeAnalysis.countDocuments({ user: userId, createdAt: { $gte: start, $lt: end } }),
        InterviewTest.countDocuments({ user: userId, createdAt: { $gte: start, $lt: end } }),
        UserProgress.countDocuments({ user: userId, lastAccessed: { $gte: start, $lt: end } }),
      ]);

      return counts.reduce((a, b) => a + b, 0);
    }));

    const maxActivity = Math.max(...activity, 1);
    const percentages = activity.map(val => Math.round((val / maxActivity) * 100));

    res.json(percentages);
  } catch (error) {
    console.error('Error in getWeeklyActivity:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get skill improvement percentages
 * Returns array of objects { name, percentage }
 */
exports.getSkillImprovement = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch last 5 resume analyses to see progress
    const analyses = await ResumeAnalysis.find({ user: userId }).sort({ createdAt: -1 }).limit(5);
    // Fetch last 5 interview tests
    const interviews = await InterviewTest.find({ user: userId }).sort({ createdAt: -1 }).limit(5);

    // Base percentages
    let technical = 70, communication = 60, resumeOpt = 80;

    if (analyses.length > 1) {
      const first = analyses[analyses.length - 1];
      const last = analyses[0];
      const improvement = (last.atsScore - first.atsScore) || 0;
      technical = Math.min(100, 70 + improvement);
      resumeOpt = Math.min(100, 80 + improvement);
    } else if (analyses.length === 1) {
      technical = analyses[0].atsScore || 70;
      resumeOpt = analyses[0].atsScore || 80;
    }

    if (interviews.length > 1) {
      const first = interviews[interviews.length - 1];
      const last = interviews[0];
      const firstPercent = Math.round((first.score / first.totalQuestions) * 100) || 0;
      const lastPercent = Math.round((last.score / last.totalQuestions) * 100) || 0;
      const improvement = lastPercent - firstPercent;
      communication = Math.min(100, 60 + improvement);
    } else if (interviews.length === 1) {
      communication = Math.round((interviews[0].score / interviews[0].totalQuestions) * 100) || 60;
    }

    const result = [
      { name: 'Technical Skills', percentage: technical },
      { name: 'Communication', percentage: communication },
      { name: 'Resume Optimization', percentage: resumeOpt },
    ];

    res.json(result);
  } catch (error) {
    console.error('Error in getSkillImprovement:', error);
    res.status(500).json({ message: 'Server error' });
  }
};