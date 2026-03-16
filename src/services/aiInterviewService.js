const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function fallbackGenerator({ role, difficulty, count, type }) {
  if (type === 'technical') {
    const sampleConcepts = [
      "JavaScript fundamentals",
      "React hooks",
      "Node.js architecture",
      "REST API design",
      "Data structures",
      "System design basics",
      "Database indexing",
      "Authentication & JWT",
    ];

    return Array.from({ length: count }).map((_, i) => {
      const topic = sampleConcepts[i % sampleConcepts.length];
      return {
        question: `(${difficulty}) ${role} Question ${i + 1}: Which statement about ${topic} is correct?`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A",
      };
    });
  } else {
    // aptitude fallback
    const aptitudeTypes = [
      "logical reasoning",
      "numerical ability",
      "verbal reasoning",
    ];
    return Array.from({ length: count }).map((_, i) => {
      const type = aptitudeTypes[i % aptitudeTypes.length];
      return {
        question: `(${difficulty}) Aptitude Question ${i + 1} (${type}): Solve the following problem.`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A",
      };
    });
  }
}

async function generateInterviewQuestions({
  role,
  company,
  location,
  difficulty,
  count = 10,
  type = 'technical',
}) {
  const prompt = type === 'technical'
    ? `
Generate exactly ${count} multiple choice technical interview questions.

Role: ${role}
Company: ${company}
Location: ${location}
Difficulty: ${difficulty}

Return STRICT JSON:
{
  "questions": [
    {
      "question": "string",
      "options": ["A","B","C","D"],
      "correctAnswer": "string"
    }
  ]
}
`
    : `
Generate exactly ${count} multiple choice aptitude test questions (logical reasoning, numerical ability, or verbal reasoning).

Role: ${role}
Company: ${company}
Location: ${location}
Difficulty: ${difficulty}

Return STRICT JSON:
{
  "questions": [
    {
      "question": "string",
      "options": ["A","B","C","D"],
      "correctAnswer": "string"
    }
  ]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0].message.content);

    if (!parsed.questions) {
      throw new Error("Invalid AI structure");
    }

    return parsed.questions;
  } catch (err) {
    console.log("AI unavailable → Using fallback generator");

    return fallbackGenerator({ role, difficulty, count, type });
  }
}

module.exports = { generateInterviewQuestions };