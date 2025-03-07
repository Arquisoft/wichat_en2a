const express = require('express');
const mongoose = require('mongoose');
const Score = require('./score-model');

const app = express();
const port = 8003;

// Middleware to parse JSON in request body
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);

// endpoitn to save game score
app.post('/saveScore', async (req, res) => {
    try {
        const { userId, score } = req.body;

        const newScore = new Score({
            userId,
            score,
        });

        await newScore.save();
        res.json(newScore);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Listen for the 'close' event on the Express.js server
server.on('close', () => {
    // Close the Mongoose connection
    mongoose.connection.close();
  });

module.exports = server