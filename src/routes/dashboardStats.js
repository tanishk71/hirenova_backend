const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getKPIs,
  getWeeklyActivity,
  getSkillImprovement,
} = require('../controllers/dashboardStatsController');

router.get('/dashboard-stats', protect, getKPIs);
router.get('/weekly-activity', protect, getWeeklyActivity);
router.get('/skill-improvement', protect, getSkillImprovement);

module.exports = router;