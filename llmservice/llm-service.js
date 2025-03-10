const axios = require("axios");
const express = require("express");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require('@google/generative-ai');
dotenv.config();

const app = express();
const port = 8003;

// Middleware to parse JSON in request body
app.use(express.json());

// 
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
      const GEMINI_API_URL = 'Https://docs.gemini.com';
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
app.post('/ask', async (req, res) => {
  try {
    // Check if required fields are present in the request body
    validateRequiredFields(req, ['question', 'model']);

    //Get the three fields passed
    const { question, model} = req.body;
    
    let answer;
    let questionComplete = "Give in a single line and directly a clue for knowing " + question + "but without saying directly what country is";

    //Get the answer of the LLM
    if (model == 'empathy'){ //For using empathy's LLM
      answer = await sendQuestionToLLM(questionComplete);

    }else if (model == 'gemini'){ //For using the LLM gemini
      const preanswer = await sendQuestionToGemini(questionComplete);
      answer = preanswer.response.text();
    }else{
      throw new Error(`Model "${model}" is not supported.`);
    }
    
    //Return the message
    res.json({ answer });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const server = app.listen(port, () => {
  console.log(`LLM Service listening at http://localhost:${port}`);
});

module.exports = server;
