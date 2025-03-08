const axios = require("axios");
const express = require("express");

const app = express();
const port = 8003;

// Middleware to parse JSON in request body
app.use(express.json());

// Define configurations for different LLM APIs
const llmConfigs = {
  gemini: {
    url: (apiKey) =>
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    transformRequest: (question) => ({
      contents: [{ parts: [{ text: question }] }],
    }),
    transformResponse: (response) =>
      response.data.candidates[0]?.content?.parts[0]?.text,
  },
  empathy: {
    url: () => "https://empathyai.prod.empathy.co/v1/chat/completions",
    transformRequest: (question) => ({
      model: "qwen/Qwen2.5-Coder-7B-Instruct",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: question },
      ],
    }),
    transformResponse: (response) => response.data.choices[0]?.message?.content,
    headers: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
  },
};

// Function to validate required fields in the request body
function validateRequiredFields(req, requiredFields) {
  for (const field of requiredFields) {
    if (!(field in req.body)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

// Generic function to send questions to LLM
async function sendQuestionToLLM(question, apiKey, model) {
  const config = llmConfigs[model];
  if (!config) {
    // This errror should be catched in the endpoints that call this function
    throw new Error(`Model "${model}" is not supported.`);
  }

  const url = config.url(apiKey);
  const requestData = config.transformRequest(question);

  const headers = {
    "Content-Type": "application/json",
    ...(config.headers ? config.headers(apiKey) : {}),
  };

  const response = await axios.post(url, requestData, { headers });

  return config.transformResponse(response);
}

app.post("/ask", async (req, res) => {
  try {
    // Check if required fields are present in the request body
    validateRequiredFields(req, ["question", "model", "apiKey"]);

    const { question, model, apiKey } = req.body;
    const answer = await sendQuestionToLLM(question, apiKey, model);

    res.json({ answer });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generation of incorrect options via llm
app.post("/generateIncorrectOptions", async (req, res) => {
  try {
    validateRequiredFields(req, ["model", "apiKey", "correctAnswer"]);

    const { model, apiKey, correctAnswer } = req.body;
    let question =
      "I need to generate incorrect options for a multiple choice question of exactly 4 options. The question is: What country is represented by the flag shown? The correct answer to this question is:" +
      correctAnswer +
      ". I need you to generate 3 incorrect options for that question that could be used as distractors. They should be plausible but different from the correct one. Provide them as 3 comma-separated values, nothing more.";

    const answer = await sendQuestionToLLM(question, apiKey, model);

    let incorrectOptions = answer.split(",");
    res.json({ incorrectOptions });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const server = app.listen(port, () => {
  console.log(`LLM Service listening at http://localhost:${port}`);
});

module.exports = server;
