const request = require('supertest');
const axios = require('axios');
const app = require('./gateway-service'); 

jest.mock('axios');

afterAll(async () => {
    app.close();
});

describe('Gateway Service', () => {
  // Mock responses from external services
  axios.post.mockImplementation((url, data) => {
    if (url.endsWith('/login')) {
      return Promise.resolve({ data: { token: 'mockedToken' } });
    } else if (url.endsWith('/adduser')) {
      return Promise.resolve({ data: { userId: 'mockedUserId' } });
    } else if (url.endsWith('/ask')) {
      return Promise.resolve({ data: { answer: 'llmanswer' } });
    }
  });

  // Test /login endpoint
  it('should forward login request to auth service', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'testpassword' });

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBe('mockedToken');
  });

  // Test /adduser endpoint
  it('should forward add user request to user service', async () => {
    const response = await request(app)
      .post('/adduser')
      .send({ username: 'newuser', password: 'newpassword' });

    expect(response.statusCode).toBe(200);
    expect(response.body.userId).toBe('mockedUserId');
  });

  // Test for /getUserById
  it('should forward getUserById request to user service', async () => {
    const mockUser = { username: 'testuser' };
    axios.post.mockResolvedValueOnce({ data: mockUser });

    const response = await request(app)
      .post('/getUserById')
      .send({ userId: '123' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockUser);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/getUserById'),
      { userId: '123' }
    );
  });

  // Test for /getAllUsernamesWithIds
  it('should forward getAllUsernamesWithIds request to user service', async () => {
    const mockUsernames = { '123': 'user1', '456': 'user2' };
    axios.post.mockResolvedValueOnce({ data: mockUsernames });

    const response = await request(app)
      .post('/getAllUsernamesWithIds')
      .send({ userIds: ['123', '456'] });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockUsernames);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/getAllUsernamesWithIds'),
      { userIds: ['123', '456'] }
    );
  });

  // Test for /users
  it('should forward users GET request to user service', async () => {
    const mockUsers = [{ id: '1', username: 'user1' }, { id: '2', username: 'user2' }];
    axios.get.mockResolvedValueOnce({ data: mockUsers });

    const response = await request(app).get('/users');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockUsers);
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/users'));
  });

  // Test for /leaderboard
  it('should fetch leaderboard and merge with usernames', async () => {
    const mockLeaderboard = [
      { userId: '123', score: 100 },
      { userId: '456', score: 200 }
    ];
    const mockUsernames = { '123': 'user1', '456': 'user2' };

    // Mock leaderboard call
    axios.get.mockResolvedValueOnce({ data: mockLeaderboard });
    // Mock usernames call
    axios.post.mockResolvedValueOnce({ data: mockUsernames });

    const response = await request(app).get('/leaderboard');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([
      { userId: '123', score: 100, username: 'user1' },
      { userId: '456', score: 200, username: 'user2' }
    ]);
    // Verify leaderboard call
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/leaderboard'),
      { params: {} }
    );
    // Verify usernames call
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/getAllUsernamesWithIds'),
      { userIds: ['123', '456'] }
    );
  });

  // Test for leaderboard with query parameters
  it('should forward query parameters to game service for leaderboard', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    axios.post.mockResolvedValueOnce({ data: {} });

    await request(app).get('/leaderboard?sortBy=score&order=desc');

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/leaderboard'),
      { params: { sortBy: 'score', order: 'desc' } }
    );
  });

  // Test /askllm endpoint
  it('should forward askllm request to the llm service', async () => {
    const response = await request(app)
      .post('/askllm')
      .send({ question: 'question', apiKey: 'apiKey', model: 'gemini' });

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe('llmanswer');
  });

  it('should forward question to the question service', async () =>{
    const mockResponse = { data: { question: 'https://example.com/flag.png'} };
      axios.get.mockResolvedValue(mockResponse);
  
      const response = await request(app).get('/question');
  
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
  });

  it('should forward check-answer to the question service', async () => {
    const mockRequestBody = { questionId: 1, answer: 'France' };
    const mockResponse = { data: { correct: true } };

    axios.post.mockResolvedValue(mockResponse);

    const response = await request(app)
      .post('/check-answer')
      .send(mockRequestBody)
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse.data);
  });

   it('should forward fetch-flag-data to the question service', async () => {
    const mockResponse = [
      {
          type: 'flag',
          imageUrl: 'https://example.com/flag-france.png',
          options: ['France'],
          correctAnswer: 'France'
      },
      {
          type: 'flag',
          imageUrl: 'https://example.com/flag-usa.png',
          options: ['United States'],
          correctAnswer: 'United States'
      }
  ];

  // Mock response for the /fetch-flag-data endpoint
  axios.get.mockImplementation((url) => {
    if (url.includes('wikidata.org/sparql')) {
        return Promise.resolve({
            data: {
                results: {
                    bindings: [
                        {
                            country: { value: 'https://www.wikidata.org/entity/Q142' },
                            countryLabel: { value: 'France' },
                            flag: { value: 'https://example.com/flag-france.png' }
                        },
                        {
                            country: { value: 'https://www.wikidata.org/entity/Q30' },
                            countryLabel: { value: 'United States' },
                            flag: { value: 'https://example.com/flag-usa.png' }
                        }
                    ]
                }
            }
        });
    }
});

  // Mock the axios call to Wikidata
  axios.get.mockResolvedValueOnce({
      data: {
          results: {
              bindings: [
                  {
                      country: { value: 'https://www.wikidata.org/entity/Q142' },
                      countryLabel: { value: 'France' },
                      flag: { value: 'https://example.com/flag-france.png' }
                  },
                  {
                      country: { value: 'https://www.wikidata.org/entity/Q30' },
                      countryLabel: { value: 'United States' },
                      flag: { value: 'https://example.com/flag-usa.png' }
                  }
              ]
          }
      }
  });

  // Mock the call to the question service's /fetch-flag-data endpoint
  axios.post.mockResolvedValueOnce({ data: mockResponse });

  const response = await request(app)
      .post('/fetch-flag-data')
      .send();

  expect(response.status).toBe(200);
  expect(response.body).toEqual(mockResponse);
  }); 

});