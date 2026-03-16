// routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const { searchCourses } = require('../controllers/courseControllers');
const { protect } = require('../middleware/authMiddleware'); // optional – protect if needed

// Public search endpoint (or protected if you prefer)
router.get('/search', searchCourses);

module.exports = router;