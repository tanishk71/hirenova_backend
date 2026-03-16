const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const UserProgress = require('../models/UserProgress');
const Certificate = require('../models/Certificate');
const { createNotification } = require('./notifications'); // Import notification helper
const { protect } = require('../middleware/authMiddleware');
const crypto = require('crypto');

// Get all courses with filters
// ... (previous code)

// Get all courses with filters
router.get('/courses', protect, async (req, res) => {
  try {
    const { category, level, search, page = 1, limit = 10 } = req.query;
    
    const query = { isPublished: true };
    if (category && category !== 'all') query.category = category;
    if (level && level !== 'all') query.level = level;

    // Enhanced search: split into words and use $or for flexibility
    if (search) {
      const words = search.split(/\s+/).filter(w => w.length > 1);
      if (words.length === 1) {
        // Single word: search as a substring
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      } else {
        // Multiple words: match any word (OR)
        query.$or = words.map(word => ({
          $or: [
            { title: { $regex: word, $options: 'i' } },
            { description: { $regex: word, $options: 'i' } },
            { tags: { $in: [new RegExp(word, 'i')] } }
          ]
        }));
      }
    }

    const courses = await Course.find(query)
      .sort('-enrolledCount')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Course.countDocuments(query);

    // Get user progress for these courses
    const progress = await UserProgress.find({
      user: req.user.id,
      course: { $in: courses.map(c => c._id) }
    });

    const coursesWithProgress = courses.map(course => {
      const userProgress = progress.find(p => p.course.toString() === course._id.toString());
      return {
        ...course.toObject(),
        userProgress: userProgress || null
      };
    });

    res.json({
      courses: coursesWithProgress,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ... (rest of the file unchanged)

// Get single course
router.get('/courses/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get user progress
    const progress = await UserProgress.findOne({
      user: req.user.id,
      course: course._id
    });

    res.json({
      ...course.toObject(),
      userProgress: progress
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Enroll in course
router.post('/courses/:id/enroll', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already enrolled
    const existing = await UserProgress.findOne({
      user: req.user.id,
      course: course._id
    });

    if (existing) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    const progress = new UserProgress({
      user: req.user.id,
      course: course._id
    });

    await progress.save();
    
    // Increment enrolled count
    course.enrolledCount += 1;
    await course.save();

    // Optional: send enrollment notification
    await createNotification(req.user.id, {
      type: 'course_recommendation',
      title: 'Course Enrolled',
      message: `You have successfully enrolled in "${course.title}". Start learning now!`,
      actionUrl: `/learning/${course._id}`,
      actionText: 'Go to Course',
      priority: 'low'
    });

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update course progress
router.post('/courses/:id/progress', protect, async (req, res) => {
  try {
    const { contentId, completed, quizScore } = req.body;

    const progress = await UserProgress.findOne({
      user: req.user.id,
      course: req.params.id
    });

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    if (completed) {
      progress.completedContent.push({
        contentId,
        completedAt: new Date()
      });
    }

    if (quizScore) {
      progress.quizScores.push({
        contentId,
        score: quizScore.score,
        total: quizScore.total,
        completedAt: new Date()
      });
    }

    // Calculate overall progress
    const course = await Course.findById(req.params.id);
    const totalContent = course.content.length;
    progress.progress = (progress.completedContent.length / totalContent) * 100;

    // Check if course just completed
    if (progress.progress >= 100 && progress.status !== 'Completed') {
      progress.status = 'Completed';
      progress.completedAt = new Date();

      // --- Auto-generate certificate if not already issued ---
      if (!progress.certificateIssued) {
        try {
          // Generate unique certificate number
          const certificateNumber = 'CERT-' + crypto.randomBytes(8).toString('hex').toUpperCase();

          // Determine grade based on quiz scores (optional)
          let grade = 'Pass';
          if (progress.quizScores.length > 0) {
            const avgScore = progress.quizScores.reduce((acc, q) => acc + (q.score / q.total), 0) / progress.quizScores.length * 100;
            if (avgScore >= 90) grade = 'Distinction';
            else if (avgScore >= 75) grade = 'Merit';
          }

          const certificate = new Certificate({
            user: req.user.id,
            course: course._id,
            certificateNumber,
            grade,
            metadata: {
              courseName: course.title,
              courseCategory: course.category,
              courseLevel: course.level,
              duration: course.duration
            },
            skills: course.skills
          });

          certificate.shareableUrl = `${process.env.FRONTEND_URL}/verify-certificate/${certificateNumber}`;
          await certificate.save();

          // Mark that certificate has been issued
          progress.certificateIssued = true;

          // Send notification
          await createNotification(req.user.id, {
            type: 'certificate_earned',
            title: 'New Certificate Earned! 🎉',
            message: `Congratulations! You have successfully completed "${course.title}" and earned a certificate.`,
            priority: 'medium',
            actionUrl: `/certificates/${certificate._id}`,
            actionText: 'View Certificate'
          });
        } catch (certError) {
          console.error('Failed to generate certificate:', certError);
          // Don't block the response; just log the error
        }
      }
    }

    progress.lastAccessed = new Date();
    await progress.save();

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's learning progress
router.get('/my-learning', protect, async (req, res) => {
  try {
    const progress = await UserProgress.find({ user: req.user.id })
      .populate('course')
      .sort('-lastAccessed');

    const stats = {
      enrolled: progress.length,
      inProgress: progress.filter(p => p.status === 'In Progress').length,
      completed: progress.filter(p => p.status === 'Completed').length,
      averageProgress: progress.reduce((acc, p) => acc + p.progress, 0) / progress.length || 0
    };

    res.json({
      courses: progress,
      stats
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;