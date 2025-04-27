const axios = require("axios");
const express = require("express");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require('@google/generative-ai');
dotenv.config();

const app = express();
const port = 8003;
let conversation = [];
let currentQuestion = "";
let currentCorrectAnswer = "";
const empathyModels = ["mistralai/Mistral-7B-Instruct-v0.3", "qwen/Qwen2.5-Coder-7B-Instruct"];
let selectedModel = empathyModels[0]; // Default model

// Middleware to parse JSON in request body
app.use(express.json());

const llmConfigs = {
  empathy: {
    url: () => "https://empathyai.prod.empathy.co/v1/chat/completions",
    transformRequest: (question) => ({
      // model: "qwen/Qwen2.5-Coder-7B-Instruct",
      model: selectedModel,
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

const questions = [
  {
    type: "flag",
    question: "What country is represented by the flag shown?"
  },
  {
    type: "car",
    question: "Which is the car in the picture?"
  },
  {
    type: "famous-person",
    question: "Who's this famous person?"
  },
  {
    type: "dino",
    question: "Which dinosaur or prehistorical being is shown in the picture?"
  },
  {
    type: "place",
    question: "Which famous place is shown in the image?"
  }
];


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
    console.error(`Error sending question:`, error.message || error);
    if (error.response?.status >= 500 && error.response?.status < 600) {
      // It is a server error, next try with the other model
      selectedModel = selectedModel === empathyModels[0] ? empathyModels[1] : empathyModels[0];
      console.log(`Switched to ${selectedModel} due to server error`);
    }
    return null;
  }
}

//It returns the answer to the question by using the LLM of gemini (It's only for if in the future empathy's LLM gives problem with the answers change and dont waste time)
async function sendQuestionToGemini(question) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(question);

    return result;

  } catch (error) {
    console.error(`Error sending question:`, error.message || error)
    return null;
  }

}

//For the getting the hint from the LLM to help the user to answer the question
app.post("/ask", async (req, res) => {
  try {
    validateRequiredFields(req, ["question", "userMessage", "model", "correctAnswer"]);

    const { question, userMessage, model, correctAnswer } = req.body;
    //if current question is not defined or has changed, reset
    //we reset the conversation whenever the question changes
    if (currentQuestion === "" || currentQuestion !== question || currentCorrectAnswer === "" || currentCorrectAnswer !== correctAnswer) {
      currentQuestion = question;
      currentCorrectAnswer = correctAnswer;
      conversation = [];
    }

    //What will be send to the LLM
    const prompt = `
    You are an assitant for a user who is trying to find the answer to a question.
    Question the user is trying to solve: "${question}"
    Answer to the question the user is trying to solve: "${correctAnswer}" (DO NOT say it by ANY MEANS).
    What the user tells you: "${userMessage}"

    Take into account the following when answering: the user has an image they can see with information relevant to the question.
    For example, if the question is "What country is this flag from?" the image is the flag.

    Your CONVERSATION with the user up until now was like this:
    ${getConversation()}
    Take it into account when answering what the user has just asked, as the current thing the user has said may be related to their previous inquiries.
    DO NOT REWRITE THE CONVERSATION IN YOUR ANSWER.
    The ONLY THING you must write is THE ANSWER to "${userMessage}" following your RULES.

    Below are your strict RULES that you MUST follow:
    1. NEVER WRITE "${correctAnswer}" in your message.
    2. NEVER ASK QUESTIONS TO THE USER.
    3. DO NOT DESCRIBE THE OBJECT IN QUESTION AS A HINT (for example, the flag if the question is "What country is this flag from?", as the user has an image of it).
    4. NEVER write ANYTHING OF THE CONVERSATION I provided in the new message. You CANNOT WRITE THE PREVIOUS INTERACTIONS AGAIN.
    5. If the user asks directly for the answer tell that you CAN NOT DO THAT and explain why if necessary. The reason why is that it will ruin the game.
    6. If the user wants you to confirm or deny their guess, tell them that you cannot say that because it will ruin the fun. They may ask you for the correct option or a wrong one.
    7. If the user asks for a hint or some help, provide them with a useful hint but DO NOT WRITE "${correctAnswer}".
    8. If the user asks for a characteristic of the object in question, even if you think is tangentially related (President of the country the flag is from, a famous dish of the country, the color of the pokemon if the question is about pokemons...), answer it BUT WITHOUT WRITTING "${correctAnswer}" or giving the answer away directly.
    9. If you want to answer with something close (if asked about the capital of the country then answering with the initial of the capital for example) say: That may make it too easy, I can tell you... and then whatever you want to say (that the initial of the capital is...). This is for cases when answering may give the answer away but you can say something similar or a less obvious hint.
    10. If the user asks you about something that is COMPLETELY unrelated to the question they are trying to find the answer from, tell them that it is not relevant and that you are programmed to answer questions about the quizz and give hints.
    11. If the user asks something about you if it is not relevant to the question tell them so. If it is to know what do you do, tell them you are an AI assistant programmed to help with the quizz.
    12. NEVER EVER WRITE "${correctAnswer}" ANYWHERE IN YOUR RESPONSE.
    13. Remember, you are NOT TALKING TO ME. You are talking WITH THE USER that said "${userMessage}".
    `;
    //8. If the user asks something related to the question, answer ONLY IF answering does not give them the answer directly.
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

    conversation.push({ question: userMessage, answer: answer }); //Save the latest response

    //Return the message
    res.json({ answer });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

function getConversation() {
  return conversation
    .map((conv, index) => `Interaction ${index + 1}:\nUser: ${conv.question}\nAssistant: ${conv.answer}`)
    .join("\n\n");
}

app.post("/generateIncorrectOptions", async (req, res) => {
  try {
    validateRequiredFields(req, ["model", "correctAnswer", "type"]);

    const { correctAnswer, type } = req.body;
    let question =
      "I need to generate incorrect options for a multiple choice question. The question is: " + getQuestionByType(type) + " The correct answer to this question is:" +
      correctAnswer +
      ". I need you to generate exactly 3 incorrect options for that question that could be used as distractors. They should be plausible options but different from the correct one. Provide them as 3 comma-separated values, AND DO NOT WRITE ANYTHING MORE THAN THOSE VALUES. The response should look exactly like: answer1,answer2,answer3";

    const answer = await sendQuestionToLLM(question);

    let incorrectOptions = answer.split(",");
    res.json({ incorrectOptions });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

function getQuestionByType(type) {
  const match = questions.find(q => q.type === type);
  if (!match) {
    throw new Error(`No question found for type: ${type}`);
  }
  return match.question;
}

// Start the service
const server = app.listen(port, () => {
  console.log(`LLM Service listening at http://localhost:${port}`);
});

module.exports = server;

if (process.env.NODE_ENV === "test") {
  module.exports ={
    app,
    server,
    getSelectedModel: () => selectedModel
  };
}