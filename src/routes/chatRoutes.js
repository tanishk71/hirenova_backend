const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { postMessage } = require("../controllers/chatController");

// All chat routes are protected
router.post("/", protect, postMessage);

module.exports = router;