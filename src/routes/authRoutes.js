const express = require('express');
const router = express.Router();
const { registerUser,  loginUser  } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { verifyEmail , resendOtp } = require('../controllers/authController');

router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOtp);
router.post('/register', registerUser);
router.post('/login', loginUser);
// router.put('/profile', protect, updateUserProfile);

module.exports = router;
