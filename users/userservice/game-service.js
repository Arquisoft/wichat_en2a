const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./user-model')
const Score = require('./score-model')
const { check, matchedData, validationResult } = require('express-validator');
const app = express();

app.disable('x-powered-by');
const port = 8002; 

// Middleware to parse JSON in request body
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);

// endpoitn to save game score
app.post('/saveScore', async (req, res) => {
    try {
        const { userId, score, isVictory } = req.body;

        const newScore = new Score({
            userId,
            score,
            isVictory,
        });

        await newScore.save();
        res.json(newScore);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// endpoint to update a score
app.put('/updateScore', async (req, res) => {
    try {
        const { userId, score, isVictory } = req.body;

        // verify that userId is a valid ObjectId 
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid userId format' });
        }

        const updatedScore = await Score.findOneAndUpdate(
            { userId: new mongoose.Types.ObjectId(userId) }, // make userId safe
            { $set: { score, isVictory } }, // use $set to avoid mongodb inyection security risk on Sonar Test
            { new: true }
        );

        if (!updatedScore) {
            return res.status(404).json({ error: 'Score not found' });
        }

        res.json(updatedScore);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// endpoint to get scores by user
app.get('/scoresByUser/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const scores = await Score.find({ userId });

        if (scores.length === 0) {
            return res.status(404).json({ error: 'No scores found for this user' });
        }

        res.json(scores);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Game Service listening at http://localhost:${port}`);
});

server.on('close', () => {
    // Close the Mongoose connection
    mongoose.connection.close();
  });

module.exports = server