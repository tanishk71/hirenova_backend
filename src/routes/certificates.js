const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const UserProgress = require('../models/UserProgress');
const { protect } = require('../middleware/authMiddleware');
const crypto = require('crypto');

// Generate unique certificate number
const generateCertificateNumber = () => {
  return 'CERT-' + crypto.randomBytes(8).toString('hex').toUpperCase();
};

// Get all user certificates
router.get('/', protect, async (req, res) => {
  try {
    const certificates = await Certificate.find({ user: req.user.id })
      .populate('course')
      .sort('-issueDate');

    res.json(certificates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single certificate
router.get('/:id', protect, async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('course');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    res.json(certificate);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate certificate for completed course
router.post('/generate', protect, async (req, res) => {
  try {
    const { courseId, grade, score } = req.body;

    // Check if course completed
    const progress = await UserProgress.findOne({
      user: req.user.id,
      course: courseId
    });

    if (!progress || progress.status !== 'Completed') {
      return res.status(400).json({ message: 'Course not completed yet' });
    }

    // Check if certificate already exists
    const existing = await Certificate.findOne({
      user: req.user.id,
      course: courseId
    });

    if (existing) {
      return res.status(400).json({ message: 'Certificate already generated' });
    }

    const course = await Course.findById(courseId);

    const certificate = new Certificate({
      user: req.user.id,
      course: courseId,
      certificateNumber: generateCertificateNumber(),
      grade,
      score,
      metadata: {
        courseName: course.title,
        courseCategory: course.category,
        courseLevel: course.level,
        duration: course.duration
      },
      skills: course.skills
    });

    await certificate.save();

    // Generate shareable URL
    certificate.shareableUrl = `${process.env.FRONTEND_URL}/verify-certificate/${certificate.certificateNumber}`;
    await certificate.save();

    res.json(certificate);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify certificate (public route)
router.get('/verify/:certificateNumber', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateNumber: req.params.certificateNumber
    }).populate('user', 'username email').populate('course', 'title category level');

    if (!certificate) {
      return res.status(404).json({ 
        valid: false,
        message: 'Certificate not found' 
      });
    }

    res.json({
      valid: certificate.verified,
      certificate: {
        holder: certificate.user.username,
        course: certificate.metadata.courseName,
        issueDate: certificate.issueDate,
        grade: certificate.grade,
        certificateNumber: certificate.certificateNumber
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Download certificate (would integrate with PDF generation)
router.get('/:id/download', protect, async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('user').populate('course');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Here you would generate PDF and send it
    // For now, return certificate data
    res.json({
      message: 'PDF generation would happen here',
      certificate
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;