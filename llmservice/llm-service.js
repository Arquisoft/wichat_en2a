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
    You are assisting a user to get the answer to the following question: "${question}"
    The correct answer to this question is: "${correctAnswer}" (this is just for you to know — DO NOT say it by ANY MEANS).

    The user now is telling you this: "${userMessage}"

    Below are some strict RULES you must follow:
    1. The ONLY text that you must send back is the answer to the question. You are talking to THE USER, NOT ME.
    2. If the user is asking for a hint, clue or help what you MUST do is giving a helpful hint without saying the correct answer or giving it away directly.
    3. If the user is asking for the answer or trying to guess the answer (e.g., "Is it ___?", "Tell me the answer", "What is it?"), respond ONLY with:
      "My apologies, I can not give you the answer to the question, nor confirming any of your guesses, but you can ask for a hint."
    4. If the user says something unrelated to the original question or if it is empty, reply with:
      "My apologies, that is not related to the question. Do you want a hint?"
    5. Never say the answer directly under ANY CIRCUNSTANCES. You just must provide hints.
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
    validateRequiredFields(req, ["model", "quizzQuestion", "correctAnswer"]);

    const { correctAnswer, quizzQuestion } = req.body;
    const question =
    "I need to generate 3 incorrect options for a multiple choice question of exactly 4 options. " +
      "The question is: " + quizzQuestion + 
      " The correct answer is: " + correctAnswer +
      ". Please provide 3 plausible but incorrect answers as a comma-separated list. No explanation.";

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
