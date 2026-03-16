const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a chat response using OpenAI.
 * @param {string} userMessage - The user's question.
 * @param {object} context - Optional user context (skills, goals, etc.).
 * @returns {Promise<string>} - The assistant's reply.
 */
async function getChatResponse(userMessage, context = {}) {
  const systemPrompt = `You are an AI Career Assistant. Help the user with career advice, resume tips, interview preparation, and job search strategies. Be concise, friendly, and practical. Use the following context about the user if provided: ${JSON.stringify(context)}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI chat error:", error);
    return "I'm sorry, I'm having trouble responding right now. Please try again later.";
  }
}

module.exports = { getChatResponse };