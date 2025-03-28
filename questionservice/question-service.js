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
const llmServiceUrl = process.env.LLM_SERVICE_URL || 'http://localhost:8003';

// Connect to MongoDB
mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Fetch flag data from Wikidata
async function fetchFlagData() {
    console.time('fetchFlagData');

    const query = `
        SELECT ?country ?countryLabel ?flag WHERE {
      ?country wdt:P31 wd:Q6256;  
               wdt:P41 ?flag.     
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 30
    `;

    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        const results = await Promise.all(response.data.results.bindings.map(async (entry) => {
            const correctAnswer = entry.countryLabel.value;
            const imageUrl = entry.flag.value;

            try {
                // Call the LLM service to generate incorrect answers, if you are running the application with npm start, then
                // use this link: 'http://localhost:8003/generateIncorrectOptions'
                console.log('Link to llm is ', llmServiceUrl);
                const llmResponse = await axios.post(llmServiceUrl + '/generateIncorrectOptions', {
                    model: "empathy",
                    quizzQuestion  : "What country is represented by the flag shown?",
                    correctAnswer: correctAnswer
                });

                const incorrectOptions = llmResponse.data.incorrectOptions;
                const options = [correctAnswer, ...incorrectOptions];
                const optionsShuffled = options.sort(() => Math.random() - 0.5);

                return {
                    type: 'flag',
                    imageUrl: imageUrl,
                    options: optionsShuffled,
                    correctAnswer: correctAnswer
                };
            } catch (llmError) {
                console.error('Failed to generate incorrect options:', llmError.message);
                return {
                    type: 'flag',
                    imageUrl: imageUrl,
                    options: [correctAnswer],
                    correctAnswer: correctAnswer
                };
            }
        }));

        await saveQuestionsToDB(results); // Save questions to the database
        console.log('Fetched Flag Data:', results);
        console.timeEnd('fetchFlagData');
        return results;
    } catch (error) {
        console.timeEnd('fetchFlagData');
        throw new Error('Failed to fetch flag data from Wikidata');
    }
}

// Fetch Pokémon data from Wikidata
async function fetchPokemonData() {
    console.time('fetchPokemonData');

    const query = `
        SELECT ?pokemon ?pokemonLabel ?image WHERE {
            ?pokemon wdt:P31 wd:Q3966183;  # instance of Pokémon species
                     wdt:P18 ?image.       # image
            SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        LIMIT 30
    `;

    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        const results = await Promise.all(response.data.results.bindings.map(async (entry) => {
            const correctAnswer = entry.pokemonLabel.value;
            const imageUrl = entry.image.value;

            try {
                console.log('Link to llm is', llmServiceUrl);
                const llmResponse = await axios.post(llmServiceUrl + '/generateIncorrectOptions', {
                    model: "empathy",
                    quizzQuestion: "What is the name of this Pokémon?",
                    correctAnswer: correctAnswer
                });

                const incorrectOptions = llmResponse.data.incorrectOptions;
                const options = [correctAnswer, ...incorrectOptions];
                const optionsShuffled = options.sort(() => Math.random() - 0.5);

                return {
                    type: 'pokemon',
                    imageUrl: imageUrl,
                    options: optionsShuffled,
                    correctAnswer: correctAnswer
                };
            } catch (llmError) {
                console.error('Failed to generate incorrect options:', llmError.message);
                return {
                    type: 'pokemon',
                    imageUrl: imageUrl,
                    options: [correctAnswer],
                    correctAnswer: correctAnswer
                };
            }
        }));

        await saveQuestionsToDB(results);
        console.log('Fetched Pokémon Data:', results);
        console.timeEnd('fetchPokemonData');
        return results;
    } catch (error) {
        console.timeEnd('fetchPokemonData');
        throw new Error('Failed to fetch Pokémon data from Wikidata');
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
        const question = await Question.findOneAndUpdate(
            { alreadyShown: false },
            { alreadyShown: true },
            { new: true }
        );
        return question;
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

// Endpoint to check an answer
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
app.post('/fetch-flag-data', async (req, res) => {
    try {
        const results = await fetchFlagData(req.question);
        res.json(results);
    } catch (error) {
        console.error("Error while fetching questions");
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