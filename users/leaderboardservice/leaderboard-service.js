const express = require('express');
const mongoose = require('mongoose');
//const bcrypt = require('bcrypt');
//const User = require('../userservice/user-model')
const Score = require('./users/common/score-model')
const app = express();
app.disable('x-powered-by');
const port = 8006; 

// Middleware to parse JSON in request body
app.use(express.json());
//Claves relevantes nombre coleccion Usuarios! = 'users'
// en bd llamar totalScore 

// Middleware to parse JSON in request body
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/leaderboarddb';
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
                    victories: { $sum: { $cond: [{ $eq: ['$isVictory', true] }, 1, 0] } } 
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
                    avgPointsPerGame: {
                        $cond: [
                            { $eq: ['$gamesPlayed', 0] }, // If no games, avoid division by zero
                            0, // default avg = 0
                            { $divide: ['$totalScore', '$gamesPlayed'] } // totalScore / gamesPlayed
                        ]
                    },
                    winRate: {
                        $multiply: [
                            { $cond: [
                                { $eq: ['$gamesPlayed', 0] }, // If no games, avoid division by zero
                                0, // default win rate = 0
                                { $divide: ['$victories', '$gamesPlayed'] } // victories / gamesPlayed
                            ]},
                            100 // Convert value to percentage
                        ]
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