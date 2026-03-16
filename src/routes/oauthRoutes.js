const express = require('express');
const router = express.Router();
const passport = require('../config/passport');

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:5173/login?error=auth_failed' }),
  (req, res) => {
    // Successful authentication, redirect to frontend with token
    const user = req.user;
    const token = user.token;
    // Remove token from user object (optional)
    delete user.token;
    res.redirect(`http://localhost:5173/oauth-redirect?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  }
);

// Initiate GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

// GitHub OAuth callback
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: 'http://localhost:5173/login?error=auth_failed' }),
  (req, res) => {
    const user = req.user;
    const token = user.token;
    delete user.token;
    res.redirect(`http://localhost:5173/oauth-redirect?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  }
);

module.exports = router;