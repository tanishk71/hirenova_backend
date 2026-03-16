const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { createTest, submitTest , getInterviewHistory} = require("../controllers/interviewController");

router.post("/create", protect, createTest);
router.post("/submit", protect, submitTest);
router.get("/history", protect, getInterviewHistory);

module.exports = router;