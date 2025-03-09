const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const User = require('./user-model');
const Score = require('./score-model');

let mongoServer;
let app;
let testUsers = [];

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  
  app = require('./leaderboard-service');

  // Create test users
  const users = [
    { username: 'player1', email: 'player1@example.com', password: 'password1' }, //NOSONAR
    { username: 'player2', email: 'player2@example.com', password: 'password2' }, // NOSONAR
    { username: 'player3', email: 'player3@example.com', password: 'password3' } // NOSONAR
  ];
  
  // Save users to db
  for (const userData of users) {
    const user = new User(userData);
    const savedUser = await user.save();
    testUsers.push(savedUser);
  }
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

describe('Leaderboard Service', () => {
  it('should return an empty array when no scores exist', async () => {
    const response = await request(app).get('/leaderboard');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(0);
  });
  
  it('should add scores correctly and return leaderboard', async () => {
    // Assignate the users the scores
    const scores = [
      // Player 1 scores (total: 300, victories: 2/2)
      { userId: testUsers[0]._id, score: 100, isVictory: true },
      { userId: testUsers[0]._id, score: 200, isVictory: true },
      
      // Player 2 scores (total: 150, victories: 1/2)
      { userId: testUsers[1]._id, score: 50, isVictory: false },
      { userId: testUsers[1]._id, score: 100, isVictory: true },
      
      // Player 3 scores (total: 500, victories: 2/2)
      { userId: testUsers[2]._id, score: 250, isVictory: true },
      { userId: testUsers[2]._id, score: 250, isVictory: true }
    ];
    
    await Score.insertMany(scores);
    
    const response = await request(app).get('/leaderboard');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    
    // Check sorting order (by totalScore descending)
    expect(response.body[0].totalScore).toBe(500);
    expect(response.body[0].username).toBe('player3');
    expect(response.body[1].totalScore).toBe(300);
    expect(response.body[1].username).toBe('player1');
    expect(response.body[2].totalScore).toBe(150);
    expect(response.body[2].username).toBe('player2');
    
    // Check games played count
    expect(response.body[0]).toHaveProperty('gamesPlayed', 2);
    expect(response.body[1]).toHaveProperty('gamesPlayed', 2);
    expect(response.body[2]).toHaveProperty('gamesPlayed', 2);
    
    // Calculate average scores (totalScore / gamesPlayed)
    const player1AvgScore = 300 / 2; // 150
    const player2AvgScore = 150 / 2; // 75
    const player3AvgScore = 500 / 2; // 250
     
    
    // Calculate win rate  (victories / gamesPlayed) * 100
    const player1WinRate = (2 / 2) * 100; // 100% 
    const player2WinRate = (1 / 2) * 100; // 50% 
    const player3WinRate = (2 / 2) * 100; // 100%
    
    //order 3 ,1,2
    expect(response.body[0]).toHaveProperty('winRate', player3WinRate);
    expect(response.body[1]).toHaveProperty('winRate', player1WinRate);
    expect(response.body[2]).toHaveProperty('winRate', player2WinRate);
  });
  
  it('should retrieve the game information from the given user', async () => {
    // Create scores for only one user
    const scores = [
      { userId: testUsers[0]._id, score: 100, isVictory: true },
      { userId: testUsers[0]._id, score: 200, isVictory: true }
    ];
    
    await Score.insertMany(scores);
    
    const response = await request(app).get('/leaderboard');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    // Only one user should appear in results
    expect(response.body.length).toBe(1);
    expect(response.body[0].username).toBe('player1');
  });
  
});