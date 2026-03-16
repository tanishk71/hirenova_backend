const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledDate: {
    type: Date,
    default: Date.now
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  completedContent: [{
    contentId: {
      type: String,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  quizScores: [{
    contentId: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'Dropped'],
    default: 'Not Started'
  },
  completedAt: Date,
  certificateIssued: {
    type: Boolean,
    default: false
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  lastContentId: String, // Last content the user was viewing
  bookmarks: [{
    contentId: String,
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: [{
    contentId: String,
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Compound index to ensure one progress record per user per course
userProgressSchema.index({ user: 1, course: 1 }, { unique: true });

// Index for querying user's courses
userProgressSchema.index({ user: 1, status: 1, lastAccessed: -1 });

// Method to calculate progress percentage
userProgressSchema.methods.calculateProgress = function(courseContentLength) {
  if (!courseContentLength || courseContentLength === 0) return 0;
  this.progress = (this.completedContent.length / courseContentLength) * 100;
  return this.progress;
};

// Method to check if course is completed
userProgressSchema.methods.checkCompletion = function(courseContentLength) {
  if (this.completedContent.length >= courseContentLength) {
    this.status = 'Completed';
    this.completedAt = this.completedAt || new Date();
    return true;
  }
  return false;
};

// Virtual for completion percentage
userProgressSchema.virtual('completionPercentage').get(function() {
  return Math.round(this.progress);
});

// Ensure virtuals are included in JSON output
userProgressSchema.set('toJSON', { virtuals: true });
userProgressSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);