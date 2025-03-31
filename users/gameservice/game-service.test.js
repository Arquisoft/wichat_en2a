const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('./user-model');
const Score = require('./score-model');
const mongoose = require('mongoose');
const TEST_PASSWORD = 'test_password_123'; // NOSONAR

let mongoServer;
let app;
let testUserId1;
let testUserId2;

// Helper functions to reduce duplication
const createObjectId = (id) => new mongoose.Types.ObjectId(id);
const makeRequest = (method, endpoint, data = null) => {
  const req = request(app)[method](endpoint);
  return data ? req.send(data) : req;
};

const verifyResponse = (response, status, expectedProperties = {}) => {
  expect(response.status).toBe(status);
  Object.entries(expectedProperties).forEach(([key, value]) => {
    expect(response.body).toHaveProperty(key, value);
  });
};

const verifyScoreInDb = async (userId, expectedScore, expectedVictory) => {
  const scoreInDb = await Score.findOne({ userId });
  expect(scoreInDb).not.toBeNull();
  expect(scoreInDb.score).toBe(expectedScore);
  expect(scoreInDb.isVictory).toBe(expectedVictory);
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  app = require('./game-service');

  // Create test users
  const users = await User.insertMany([
    {
      username: 'testuser',
      email: 'test@example.com',
      password: TEST_PASSWORD // NOSONAR
    },
    {
      username: 'testuser2',
      email: 'test2@example.com',
      password: TEST_PASSWORD
    }
  ]);

  testUserId1 = users[0]._id.toString();
  testUserId2 = users[1]._id.toString();
});

afterAll(async () => {
  app.close();
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Score.deleteMany({}); // Clear all scores before testing
});

describe('Game Service Score Endpoints', () => {
  
  it('should save a new score on POST /saveScore', async () => {
    const scoreData = {
      userId: createObjectId(testUserId1),
      score: 100,
      isVictory: true
    };
    
    const response = await makeRequest('post', '/saveScore', scoreData);
    
    verifyResponse(response, 200, {
      userId: testUserId1,
      score: 100,
      isVictory: true
    });
    
    await verifyScoreInDb(testUserId1, 100, true);
  });
  
  it('should update an existing score on PUT /updateScore', async () => {
    // Create initial score
    await new Score({
      userId: createObjectId(testUserId1),
      score: 50,
      isVictory: false
    }).save();
    
    // Update it
    const response = await makeRequest('put', '/updateScore', {
      userId: createObjectId(testUserId1),
      score: 150,
      isVictory: true
    });
    
    verifyResponse(response, 200, {
      score: 150,
      isVictory: true
    });
    
    await verifyScoreInDb(testUserId1, 150, true);
  });
  
  it('should get all scores for a user on GET /scoresByUser/:userId', async () => {
    // Create test scores
    const scores = [
      { userId: createObjectId(testUserId1), score: 100, isVictory: true },
      { userId: createObjectId(testUserId1), score: 200, isVictory: false }
    ];
    
    await Score.insertMany(scores);
    
    const response = await makeRequest('get', `/scoresByUser/${testUserId1}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);

    // Validate scores
    const expectedScores = [
      { userId: testUserId1, score: 100, isVictory: true },
      { userId: testUserId1, score: 200, isVictory: false }
    ];
    
    expectedScores.forEach((expected, index) => {
      const actual = response.body[index];
      expect(actual.userId).toBe(expected.userId);
      expect(actual.score).toBe(expected.score);
      expect(actual.isVictory).toBe(expected.isVictory);
    });
  });
  
  it('should return 400 for invalid userId format', async () => {
    const response = await makeRequest('post', '/saveScore', {
      userId: 'invalid-id',
      score: 100,
      isVictory: true
    });
    
    verifyResponse(response, 400);
    expect(response.body).toHaveProperty('error');
  });
  
  it('should return 404 if no scores found for user', async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId().toString();
    const response = await makeRequest('get', `/scoresByUser/${nonExistentUserId}`);
    
    verifyResponse(response, 404);
    expect(response.body).toHaveProperty('error');
  });
});

describe('Game Service Leaderboard Endpoint', () => {
  // Helper function to insert test scores
  const setupLeaderboardScores = async (testScores) => {
    const formattedScores = testScores.map(score => ({
      ...score,
      userId: createObjectId(score.userId)
    }));
    await Score.insertMany(formattedScores);
  };

  it('should return the leaderboard sorted by totalScore by default', async () => {
    const scores = [
      { userId: testUserId1, score: 100, isVictory: true },
      { userId: testUserId1, score: 200, isVictory: false },
      { userId: testUserId2, score: 150, isVictory: true },
      { userId: testUserId2, score: 100, isVictory: true }
    ];

    await setupLeaderboardScores(scores);
    const response = await makeRequest('get', '/leaderboard');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    
    // Validate totalScore sorting
    const [first, second] = response.body;
    expect(first.totalScore).toBe(300); // User1 total score
    expect(second.totalScore).toBe(250); // User2 total score
    expect(first.totalScore).toBeGreaterThan(second.totalScore);
  });

  it('should return the leaderboard sorted by specified criteria', async () => {
    // Test different sort criteria with a single test setup
    const testCases = [
      { 
        sortBy: 'gamesPlayed', 
        scores: [
          { userId: testUserId1, score: 100, isVictory: true },
          { userId: testUserId1, score: 200, isVictory: false },
          { userId: testUserId2, score: 150, isVictory: true },
          { userId: testUserId2, score: 100, isVictory: true },
          { userId: testUserId2, score: 50, isVictory: false }
        ],
        expectations: {
          firstValue: 3, // User2 played 3 games
          secondValue: 2  // User1 played 2 games
        }
      },
      {
        sortBy: 'winRate',
        scores: [
          { userId: testUserId1, score: 100, isVictory: true },
          { userId: testUserId1, score: 200, isVictory: false },
          { userId: testUserId2, score: 150, isVictory: true },
          { userId: testUserId2, score: 100, isVictory: true }
        ],
        expectations: {
          firstValue: 100, // User2 has 100% win rate
          secondValue: 50  // User1 has 50% win rate
        }
      }
    ];

    for (const testCase of testCases) {
      await Score.deleteMany({}); // Clear previous test data
      await setupLeaderboardScores(testCase.scores);
      
      const response = await makeRequest('get', `/leaderboard?sortBy=${testCase.sortBy}&sortOrder=desc`);
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      
      // Verify sorting
      const [first, second] = response.body;
      expect(first[testCase.sortBy]).toBe(testCase.expectations.firstValue);
      expect(second[testCase.sortBy]).toBe(testCase.expectations.secondValue);
      expect(first[testCase.sortBy]).toBeGreaterThan(second[testCase.sortBy]);
    }
  });

  it('should return 400 for invalid sort field', async () => {
    const response = await makeRequest('get', '/leaderboard?sortBy=invalidField');
    
    verifyResponse(response, 400, {
      error: 'Invalid sort field'
    });
    expect(response.body).toHaveProperty('validFields');
  });

  it('should return 500 for internal server error', async () => {
    // Simulate a database disconnection error
    await mongoose.connection.close();
    
    const response = await makeRequest('get', '/leaderboard');
    
    verifyResponse(response, 500, {
      error: 'Internal Server Error'
    });

    // Reconnect to the database for subsequent tests
    await mongoose.connect(process.env.MONGODB_URI);
  });
});