const axios = require("axios");
const express = require("express");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require('@google/generative-ai');
dotenv.config();

const app = express();
const port = 8003;

// Middleware to parse JSON in request body
app.use(express.json());
 
const llmConfigs = {
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

// Generic function to send questions to LLM (now it's only use for empathy)
async function sendQuestionToLLM(question) {
  try {
    const config = llmConfigs['empathy'];
    
    //Transform the url with apiKey passed
    const url = config.url(process.env.EMPATHY_KEY);

    //With the question passed it transformed it to the request
    const requestData = config.transformRequest(question);

    const headers = {
      'Content-Type': 'application/json',
      ...(config.headers ? config.headers(process.env.EMPATHY_KEY) : {})
    };

    //Generates de response of the LLM
    const response = await axios.post(url, requestData, { headers });

    //Return the response already transform 
    return config.transformResponse(response);

  } catch (error) {
    console.error(`Error sending question to ${empathy}:`, error.message || error);
    return null;
  }
}

//It returns the answer to the question by using the LLM of gemini (It's only for if in the future empathy's LLM gives problem with the answers change and dont waste time)
async function sendQuestionToGemini(question){
    try{
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent(question);

      return result;

    }catch(error){
      console.error(`Error sending question to ${model}:`, error.message || error)
      return null;
    }

}

//For the getting the hint from the LLM to help the user to answer the question
app.post("/ask", async (req, res) => {
  try {
    validateRequiredFields(req, ["question", "userMessage", "model", "correctAnswer"]);

    const {question, userMessage, model, correctAnswer} = req.body;

    //What will be send to the LLM
    const prompt = `
    You are an assitant for a user who is trying to find the answer to a question.
    Question the user is trying to solve: "${question}"
    Answer to the question the user is trying to solve: "${correctAnswer}" (DO NOT say it by ANY MEANS).
    What the user tells you: "${userMessage}"

    Below are your strict RULES that you MUST follow:
    1. NEVER WRITE "${correctAnswer}" in your message.
    2. NEVER ASK QUESTIONS TO THE USER.
    3. If the user asks directly for the answer tell: "My apologies, I cannot give you the answer directly".
    4. If the user asks for a hint or some help, provide them with a useful hint but DO NOT WRITE "${correctAnswer}".
    5. If the user asks something related to the question, answer ONLY IF answering does not give them the answer directly.
    6. NEVER EVER WRITE "${correctAnswer}" ANYWHERE IN YOUR RESPONSE.
    `;  

    let answer;

    //Getting the answer from the LLM
    if (model === "empathy") { //For using Empathy
      answer = await sendQuestionToLLM(prompt);
    } else if (model === "gemini") { //For using LLM Gemini
      const preanswer = await sendQuestionToGemini(prompt);
      answer = preanswer?.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    } else {
      throw new Error(`Model "${model}" is not supported.`);
    }

    //Error if there is no answer
    if (!answer) {
      throw new Error("The LLM did not return a valid response.");
    }

    //Return the message
    res.json({ answer });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/generateIncorrectOptions", async (req, res) => {
  try {
    validateRequiredFields(req, ["model", "correctAnswer"]);

    const { correctAnswer } = req.body;
    let question =
      "I need to generate incorrect options for a multiple choice question of exactly 4 options. The question is: What country is represented by the flag shown? The correct answer to this question is:" +
      correctAnswer +
      ". I need you to generate 3 incorrect options for that question that could be used as distractors. They should be plausible but different from the correct one. Provide them as 3 comma-separated values, nothing more.";

    const answer = await sendQuestionToLLM(question);

    let incorrectOptions = answer.split(",");
    res.json({ incorrectOptions });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start the service
const server = app.listen(port, () => {
  console.log(`LLM Service listening at http://localhost:${port}`);
});

module.exports = server;
