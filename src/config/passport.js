const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Serialize user (just store user ID in session if using sessions, but we'll use JWT)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ email: profile.emails[0].value });
      if (!user) {
        // Create new user
        user = new User({
          username: profile.displayName,
          email: profile.emails[0].value,
          password: '', // no password for OAuth users
          isVerified: true, // OAuth emails are verified
        });
        await user.save();
      }
      // Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      // Attach token to user object for the callback
      user.token = token;
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/github/callback`, // ✅ updated
    scope: ['user:email'] // request email access
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // GitHub may not return email; we need to fetch it separately
      let email = null;
      if (profile.emails && profile.emails.length > 0) {
        email = profile.emails[0].value;
      } else {
        // If no email, we might need to handle differently; for now, use a placeholder
        email = `${profile.username}@github.com`;
      }
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          username: profile.displayName || profile.username,
          email: email,
          password: '',
          isVerified: true,
        });
        await user.save();
      }
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      user.token = token;
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

module.exports = passport;