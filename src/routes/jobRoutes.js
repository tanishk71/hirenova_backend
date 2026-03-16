const express = require('express');
const router = express.Router();
const { searchJobs } = require('../controllers/jobControllers');
const authMiddleware = require("../middleware/authMiddleware");

router.get('/search', searchJobs);

module.exports = router;
