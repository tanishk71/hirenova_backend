const express = require('express');
const router = express.Router();
const passport = require('../config/passport');

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed` }),
  (req, res) => {
    // Successful authentication, redirect to frontend with token
    const user = req.user;
    const token = user.token;
    // Remove token from user object (optional)
    delete user.token;

    const redirectUrl = `${process.env.FRONTEND_URL}/oauth-redirect?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`;
    console.log('Google OAuth redirecting to:', redirectUrl); // Debug log
    res.redirect(redirectUrl);
  }
);

// Initiate GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

// GitHub OAuth callback
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed` }),
  (req, res) => {
    const user = req.user;
    const token = user.token;
    delete user.token;

    const redirectUrl = `${process.env.FRONTEND_URL}/oauth-redirect?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`;
    console.log('GitHub OAuth redirecting to:', redirectUrl); // Debug log
    res.redirect(redirectUrl);
  }
);

module.exports = router;