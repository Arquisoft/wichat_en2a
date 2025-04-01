const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./auth-model');
let mongoServer;
let app;

// Test user
const user = {
  username: 'testuser',
  password: 'testpassword', //NOSONAR
};

async function addUser(user) {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  const newUser = new User({
    username: user.username,
    password: hashedPassword,
  });
  await newUser.save();
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  app = require('./auth-service');
  // Load database with initial conditions
  await addUser(user);
});

afterAll(async () => {
  await app.close();
  await mongoServer.stop();
});

describe('Auth Service', () => {
  it('Should perform a login operation /login', async () => {
    const response = await request(app).post('/login').send(user);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'testuser');
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('userId');
    expect(response.body).toHaveProperty('createdAt');
    
    // Verify JWT token
    const decoded = jwt.verify(response.body.token, 'your-secret-key');
    expect(decoded).toHaveProperty('userId');
  });

  it('Should return 401 for invalid credentials', async () => {
    const invalidUser = {
      username: 'testuser',
      password: 'wrongpassword' //NOSONAR
    };
    
    const response = await request(app).post('/login').send(invalidUser);
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid credentials');
  });

  it('Should validate required fields', async () => {
    // Missing password
    const missingPasswordUser = {
      username: 'testuser'
    };
    
    const response = await request(app).post('/login').send(missingPasswordUser);
    expect(response.status).toBe(400); //400 if a field is missing
  });

  it('Should validate field length with express-validator', async () => {
    // Username too short
    const shortUsername = {
      username: 'te',
      password: 'testpassword' //NOSONAR
    };
    
    const response = await request(app).post('/login').send(shortUsername);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('Should handle non-existent user', async () => {
    const nonExistentUser = {
      username: 'nonexistent',
      password: 'testpassword' //NOSONAR
    };
    
    const response = await request(app).post('/login').send(nonExistentUser);
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid credentials');
  });
});