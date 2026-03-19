const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const passport = require('./src/config/passport');

dotenv.config();
connectDB();

const app = express();

app.set('trust proxy', 1);

// Allowed frontend origins
const allowedOrigins = [
  'https://hirenova-frontend.vercel.app',
  'http://localhost:5173',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin like Postman/mobile apps
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(passport.initialize());

// Static folder
app.use('/uploads', express.static('uploads'));

// ROUTES
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/auth', require('./src/routes/oauthRoutes'));
app.use('/api/jobs', require('./src/routes/jobRoutes'));
app.use('/api/resume', require('./src/routes/resumeRoutes'));
app.use('/api/interview', require('./src/routes/interviewRoutes'));
app.use('/api/learning', require('./src/routes/learningHub'));
app.use('/api/certificates', require('./src/routes/certificates'));

const notificationRoutes = require('./src/routes/notifications');
app.use('/api/notifications', notificationRoutes.router);

app.use('/api/recommendations', require('./src/routes/recommendations'));
app.use('/api/courses', require('./src/routes/courseRoutes'));

const dashboardStatsRoutes = require('./src/routes/dashboardStats');
app.use('/api/user', dashboardStatsRoutes);

const analyticsRoutes = require('./src/routes/analyticsRoutes');
app.use('/api', analyticsRoutes);

const chatRoutes = require('./src/routes/chatRoutes');
app.use('/api/chat', chatRoutes);

// Health route
app.get('/', (req, res) => {
  res.status(200).send('HireNova API is running...');
});

// Optional backend URL check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is live',
    backend: 'https://hirenova-backend-4.onrender.com',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});