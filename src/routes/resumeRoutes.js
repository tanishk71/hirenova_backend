const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");
const { analyzeResume , getResumeHistory } = require("../controllers/resumeController");

router.post("/analyze", protect, upload.single("resume"), analyzeResume);
// router.get("/latest", protect, getLatestResumeAnalysis);
router.get("/history", protect, getResumeHistory);

module.exports = router;
