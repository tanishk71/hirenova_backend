const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // ✅ Add this line
const { searchGoogleJobs } = require('../services/serpApiService');

// Get job recommendations based on user's search history
router.get('/jobs', protect, async (req, res) => {
  try {
    // You can later enhance this to use actual user search history
    // For now, use a default query
    const defaultQueries = ['software engineer', 'python developer'];
    const query = defaultQueries[0]; // or use a rotating default
    
    const jobs = await searchGoogleJobs(query, 'India', 5);
    res.json(jobs);
  } catch (error) {
    console.error('Failed to fetch job recommendations:', error);
    res.status(500).json({ message: 'Failed to fetch recommendations' });
  }
});

module.exports = router;