const request = require('supertest');
const bcrypt = require('bcrypt');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose'); 

const User = require('./user-model');

let mongoServer;
let app;
let testUserId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
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
    const newUser = {
      username: 'testuser',
      password: 'testpassword',
    };

    const response = await request(app).post('/adduser').send(newUser);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'testuser');

    // Check if the user is inserted into the database
    const userInDb = await User.findOne({ username: 'testuser' });

    // Assert that the user exists in the database
    expect(userInDb).not.toBeNull();
    expect(userInDb.username).toBe('testuser');

    // Assert that the password is encrypted
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
});
