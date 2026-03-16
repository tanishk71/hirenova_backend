const mongoose = require("mongoose");

const interviewTestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ['technical', 'aptitude'],
      default: 'technical',
      required: true
    },
    role: String,
    company: String,
    location: String,
    difficulty: String,
    questions: [
      {
        question: String,
        options: [String],
        correctAnswer: String,
      },
    ],
    userAnswers: [
      {
        questionIndex: Number,
        selectedAnswer: String,
      },
    ],
    score: { type: Number, default: 0 },
    totalQuestions: Number,
    feedback: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("InterviewTest", interviewTestSchema);