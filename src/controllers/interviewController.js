const InterviewTest = require("../models/InterviewTest");
const { generateInterviewQuestions } = require("../services/aiInterviewService");

// CREATE TEST
const createTest = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { role, company, location, difficulty, count, type = 'technical' } = req.body;

  try {
    const questions = await generateInterviewQuestions({
      role,
      company,
      location,
      difficulty,
      count: count || 10,
      type,
    });

    const test = await InterviewTest.create({
      user: userId,
      type,
      role,
      company,
      location,
      difficulty,
      questions,
      totalQuestions: questions.length,
    });

    res.status(201).json({
      testId: test._id,
      type: test.type,
      questions: test.questions.map((q, index) => ({
        index,
        question: q.question,
        options: q.options,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// SUBMIT TEST
const submitTest = async (req, res) => {
  const { testId, answers } = req.body;

  const test = await InterviewTest.findById(testId);
  if (!test) return res.status(404).json({ message: "Test not found" });

  let correct = 0;
  let topicStats = {};

  answers.forEach((ans) => {
    const question = test.questions[ans.questionIndex];
    if (!question) return;

    const topic = question.question.split(":")[0] || "General";

    if (!topicStats[topic]) {
      topicStats[topic] = { correct: 0, total: 0 };
    }

    topicStats[topic].total++;

    if (question.correctAnswer === ans.selectedAnswer) {
      correct++;
      topicStats[topic].correct++;
    }
  });

  test.userAnswers = answers;
  test.score = correct;
  await test.save();

  const percentage = Math.round((correct / test.totalQuestions) * 100);

  let hiringReadiness = 0;

  if (percentage >= 80) hiringReadiness = 90;
  else if (percentage >= 60) hiringReadiness = 70;
  else if (percentage >= 40) hiringReadiness = 50;
  else hiringReadiness = 30;

  res.json({
    score: correct,
    total: test.totalQuestions,
    percentage,
    hiringReadiness,
    topicBreakdown: topicStats,
  });
};

const getInterviewHistory = async (req, res) => {
  const userId = req.user?.id;

  const tests = await InterviewTest.find({ user: userId })
    .sort({ createdAt: -1 })
    .select("role company type score totalQuestions createdAt");

  res.json({ history: tests });
};

module.exports = { createTest, submitTest, getInterviewHistory };