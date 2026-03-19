const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const passport = require('./src/config/passport'); // import passport early

dotenv.config();
console.log('FRONTEND_URL is:', process.env.FRONTEND_URL);
connectDB();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());

// Initialize Passport BEFORE routes that use it
app.use(passport.initialize());

// ROUTES
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/jobs', require('./src/routes/jobRoutes'));
app.use('/api/resume', require('./src/routes/resumeRoutes'));
app.use('/uploads', express.static('uploads'));
app.use("/api/interview", require("./src/routes/interviewRoutes"));
app.use('/api/learning', require('./src/routes/learningHub'));
app.use('/api/certificates', require('./src/routes/certificates'));
const notificationRoutes = require('./src/routes/notifications');
app.use('/api/notifications', notificationRoutes.router);  
app.use('/api/recommendations', require('./src/routes/recommendations'));
app.use('/api/courses', require('./src/routes/courseRoutes'));
const dashboardStatsRoutes = require('./src/routes/dashboardStats');
app.use('/api/user', dashboardStatsRoutes);
const oauthRoutes = require('./src/routes/oauthRoutes');
app.use('/api/auth', oauthRoutes); // now after passport initialization
const analyticsRoutes = require('./src/routes/analyticsRoutes');
app.use('/api', analyticsRoutes);
const chatRoutes = require("./src/routes/chatRoutes");
app.use("/api/chat", chatRoutes);

app.get('/', (req, res) => {
    res.send('HireNova API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
);