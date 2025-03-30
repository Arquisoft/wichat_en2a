const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./user-model'); 
let mongoServer;
let app;

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

describe('Error Handling for User Endpoints', () => {

  let validUserId;

  beforeEach(async () => {
    await User.deleteMany({});

    const testUser = new User({ username: 'testuser', password: 'hashedpassword' });
    const savedUser = await testUser.save();
    validUserId = savedUser._id;
  });

  describe('GET /getUserById/:userId', () => {
    it('should return 400 for invalid userId format', async () => {
      const response = await request(app).get('/getUserById/invalidID');
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid userId format' });
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/getUserById/${nonExistentId}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });

    it('should return 500 if an unexpected error occurs', async () => {
      jest.spyOn(User, 'findById').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const response = await request(app).get(`/getUserById/${validUserId}`);
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal Server Error' });

      jest.restoreAllMocks();
    });
  });

  describe('POST /getAllUsernamesWithIds', () => {
    it('should return 400 if userIds is not an array', async () => {
      const response = await request(app).post('/getAllUsernamesWithIds').send({ userIds: 'notAnArray' });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid userIds array' });
    });

    it('should return 400 if userIds array is empty', async () => {
      const response = await request(app).post('/getAllUsernamesWithIds').send({ userIds: [] });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid userIds array' });
    });

    it('should return 400 if no valid userIds are provided', async () => {
      const response = await request(app).post('/getAllUsernamesWithIds').send({ userIds: ['invalidID'] });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'No valid user IDs provided' });
    });

    it('should return 500 if an unexpected error occurs', async () => {
      jest.spyOn(User, 'find').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const response = await request(app).post('/getAllUsernamesWithIds').send({ userIds: [validUserId] });
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal Server Error' });

      jest.restoreAllMocks();
    });
  });

});
