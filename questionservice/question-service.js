const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const Question = require('./question-model');

const app = express();
const port = 8004; // Use a unique port for the question service

// Middleware to parse JSON in request body
app.use(express.json());

// Define the connection URL
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mongo-db-wichat_en2a';

// Connect to MongoDB
mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Gateway Service URL
const gatewayServiceUrl = process.env.GATEWAY_SERVICE_URL || 'http://localhost:8000';

// Fetch flag data from Wikidata
async function fetchFlagData() {
    console.time('fetchFlagData');

    const query = `
        SELECT ?country ?countryLabel ?flag WHERE {
      ?country wdt:P31 wd:Q6256;  
               wdt:P41 ?flag.     
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 10
    `;

    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        const results = response.data.results.bindings.map((entry) => ({
            type: 'flag',
            imageUrl: entry.flag.value,
            options: [entry.countryLabel.value], // Temporarily only the correct answer
            correctAnswer: entry.countryLabel.value
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

app.post('/fetch-flag-data', async (req, res) => {
    try {
        const results = await fetchFlagData();
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
//fetchFlagData();

module.exports = server;