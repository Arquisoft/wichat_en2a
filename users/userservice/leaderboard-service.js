const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./auth-model')
const { check, matchedData, validationResult } = require('express-validator');
const app = express();
const port = 8002; 

// Middleware to parse JSON in request body
app.use(express.json());
//Claves relevantes nombre coleccion Usuarios! = 'users'
// en bd llamar totalScore 

// Middleware to parse JSON in request body
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);

// endpoint for LEaderboard
app.get('/leaderboard', async (req, res) => {
    try {
        const scores = await Score.aggregate([
            {
                $group: {
                    _id: '$userId',
                    totalScore: { $sum: '$score' },
                    gamesPlayed: { $count: {} },
                },
            },
            {
                $lookup: {
                    from: 'users', // Importante nombre coleccion Usuarios! = 'users'
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo',
                },
            },
            {
                $unwind: '$userInfo',
            },
            {
                $project: {
                    username: '$userInfo.username',
                    totalScore: 1,
                    gamesPlayed: 1,
                    winPercentage: {
                        $multiply: [
                            { $divide: ['$totalScore', { $add: ['$totalScore', 1] }] }, // totalScore + 1
                            100,
                        ],
                    },
                },
            },
            { $sort: { totalScore: -1 } }, // order in js by total score 
            //  could be by games played, winrate, avg points... to be implemented
        ]);

        res.json(scores);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
const server = app.listen(port, () => {
    console.log(`Leaderboard Service listening at http://localhost:${port}`);
});

// Listen for the 'close' event on the Express.js server
server.on('close', () => {
    // Close the Mongoose connection
    mongoose.connection.close();
  });

module.exports = server