const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./user-model');
const Score = require('./score-model');
const mongoose = require('mongoose');
const TEST_PASSWORD = 'test_password_123'; // NOSONAR

let mongoServer;
let app;
let testUserId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  
  app = require('./game-service');

  const newUser = new User({
    username: 'testuser',
    email: 'test@example.com',
    // NOSONAR: Test password only, not a security issue
    password: TEST_PASSWORD // NOSONAR
  });
  
  const savedUser = await newUser.save();
  testUserId = savedUser._id.toString();
});

afterAll(async () => {
  app.close();
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all scores before testing
  await Score.deleteMany({});
});

describe('Game Service Score Endpoints', () => {
  
  // Test Score Saving (saveScore)
  it('should save a new score on POST /saveScore', async () => {
    const scoreData = {
      userId: testUserId,
      score: 100,
      isVictory: true
    };
    
    const response = await request(app)
      .post('/saveScore')
      .send(scoreData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('userId', testUserId);
    expect(response.body).toHaveProperty('score', 100);
    expect(response.body).toHaveProperty('isVictory', true);
    
    // Check if it was correctly added and saved in the DB
    const scoreInDb = await Score.findOne({ userId: testUserId });
    expect(scoreInDb).not.toBeNull();
    expect(scoreInDb.score).toBe(100);
    expect(scoreInDb.isVictory).toBe(true);
  });
  
  // Test updating a score (this will not be highly needed but it seemed like a good idea to have it)
  it('should update an existing score on PUT /updateScore', async () => {
    // First create a score
    const newScore = new Score({
      userId: testUserId,
      score: 50,
      isVictory: false
    });
    await newScore.save();
    
    // Then update it
    const updateData = {
      userId: testUserId,
      score: 150,
      isVictory: true
    };
    
    const response = await request(app).put('/updateScore').send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('score', 150);
    expect(response.body).toHaveProperty('isVictory', true);
    
    // Check if the score is updated in the database
    const updatedScore = await Score.findOne({ userId: testUserId });
    expect(updatedScore.score).toBe(150);
    expect(updatedScore.isVictory).toBe(true);
  });
  
  // Test getting scores by user
  it('should get all scores for a user on GET /scoresByUser/:userId', async () => {
    // Create various scores for the test user
    const scores = [
      { userId: testUserId, score: 100, isVictory: true },
      { userId: testUserId, score: 200, isVictory: false }
    ];
    
    await Score.insertMany(scores);
    
    const response = await request(app).get(`/scoresByUser/${testUserId}`);
    
    // check only 2 values
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);

    // Validate 1st score
    const firstScore = response.body[0];
    expect(firstScore.userId).toBe(testUserId);
    expect(firstScore.score).toBe(100);
    expect(firstScore.isVictory).toBe(true);

    // Validate 2nd score
    const secondScore = response.body[1];
    expect(secondScore.userId).toBe(testUserId);
    expect(secondScore.score).toBe(200);
    expect(secondScore.isVictory).toBe(false);
  });
  
  // Test error handling for invalid user ID
  it('should return 400 for invalid userId format', async () => {
    const scoreData = {
      userId: 'invalid-id',
      score: 100,
      isVictory: true
    };
    
    const response = await request(app)
      .post('/saveScore')
      .send(scoreData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test error handling for non-existent user scores
  it('should return 404 if no scores found for user', async () => {

    const nonExistentUserId = new mongoose.Types.ObjectId().toString();
    
    const response = await request(app)
      .get(`/scoresByUser/${nonExistentUserId}`);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});

describe('Game Service Leaderboard Endpoint', () => {
  
  // Test fetching the leaderboard without any query parameters
  it('should return the leaderboard sorted by totalScore by default', async () => {
    // Create sample scores for different users
    const scores = [
      { userId: testUserId, score: 100, isVictory: true },
      { userId: testUserId, score: 200, isVictory: false },
      { userId: new mongoose.Types.ObjectId().toString(), score: 150, isVictory: true }
    ];
    
    await Score.insertMany(scores);
    
    const response = await request(app).get('/leaderboard');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2); // Two unique users

    // Validate the leaderboard sorting
    expect(response.body[0].totalScore).toBe(200); // User with higher score should be first
    expect(response.body[1].totalScore).toBe(100);
  });

  // Test fetching the leaderboard with sorting by gamesPlayed
  it('should return the leaderboard sorted by gamesPlayed', async () => {
    const scores = [
      { userId: testUserId, score: 100, isVictory: true },
      { userId: testUserId, score: 200, isVictory: false },
      { userId: new mongoose.Types.ObjectId().toString(), score: 150, isVictory: true },
      { userId: testUserId, score: 50, isVictory: true } // Additional score for the same user
    ];
    
    await Score.insertMany(scores);
    
    const response = await request(app).get('/leaderboard?sortBy=gamesPlayed&sortOrder=desc');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2); // Two unique users

    // Validate the leaderboard sorting
    expect(response.body[0].gamesPlayed).toBe(3); // User with more games played should be first
    expect(response.body[1].gamesPlayed).toBe(1);
  });

  // Test fetching the leaderboard with sorting by winRate
  it('should return the leaderboard sorted by winRate', async () => {
    const scores = [
      { userId: testUserId, score: 100, isVictory: true },
      { userId: testUserId, score: 200, isVictory: false },
      { userId: new mongoose.Types.ObjectId().toString(), score: 150, isVictory: true }
    ];
    
    await Score.insertMany(scores);
    
    const response = await request(app).get('/leaderboard?sortBy=winRate&sortOrder=desc');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2); // Two unique users

    // Validate the leaderboard sorting
    expect(response.body[0].winRate).toBeGreaterThanOrEqual(0); // Ensure winRate is calculated correctly
  });

  // Test error handling for invalid sort field
  it('should return 400 for invalid sort field', async () => {
    const response = await request(app).get('/leaderboard?sortBy=invalidField');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid sort field');
    expect(response.body).toHaveProperty('validFields');
  });

  // Test error handling for internal server error
  it('should return 500 for internal server error', async () => {
    // Simulate an error by disconnecting the database
    await mongoose.connection.close();

    const response = await request(app).get('/leaderboard');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Internal Server Error');

    // Reconnect to the database for subsequent tests
    await mongoose.connect(process.env.MONGODB_URI);
  });
});


