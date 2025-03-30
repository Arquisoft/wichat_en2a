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

  const user1 = new User({
    username: 'testuser',
    email: 'test@example.com',
    // NOSONAR: Test password only, not a security issue
    password: TEST_PASSWORD // NOSONAR
  });

  const user2 = new User({
    username: 'testuser2',
    email: 'test2@example.com',
    password: TEST_PASSWORD
  });
  
  const savedUser1 = await user1.save();
  const savedUser2 = await user2.save();

  testUserId1 = savedUser1._id.toString();
  testUserId2 = savedUser2._id.toString();
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
    // Crear puntuaciones para dos usuarios
    const scores = [
      { userId: testUserId1, score: 100, isVictory: true },
      { userId: testUserId1, score: 200, isVictory: false },
      { userId: testUserId2, score: 150, isVictory: true },
      { userId: testUserId2, score: 100, isVictory: true }
    ];
    
    await Score.insertMany(scores);
    
    const response = await request(app).get('/leaderboard');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2); 

    // Validar que el usuario con mayor puntuación esté primero
    expect(response.body[0].totalScore).toBeGreaterThan(response.body[1].totalScore); // El primero tiene mayor totalScore
    expect(response.body[0].totalScore).toBe(300); // El total del testUserId1 debe ser 100 + 200 = 300
    expect(response.body[1].totalScore).toBe(250); // El total del testUserId2 debe ser 150 + 100 = 250
  });

  // Test fetching the leaderboard with sorting by gamesPlayed
  it('should return the leaderboard sorted by gamesPlayed', async () => {
    const scores = [
      { userId: testUserId1, score: 100, isVictory: true },
      { userId: testUserId1, score: 200, isVictory: false }, 
      { userId: testUserId2, score: 150, isVictory: true }, 
      { userId: testUserId2, score: 100, isVictory: true }, 
      { userId: testUserId2, score: 50, isVictory: false }  
    ];
    
    await Score.insertMany(scores);
    
    const response = await request(app).get('/leaderboard?sortBy=gamesPlayed&sortOrder=desc');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2); 

    
    expect(response.body[0].gamesPlayed).toBe(3); // El usuario con más juegos jugados
    expect(response.body[1].gamesPlayed).toBe(2); // El otro usuario con menos juegos jugados
  });


  // Test fetching the leaderboard with sorting by winRate
  it('should return the leaderboard sorted by winRate', async () => {
    // Crear puntuaciones para dos usuarios con diferentes victorias y derrotas
    const scores = [
      { userId: testUserId1, score: 100, isVictory: true }, 
      { userId: testUserId1, score: 200, isVictory: false },
      { userId: testUserId2, score: 150, isVictory: true }, 
      { userId: testUserId2, score: 100, isVictory: true }  
    ];
    
    await Score.insertMany(scores);
    
    const response = await request(app).get('/leaderboard?sortBy=winRate&sortOrder=desc');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2); 

    // Validar que el usuario con el mayor winRate esté primero
    // testUserId2 tiene 2 victorias de 2 juegos (winRate = 1)
    // testUserId1 tiene 1 victoria de 2 juegos (winRate = 0.5)
    expect(response.body[0].winRate).toBe(100);  // El winRate de testUserId2 debe ser 100%
    expect(response.body[1].winRate).toBe(50); // El winRate de testUserId1 debe ser 50%
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


