const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// Get all notifications for user
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, read, type } = req.query;
    
    const query = { user: req.user.id };
    if (read !== undefined) query.read = read === 'true';
    if (type) query.type = type;

    const notifications = await Notification.find(query)
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      read: false
    });

    res.json({
      notifications,
      unreadCount,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark all as read
router.post('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { 
        read: true, 
        readAt: new Date() 
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create notification (internal use)
const createNotification = async (userId, notificationData) => {
  try {
    const notification = new Notification({
      user: userId,
      ...notificationData
    });
    await notification.save();
    
    // Here you could emit socket event for real-time notification
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Delete notification
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear all notifications
router.delete('/', protect, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get notification preferences
router.get('/preferences', protect, (req, res) => {
  // This would typically come from user settings
  const defaultPreferences = {
    email: {
      job_alerts: true,
      application_updates: true,
      interview_reminders: true,
      course_recommendations: true,
      marketing: false
    },
    push: {
      job_alerts: true,
      application_updates: true,
      interview_reminders: true,
      course_recommendations: false,
      system: true
    },
    inApp: {
      all: true
    }
  };

  res.json(defaultPreferences);
});

// Update notification preferences
router.put('/preferences', protect, async (req, res) => {
  try {
    // This would save to user settings
    // For now, just return success
    res.json({ 
      message: 'Preferences updated successfully',
      preferences: req.body 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = {
  router,
  createNotification
};