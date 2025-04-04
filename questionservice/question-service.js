const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const Question = require('./question-model');

const app = express();
const port = 8004;

// Middleware to parse JSON in request body
app.use(express.json());

// Define the connection URL
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mongo-db-wichat_en2a';
const gatewatServiceUrl = process.env.GATEWAY_SERVICE_URL || "http://localhost:8000";

const queries = [
    {
      type: "flag",
      query: `
        SELECT ?country ?countryLabel ?flag WHERE {
          ?country wdt:P31 wd:Q6256;  # Instancia de país
                   wdt:P41 ?flag.     # Tiene bandera
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
      `
    },
    {
      type: "videogame",
      query: `
        SELECT ?videogame ?videogameLabel ?image WHERE {
        ?videogame wdt:P31 wd:Q7889;     # Instancia de videojuego
                    wdt:P18 ?image.       # Imagen
        FILTER NOT EXISTS { ?videogame wdt:P136 wd:Q8604 }  # Excluir música
        FILTER NOT EXISTS { ?videogame wdt:P31 wd:Q386724 } # Excluir demo
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }

      `
    },
    {
      type: "famous-person",
      query: `
        SELECT ?person ?personLabel ?image WHERE {
        ?person wdt:P31 wd:Q5;         # Instancia de ser humano
                wdt:P106 wd:Q33999;    # Ocupación: actor de cine
                wdt:P18 ?image.        # Imagen
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
      `
    },
    {
      type: "car",
      query: `
        SELECT ?company ?companyLabel ?logo WHERE {
        ?company wdt:P31 wd:Q4830453;  # Instancia de empresa
                wdt:P452 wd:Q14006;  # Industria automotriz
                wdt:P154 ?logo.      # Logo
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
      `
    },
    {
        type: "building",
        query: `
          SELECT ?building ?buildingLabel ?image WHERE {
            ?building wdt:P31/wdt:P279* wd:Q41176;  # Instancia de edificio notable
                        wdt:P18 ?image.              # Imagen
            SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
      `
    }
  ];
  
// Connect to MongoDB
mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Fetch flag data from Wikidata
async function fetchQuestionData(numberOfQuestions, questionType) {
    console.time('fetchQuestionData');

    if (numberOfQuestions == null || numberOfQuestions < 1 || !Number.isInteger(numberOfQuestions)) {
        numberOfQuestions = 30; // Default to 30 if invalid
      }
      
    console.log("🧠 Request to fetch questions with:", { questionType, numberOfQuestions });

    const query = getQueryByType(questionType, numberOfQuestions);

    const answerKey = questionType === "flag" ? "countryLabel"
                 : questionType === "videogame" ? "videogameLabel"
                 : questionType === "famous-person" ? "personLabel"
                 : questionType === "car" ? "companyLabel"
                 : questionType === "building" ? "buildingLabel"
                 : null;

    const imageKey = questionType === "flag" ? "flag"
               : questionType === "videogame" ? "image"
               : questionType === "famous-person" ? "image"
               : questionType === "car" ? "logo"
               : questionType === "building" ? "image"
               : null;

    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        const results = await Promise.all(response.data.results.bindings.map(async (entry) => {
            console.log("🔎 Entry keys:", Object.keys(entry));
            console.log("📦 Entry preview:", entry);
            const correctAnswer = entry[answerKey].value;
            const imageUrl = entry[imageKey].value;

            let incorrectOptions = await generateDistractors(correctAnswer, questionType);
            let attempts = 0;
            while (incorrectOptions.length != 3 && attempts < 2) {
              // If the LLM service doesn't provide enough incorrect options, generate more until we have 3 or we have tried 3 times in total
              console.log("Not enough incorrect options, trying again...");
              incorrectOptions = await generateDistractors(correctAnswer, questionType);
              attempts++;
            }

            if (incorrectOptions.length != 3) {
                throw new Error("Not enough incorrect options generated");
            }
      
            const options = [correctAnswer, ...incorrectOptions];
            options.sort(() => Math.random() - 0.5);
      
            return {
                type: questionType,
                imageUrl: imageUrl,
                options: options,
                correctAnswer: correctAnswer
              };
            })
          );

        await saveQuestionsToDB(results); // Save questions to the database
        console.log('Fetched ' + capitalize(questionType) + ' Data:', results);
        console.timeEnd('fetchQuestionData');
        return results;
    } catch (error) {
        console.timeEnd('fetchQuestionData');
        throw new Error('Failed to fetch '+ questionType + ' data from Wikidata');
    }
}

function getQueryByType(type, numberOfQuestions) {
  console.log("📦 getQueryByType:", type);

    const match = queries.find(q => q.type === type);
    if (!match) {
      throw new Error(`No query found for type: ${type}`);
    }
    return match.query + ` LIMIT ${numberOfQuestions}`;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

async function generateDistractors(correctAnswer, questionType) {
    try {
      const llmResponse = await axios.post(
        gatewatServiceUrl + "/generateIncorrectOptions",
        {
          model: "empathy",
          correctAnswer: correctAnswer,
          type: questionType
        }
      );
  
      // Check if the LLM service returned a successful response
      if (llmResponse.status !== 200) {
        throw new Error("Failed to generate distractors from LLM service");
      }
      const incorrectOptions = llmResponse.data.incorrectOptions;
      // Remove leading and trailing spaces from each option
      incorrectOptions.forEach((option, index) => {
        incorrectOptions[index] = option.trim();
      });
  
      return incorrectOptions;
    } catch (error) {
      console.error("Error while generating distractors:", error);
      return [];
    }
  }

// Save questions to the database
async function saveQuestionsToDB(questions) {
    try {
        await Question.insertMany(questions);
        console.log('Questions successfully saved to the DB!');
    } catch (error) {
        console.error('Error while saving questions:', error);
    }
}

// Fetch a question from the database
async function getQuestion() {
    try {
        return await Question.findOneAndUpdate(
            {alreadyShown: false},
            {alreadyShown: true},
            {new: true}
        );
    } catch (error) {
        console.error('Error fetching question:', error);
        return null;
    }
}

// Check if the selected answer is correct
async function checkAnswer(questionId, selectedAnswer) {
    try {
        const question = await Question.findById(questionId);
        if (!question) {
            console.log('Question not found.');
            return false;
        }
        return question.correctAnswer === selectedAnswer;
    } catch (error) {
        console.error('Error checking answer:', error);
        return false;
    }
}

// Endpoint to fetch a question
app.get('/question', async (req, res) => {
    try {
        const question = await getQuestion();
        if (!question) {
            return res.status(404).json({ error: 'No questions available' });
        }
        res.json(question);
    } catch (error) {
        console.error("Error while retrieving a question");
    }
});

/**
 * Endpoint to check if the selected answer is correct
 * 
 * @returns {Object} - A JSON object with the key isCorrect and a boolean value indicating if the answer is correct. It will also return false if the question is not found.
 */
app.post('/check-answer', async (req, res) => {
    try {
        const { questionId, selectedAnswer } = req.body;
        if (!questionId || !selectedAnswer) {
            return res.status(400).json({ error: 'questionId and selectedAnswer are required' });
        }

        const isCorrect = await checkAnswer(questionId, selectedAnswer);
        res.json({ isCorrect });
    } catch (error) {
        console.error("Error while checking questions");
    }
});

// Endpoint to fetch
app.post("/fetch-question-data", async (req, res) => {
    try {
      const { questionType, numberOfQuestions } = req.body;
      const results = await fetchQuestionData(numberOfQuestions, questionType);
      res.json(results);
    } catch (error) {
      console.error("Error while fetching questions");
      res.status(500).json({ error: "Failed generate the questions..." });
    }
});

// Endpoint to erase the questions from the database
app.post('/clear-questions', async (req, res) => {
  try {
    await Question.deleteMany({});
    console.log('Cleared all questions from the database');
    res.json({ message: 'Questions cleared' });
  } catch (error) {
    console.error('Error clearing questions:', error);
    res.status(500);
    res.json({ error: 'Failed to clear questions' });
  }
});


// Start the question service
const server = app.listen(port, () => {
    console.log(`Question Service listening at http://localhost:${port}`);
});

// Close MongoDB connection on server shutdown
server.on('close', () => {
    mongoose.connection.close();
});

module.exports = server;