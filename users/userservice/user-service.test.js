const request = require('supertest');
const bcrypt = require('bcrypt');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const Score = require('./score-model');
const User = require('./user-model');

let mongoServer;
let app;
let testUserId;
let adminUserId;
let adminToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  app = require('./user-service');
});

afterAll(async () => {
  app.close();
  await mongoServer.stop();
});

describe('User Service', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Score.deleteMany({});

    // Create a test user and save the ID
    const testUser = new User({
      username: 'testuser',
      password: await bcrypt.hash('testpassword', 10)
    });
    const savedUser = await testUser.save();
    testUserId = savedUser._id;

    // Create an admin user and get a token for admin-protected endpoints
    const adminUser = new User({
      username: 'adminuser',
      password: await bcrypt.hash('adminpassword', 10),
      isAdmin: true
    });
    const savedAdmin = await adminUser.save();
    adminUserId = savedAdmin._id;
    const jwt = require('jsonwebtoken');
    adminToken = `Bearer ${jwt.sign({ userId: adminUserId }, 'your-secret-key')}`;
  });

  it('should add a new user on POST /adduser', async () => {
    const uniqueUsername = `newuserTest_${Date.now()}`;
    const newUser = {
      username: uniqueUsername,
      password: 'testpassword',
    };

    const response = await request(app).post('/adduser').send(newUser);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('username', uniqueUsername);

    const userInDb = await User.findOne({ username: uniqueUsername });
    expect(userInDb).not.toBeNull();
    expect(userInDb.username).toBe(uniqueUsername);

    const isPasswordValid = await bcrypt.compare('testpassword', userInDb.password);
    expect(isPasswordValid).toBe(true);
  });

  it('should delete a user on DELETE /users/:userId', async () => {
    const userBeforeDelete = await User.findById(testUserId);
    expect(userBeforeDelete).not.toBeNull();

    const response = await request(app)
      .delete(`/users/${testUserId}`)
      .set('Authorization', adminToken);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'User deleted successfully');

    const userAfterDelete = await User.findById(testUserId);
    expect(userAfterDelete).toBeNull();
  });

  it('should delete all scores associated with a user when the user is deleted', async () => {
    const score1 = new Score({ userId: testUserId, score: 100, isVictory: true });
    const score2 = new Score({ userId: testUserId, score: 200, isVictory: false });
    await score1.save();
    await score2.save();

    const response = await request(app)
      .delete(`/users/${testUserId}`)
      .set('Authorization', adminToken);

    expect(response.status).toBe(200);

    const scores = await Score.find({ userId: testUserId });
    expect(scores.length).toBe(0);
  });

  it('should return 404 when deleting non-existent user', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .delete(`/users/${nonExistentId}`)
      .set('Authorization', adminToken);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });

  it('should update a user on PUT /users/:userId', async () => {
    const updateData = {
      username: 'updateduser',
      profilePicture: 'http://example.com/pic.jpg'
    };

    const response = await request(app)
      .put(`/users/${testUserId}`)
      .set('Authorization', adminToken)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'updateduser');
    expect(response.body).toHaveProperty('profilePicture', 'http://example.com/pic.jpg');

    const updatedUser = await User.findById(testUserId);
    expect(updatedUser.username).toBe('updateduser');
    expect(updatedUser.profilePicture).toBe('http://example.com/pic.jpg');
  });

  it('should update password correctly and hash it after', async () => {
    const updateData = { password: 'newpassword' }; //NOSONAR

    await request(app)
      .put(`/users/${testUserId}`)
      .set('Authorization', adminToken)
      .send(updateData);

    const updatedUser = await User.findById(testUserId);
    const isPasswordValid = await bcrypt.compare('newpassword', updatedUser.password);
    expect(isPasswordValid).toBe(true);
  });

  it('should handle partial updates', async () => {
    const response = await request(app)
      .put(`/users/${testUserId}`)
      .set('Authorization', adminToken)
      .send({ profilePicture: 'http://example.com/new.jpg' });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('testuser');
    expect(response.body.profilePicture).toBe('http://example.com/new.jpg');
  });

  it('should set profilePicture to null when empty string is provided', async () => {
    await User.findByIdAndUpdate(testUserId, { profilePicture: 'http://example.com/pic.jpg' });

    const response = await request(app)
      .put(`/users/${testUserId}`)
      .set('Authorization', adminToken)
      .send({ profilePicture: '' });

    expect(response.status).toBe(200);
    expect(response.body.profilePicture).toBeNull();
  });

  it('should reject empty username', async () => {
    const response = await request(app)
      .put(`/users/${testUserId}`)
      .set('Authorization', adminToken)
      .send({ username: '   ' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Username cannot be empty');
  });

  it('should reject empty password', async () => {
    const response = await request(app)
      .put(`/users/${testUserId}`)
      .set('Authorization', adminToken)
      .send({ password: '' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Password cannot be empty');
  });

  it('should return 404 when updating non-existent user', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .put(`/users/${nonExistentId}`)
      .set('Authorization', adminToken)
      .send({ username: 'newname' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });

  it('should update isAdmin field for a user', async () => {
    const response = await request(app)
      .put(`/users/${testUserId}`)
      .set('Authorization', adminToken)
      .send({ isAdmin: true });

    expect(response.status).toBe(200);
    expect(response.body.isAdmin).toBe(true);

    const response2 = await request(app)
      .put(`/users/${testUserId}`)
      .set('Authorization', adminToken)
      .send({ isAdmin: false });

    expect(response2.status).toBe(200);
    expect(response2.body.isAdmin).toBe(false);
  });

  it('should coerce isAdmin to boolean on update', async () => {
    const response = await request(app)
      .put(`/users/${testUserId}`)
      .set('Authorization', adminToken)
      .send({ isAdmin: "notaboolean" });

    expect(response.status).toBe(200);
    expect(response.body.isAdmin).toBe(true);
  });

  it('should not fail when deleting a user with no scores', async () => {
    const user = new User({
      username: 'noscoreuser',
      password: await bcrypt.hash('password', 10)
    });
    await user.save();

    const response = await request(app)
      .delete(`/users/${user._id}`)
      .set('Authorization', adminToken);

    expect(response.status).toBe(200);
  });

  it('should return isAdmin as boolean in GET /users', async () => {
    const user = new User({
      username: 'adminbool',
      password: await bcrypt.hash('password', 10),
      isAdmin: true
    });
    await user.save();

    const response = await request(app).get('/users');
    expect(response.status).toBe(200);
    const found = response.body.find(u => u.username === 'adminbool');
    expect(typeof found.isAdmin).toBe('boolean');
    expect(found.isAdmin).toBe(true);
  });

  it('should return user details for a valid userId', async () => {
    const testUser = new User({
      username: 'validUser',
      password: await bcrypt.hash('validPassword', 10)
    });
    const savedUser = await testUser.save();

    const response = await request(app).get(`/getUserById/${savedUser._id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('_id', savedUser._id.toString());
    expect(response.body).toHaveProperty('username', 'validUser');
  });

  it('should return 404 if user not found', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app).get(`/getUserById/${nonExistentId}`);
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });

  it('should return 500 if the userId is invalid', async () => {
    const invalidId = 'not-a-valid-objectid';
    const response = await request(app).get(`/getUserById/${invalidId}`);
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });

  it('should fetch all users from the database', async () => {
    await User.deleteMany({});
    const users = [
      { username: 'user1', password: await bcrypt.hash('password1', 10) },
      { username: 'user2', password: await bcrypt.hash('password2', 10) }
    ];
    await User.insertMany(users);

    const response = await request(app).get('/users');
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(2);
    expect(response.body[0]).toHaveProperty('username');
    expect(response.body[0]).toHaveProperty('_id');
  });

  it('should return usernames for valid userIds', async () => {
    const user1 = new User({ username: 'user1', password: await bcrypt.hash('password1', 10) });
    const user2 = new User({ username: 'user2', password: await bcrypt.hash('password2', 10) });
    await user1.save();
    await user2.save();

    const response = await request(app)
      .post('/getAllUsernamesWithIds')
      .send({ userIds: [user1._id, user2._id] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      [user1._id]: 'user1',
      [user2._id]: 'user2'
    });
  });

  it('should return 409 when adding a user with an existing username', async () => {
    const newUser = { username: 'testuser', password: 'anotherpassword' }; //NOSONAR
    const response = await request(app).post('/adduser').send(newUser);
    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error');
  });
  
  it('should return 400 when adding a user with missing fields', async () => {
    const response = await request(app).post('/adduser').send({ username: 'nousername' });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  it('should return 400 when updating a user with invalid ObjectId', async () => {
    const response = await request(app)
      .put('/users/notavalidid')
      .set('Authorization', adminToken)
      .send({ username: 'fail' });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  it('should return 400 when deleting a user with invalid ObjectId', async () => {
    const response = await request(app)
      .delete('/users/notavalidid')
      .set('Authorization', adminToken);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  it('should return 400 when updating a user with no fields', async () => {
    const response = await request(app)
      .put(`/users/${testUserId}`)
      .set('Authorization', adminToken)
      .send({});
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  it('should return 400 when /getAllUsernamesWithIds is called with missing userIds', async () => {
    const response = await request(app)
      .post('/getAllUsernamesWithIds')
      .send({});
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});

describe('Score Model Test', () => {
  it('should create a valid Score object', async () => {
    const scoreData = {
      userId: new mongoose.Types.ObjectId(),
      score: 100,
      isVictory: true
    };

    const score = new Score(scoreData);
    const savedScore = await score.save();

    expect(savedScore._id).toBeDefined();
    expect(savedScore.userId.toString()).toEqual(scoreData.userId.toString());
    expect(savedScore.score).toBe(scoreData.score);
    expect(savedScore.isVictory).toBe(scoreData.isVictory);
  });

  it('should throw an error if required fields are missing', async () => {
    const invalidScoreData = {
      score: 100,
      isVictory: true
    };

    const score = new Score(invalidScoreData);

    try {
      await score.save();
    } catch (err) {
      expect(err.errors.userId).toBeDefined();
    }
  });
});

describe('User Model', () => {
  it('should create a valid user', async () => {
    const userData = {
      username: 'testuser',
      password: 'password123', //NOSONAR
    };

    const user = new User(userData);
    await user.save();

    expect(user._id).toBeDefined();
    expect(user.username).toBe(userData.username);
    expect(user.password).toBe(userData.password);
    expect(user.profilePicture).toBe("/avatars/default.jpg");
    expect(user.createdAt).toBeDefined();
  });

  it('should set the default value of profilePicture to /avatars/default.jpg', async () => {
    const userData = {
      username: 'testuser',
      password: 'password123', //NOSONAR
    };

    const user = new User(userData);
    await user.save();

    expect(user.profilePicture).toBe("/avatars/default.jpg");
  });

  it('should create a user with a default createdAt date', async () => {
    const userData = {
      username: 'testuser',
      password: 'password123', //NOSONAR
    };

    const user = new User(userData);
    await user.save();

    expect(user.createdAt).toBeDefined();
    expect(user.createdAt instanceof Date).toBe(true);
  });
});

describe('Authentication and /me endpoint', () => {
  let token;
  let jwt;

  beforeEach(async () => {
    jwt = require('jsonwebtoken');
    await User.deleteMany({});

    const testUser = new User({
      username: 'authuser',
      password: await bcrypt.hash('testpassword', 10)
    });

    const savedUser = await testUser.save();
    token = jwt.sign({ userId: savedUser._id }, 'your-secret-key');
  });

  it('should return user details when valid token is provided to /me', async () => {
    const response = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'authuser');
    expect(response.body).toHaveProperty('_id');
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app).get('/me');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'No token provided');
  });

  it('should return 401 when invalid token format is provided', async () => {
    const response = await request(app)
      .get('/me')
      .set('Authorization', 'InvalidTokenFormat');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid token');
  });

  it('should return 401 when token is invalid', async () => {
    const response = await request(app)
      .get('/me')
      .set('Authorization', 'Bearer invalidtoken123');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid token');
  });

  it('should return 404 when user ID in token no longer exists', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const invalidToken = jwt.sign({ userId: nonExistentId }, 'your-secret-key');

    const response = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${invalidToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });

  it('should properly extract token from Authorization header', async () => {
    const response = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'authuser');
  });
});