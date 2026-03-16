const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['Technical', 'Soft Skills', 'Interview Prep', 'Resume Writing', 'Career Development'],
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  duration: Number, // in minutes
  topics: [String],
  skills: [String],
  content: [{
    type: {
      type: String,
      enum: ['video', 'article', 'quiz', 'assignment'],
      required: true
    },
    title: String,
    url: String,
    content: String,
    duration: Number,
    order: Number
  }],
  resources: [{
    title: String,
    type: String,
    url: String
  }],
  prerequisites: [String],
  imageUrl: String,
  tags: [String],
  enrolledCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  // Fields for external courses
  externalId: {
    type: String,
    unique: true,
    sparse: true // allows multiple null values
  },
  externalUrl: String,
  source: {
    type: String,
    enum: ['microsoft-learn', 'khan-academy', 'mit-ocw', 'nptel', 'coursera', 'other'],
    required: function() { return !!this.externalUrl; } // Only required if it's an external course
  },
  thumbnail: String,
  lastSynced: Date
}, {
  timestamps: true
});

// Index for faster queries by source and externalId (prevents duplicates across providers)
courseSchema.index({ source: 1, externalId: 1 }, { unique: true, partialFilterExpression: { externalId: { $exists: true } } });

module.exports = mongoose.model('Course', courseSchema);