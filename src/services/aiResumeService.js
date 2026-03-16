const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function analyzeResumeWithAI({ resumeText, jobDescription }) {
  const prompt = `
You are an expert ATS resume evaluator.

Analyze the resume below against the job description.

Provide:
1. Overall professional evaluation (short paragraph)
2. Strengths (bullet points)
3. Weaknesses (bullet points)
4. Formatting issues (if any)
5. Suggestions to improve shortlisting chances
6. Match score from 0 to 100 (realistic)
7. Provide 3 improved rewritten bullet points for experience section
Resume:
${resumeText}

Job Description:
${jobDescription || "Not provided"}

Return the result in JSON format:
{
  "aiScore": number,
  "summary": string,
  "strengths": [],
  "weaknesses": [],
  "formattingIssues": [],
  "improvementSuggestions": [],
  rewrittenBullets: []
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;

  try {
    const clean = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(clean);
  } catch (err) {
    console.log("AI JSON parsing failed");
    return {
      aiScore: 0,
      summary: content,
      strengths: [],
      weaknesses: [],
      formattingIssues: [],
      improvementSuggestions: [],
    };
  }
}

module.exports = { analyzeResumeWithAI };
