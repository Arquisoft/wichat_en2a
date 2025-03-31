const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Score = require('./score-model');

const app = express();

app.disable('x-powered-by');
const port = 8005; 

// Middleware to parse JSON in request body
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamedb';
mongoose.connect(mongoUri);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (!bearerHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
  
    const token = bearerHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, 'your-secret-key');
      req.userId = decoded.userId;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };

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
            { userId: new mongoose.Types.ObjectId(String(userId)) }, // Make sure userId is a string
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

// Endpoint using authentification to get current user's scores
app.get('/scores', verifyToken, async (req, res) => {
    try {
      const scores = await Score.find({ userId: req.userId });
      if (scores.length === 0) {
        return res.status(404).json({ error: 'No scores found for this user' });
      }
      res.json(scores);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

//endpoint Ladearboard
/* Possible calls:
   - GET http://localhost:8005/leaderboard
   - GET http://localhost:8005/leaderboard?sortBy=totalScore&sortOrder=asc
   - GET http://localhost:8005/leaderboard?sortBy=gamesPlayed&sortOrder=desc
   - GET http://localhost:8005/leaderboard?sortBy=winRate&sortOrder=desc
*/
app.get('/leaderboard', async (req, res) => {
    try {
        const sortBy = req.query.sortBy || 'totalScore';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        const sortFields = {
            'totalScore': 'totalScore',
            'gamesPlayed': 'gamesPlayed',
            'avgPointsPerGame': 'avgPointsPerGame',
            'winRate': 'winRate'
        };

        if (!sortFields[sortBy]) {
            return res.status(400).json({ 
                error: 'Invalid sort field', 
                validFields: Object.keys(sortFields) 
            });
        }

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
                $project: {
                    userId: '$_id',
                    totalScore: 1,
                    gamesPlayed: 1,
                    avgPointsPerGame: {
                        $cond: [
                            { $eq: ['$gamesPlayed', 0] },
                            0,
                            { $divide: ['$totalScore', '$gamesPlayed'] }
                        ]
                    },
                    winRate: {
                        $multiply: [
                            { $cond: [
                                { $eq: ['$gamesPlayed', 0] },
                                0,
                                { $divide: ['$victories', '$gamesPlayed'] }
                            ]},
                            100
                        ]
                    },                    
                },
            },
            { 
                $sort: { 
                    [sortFields[sortBy]]: sortOrder 
                } 
            },
        ]);

        res.json(scores);
    } catch (error) {
        console.error('Leaderboard Error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
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