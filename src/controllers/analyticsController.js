const ResumeAnalysis = require('../models/resumeAnalysis');
const InterviewTest = require('../models/InterviewTest');
const UserProgress = require('../models/UserProgress');

// GET /api/interview/results
exports.getInterviewResults = async (req, res) => {
  try {
    const userId = req.user.id;
    const interviews = await InterviewTest.find({ user: userId })
      .sort({ createdAt: -1 })
      .select('score totalQuestions createdAt');
    
    // Format for charts: { date: '2024-03-15', percentage: 85 }
    const results = interviews.map(test => ({
      date: test.createdAt.toISOString().split('T')[0],
      percentage: Math.round((test.score / test.totalQuestions) * 100)
    }));
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/learning/stats
exports.getLearningStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const progress = await UserProgress.find({ user: userId })
      .populate('course', 'title');
    
    const completed = progress.filter(p => p.status === 'Completed').length;
    const total = progress.length;
    const courses = progress.map(p => ({
      title: p.course?.title || 'Untitled',
      progress: p.progress
    }));
    
    res.json({ completed, total, courses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/user/recent-activity
exports.getRecentActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const activities = [];

    // Get recent resume analyses
    const resumes = await ResumeAnalysis.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(3);
    resumes.forEach(r => activities.push({
      description: `Resume analyzed: ${r.file?.originalName || 'Resume'}`,
      date: r.createdAt.toISOString().split('T')[0]
    }));

    // Get recent interview tests
    const interviews = await InterviewTest.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(3);
    interviews.forEach(i => activities.push({
      description: `Interview test: ${i.role || 'General'}`,
      date: i.createdAt.toISOString().split('T')[0]
    }));

    // Get recent learning progress
    const learning = await UserProgress.find({ user: userId })
      .populate('course')
      .sort({ lastAccessed: -1 })
      .limit(3);
    learning.forEach(l => activities.push({
      description: `Course progress: ${l.course?.title || 'Untitled'} - ${Math.round(l.progress)}%`,
      date: l.lastAccessed?.toISOString().split('T')[0] || ''
    }));

    // Sort by date (newest first) and take top 5
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(activities.slice(0, 5));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/job-tracker/analytics (mock or disabled)
exports.getJobAnalytics = async (req, res) => {
  // Since Job Tracker is removed, return empty stats
  res.json({ applied: 0, interviews: 0, offers: 0 });
};