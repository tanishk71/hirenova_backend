const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getInterviewResults,
  getLearningStats,
  getRecentActivity,
  getJobAnalytics
} = require('../controllers/analyticsController');

router.get('/interview/results', protect, getInterviewResults);
router.get('/learning/stats', protect, getLearningStats);
router.get('/user/recent-activity', protect, getRecentActivity);
router.get('/job-tracker/analytics', protect, getJobAnalytics);

module.exports = router;