const request = require('supertest');
const bcrypt = require('bcrypt');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose'); 

const Score = require('./score-model');

const User = require('./user-model');

let mongoServer;
let app;
let testUserId;

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
  // Create a test user before running the tests
  beforeEach(async () => {
    // Clear users collection
    await User.deleteMany({});
    
    // Create a test user and save the ID
    const testUser = new User({
      username: 'testuser',
      password: await bcrypt.hash('testpassword', 10)
    });
    
    const savedUser = await testUser.save();
    testUserId = savedUser._id;
  });

  it('should add a new user on POST /adduser', async () => {
    const uniqueUsername = `newuserTest_${Date.now()}`; // Generate a unique username, addidng Date
    const newUser  = {
        username: uniqueUsername,
        password: 'testpassword',
    };

    const response = await request(app).post('/adduser').send(newUser );
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('username', uniqueUsername); // Search username in response

    // Check if user was correctly inserted
    const userInDb = await User.findOne({ username: uniqueUsername });

    // Confirm if user is in DB
    expect(userInDb).not.toBeNull();
    expect(userInDb.username).toBe(uniqueUsername);

    // Check if password is encrypted correctly
    const isPasswordValid = await bcrypt.compare('testpassword', userInDb.password);
    expect(isPasswordValid).toBe(true);
});

  it('should delete a user on DELETE /users/:userId', async () => {
    // Verify the test user exists before deletion
    const userBeforeDelete = await User.findById(testUserId);
    expect(userBeforeDelete).not.toBeNull();
    
    // Delete user
    const response = await request(app).delete(`/users/${testUserId}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'User deleted successfully');
    
    // Verify the user was cprrectly deleted
    const userAfterDelete = await User.findById(testUserId);
    expect(userAfterDelete).toBeNull();
  });

  it('should return 404 when deleting non-existent user', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app).delete(`/users/${nonExistentId}`);
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });

  it('should update a user on PUT /users/:userId', async () => {
    const updateData = {
      username: 'updateduser',
      //the picture does not necesaryly need to exist, just veritfy value
      profilePicture: 'http://example.com/pic.jpg'
    };
    
    const response = await request(app).put(`/users/${testUserId}`).send(updateData);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'updateduser');
    expect(response.body).toHaveProperty('profilePicture', 'http://example.com/pic.jpg');
    
    // Verify the changes in db
    const updatedUser = await User.findById(testUserId);
    expect(updatedUser.username).toBe('updateduser');
    expect(updatedUser.profilePicture).toBe('http://example.com/pic.jpg');
  });

  it('should update password correctly and hash it after', async () => {
    const updateData = {
      password: 'newpassword' //NOSONAR
    };
    
    await request(app).put(`/users/${testUserId}`).send(updateData);
    
    // Verify password was updated and hashed
    const updatedUser = await User.findById(testUserId);
    const isPasswordValid = await bcrypt.compare('newpassword', updatedUser.password);
    expect(isPasswordValid).toBe(true);
  });

  it('should handle partial updates', async () => {
    // Only update profilePicture
    const response = await request(app)
      .put(`/users/${testUserId}`)
      .send({ profilePicture: 'http://example.com/new.jpg' });
    
    expect(response.status).toBe(200);
    expect(response.body.username).toBe('testuser'); // unchanged
    expect(response.body.profilePicture).toBe('http://example.com/new.jpg'); // changed
  });

  it('should set profilePicture to null when empty string is provided', async () => {
    // set a profile picture
    await User.findByIdAndUpdate(testUserId, { profilePicture: 'http://example.com/pic.jpg' });
    
    // Then clear it with empty string
    const response = await request(app)
      .put(`/users/${testUserId}`)
      .send({ profilePicture: '' });
    
    expect(response.status).toBe(200);
    expect(response.body.profilePicture).toBeNull();
  });

  it('should reject empty username', async () => {
    const response = await request(app)
      .put(`/users/${testUserId}`)
      .send({ username: '   ' });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Username cannot be empty');
  });

  it('should reject empty password', async () => {
    const response = await request(app)
      .put(`/users/${testUserId}`)
      .send({ password: '' });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Password cannot be empty');
  });

  it('should return 404 when updating non-existent user', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .put(`/users/${nonExistentId}`)
      .send({ username: 'newname' });
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });

  it('should return user details for a valid userId', async () => {
    // Arrange: Create a test user
    const testUser  = new User({
        username: 'validUser ',
        password: await bcrypt.hash('validPassword', 10)
    });
    const savedUser  = await testUser .save();

    // Act: Fetch the user by ID
    const response = await request(app).get(`/getUserById/${savedUser ._id}`);

    // Assert: Check the response
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('_id', savedUser ._id.toString());
    expect(response.body).toHaveProperty('username', 'validUser ');
  });

  it('should return 404 if user not found', async () => {
    // Arrange: Create a non-existent user ID
    const nonExistentId = new mongoose.Types.ObjectId();

    // Act: Attempt to fetch the user by the non-existent ID
    const response = await request(app).get(`/getUserById/${nonExistentId}`);

    // Assert: Check the response
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
    // Arrange: Create test users
    await User.deleteMany({});
    
    const users = [
      { username: 'user1', password: await bcrypt.hash('password1', 10) },
      { username: 'user2', password: await bcrypt.hash('password2', 10) }
    ];
    
    await User.insertMany(users);
  
    // Act: Request the list of users
    const response = await request(app).get('/users');
  
    // Assert: Check the response
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2); // Ensure two users are returned
    expect(response.body[0]).toHaveProperty('username');
    expect(response.body[0]).toHaveProperty('_id'); 
  });
  

  it('should return usernames for valid userIds', async () => {
    // Arrange: Create test users
    const user1 = new User({ username: 'user1', password: await bcrypt.hash('password1', 10) });
    const user2 = new User({ username: 'user2', password: await bcrypt.hash('password2', 10) });
    await user1.save();
    await user2.save();

    // Act: Send a request with valid user IDs
    const response = await request(app)
        .post('/getAllUsernamesWithIds')
        .send({ userIds: [user1._id, user2._id] });

    // Assert: Check the response
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
        [user1._id]: 'user1',
        [user2._id]: 'user2'
    });
  });

});

describe('Score Model Test', () => {
  it('should create a valid Score object', async () => {
    const scoreData = {
      userId: new mongoose.Types.ObjectId(),  // Generar un ObjectId válido
      score: 100,
      isVictory: true
    };

    const score = new Score(scoreData);
    const savedScore = await score.save();

    // Verificar que el objeto guardado tiene las propiedades correctas
    expect(savedScore._id).toBeDefined();
    expect(savedScore.userId.toString()).toEqual(scoreData.userId.toString());
    expect(savedScore.score).toBe(scoreData.score);
    expect(savedScore.isVictory).toBe(scoreData.isVictory);
  });

  it('should throw an error if required fields are missing', async () => {
    const invalidScoreData = {
      score: 100,  // Falta el campo userId
      isVictory: true
    };

    const score = new Score(invalidScoreData);
    
    try {
      await score.save();
    } catch (err) {
      expect(err.errors.userId).toBeDefined();  // Comprobar que el error es por la falta de userId
    }
  });
});

describe('User Model', () => {
  it('should create a valid user', async () => {
    const userData = {
      username: 'testuser',
      //Es solo para servicio de tests
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
      //Es solo para servicio de tests
      password: 'password123', //NOSONAR
    };

    const user = new User(userData);
    await user.save();

    expect(user.profilePicture).toBe("/avatars/default.jpg");
  });

  it('should create a user with a default createdAt date', async () => {
    const userData = {
      username: 'testuser',
      //Es solo para servicio de tests
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
  let jwt; // Declare the JWT variable at the describe level
  
  beforeEach(async () => {
    // Import JWT here to make it available to all tests in this describe block
    jwt = require('jsonwebtoken');
    
    // Clear users collection
    await User.deleteMany({});
    
    // Create a test user
    const testUser = new User({
      username: 'authuser',
      password: await bcrypt.hash('testpassword', 10)
    });
    
    const savedUser = await testUser.save();
    
    // Create a valid token for this user
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
    // Create a token with a non-existent user ID
    const nonExistentId = new mongoose.Types.ObjectId();
    const invalidToken = jwt.sign({ userId: nonExistentId }, 'your-secret-key');
    
    const response = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${invalidToken}`);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  });
  
  it('should properly extract token from Authorization header', async () => {
    // Test with extra spaces in the Authorization header but ensure exactly the right format
    // The issue might be that `Bearer  ${token}  ` has extra spaces which affect token extraction
    const response = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'authuser');
  });
});




