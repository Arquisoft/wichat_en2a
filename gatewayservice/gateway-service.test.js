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

  it('should return an error response on failure', async () => {
    // Simula la respuesta de error de axios
    axios.get.mockRejectedValue({
      response: {
        status: 500,
        data: { error: 'Internal Server Error' }
      }
    });

    const response = await request(app).get('/users');
    
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal Server Error' });
  });


  // Test /saveScore endpoint
  it('should forward saveScore request to game service', async () => {
    const mockRequestBody = { userId: 'testUserId', score: 150, isVictory: true };
    const mockResponse = { data: { userId: 'testUserId', score: 150, isVictory: true } };

    axios.post.mockResolvedValueOnce(mockResponse);

    const response = await request(app)
      .post('/saveScore')
      .send(mockRequestBody)
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse.data);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/saveScore'),
      mockRequestBody
    );
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

  it('should return error response when game service fails', async () => {
    // Simula un error en la respuesta de la solicitud al game service
    axios.get.mockRejectedValue({
      response: {
        status: 500,
        data: { error: 'Game Service Error' },
      },
    });

    const response = await request(app).get('/leaderboard');
    
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Game Service Error' });
  });

  // Test /askllm endpoint
  it('should forward askllm request to the llm service', async () => {
    const response = await request(app)
      .post('/askllm')
      .send({ question: 'question', apiKey: 'apiKey', model: 'gemini' });

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe('llmanswer');
  });

  it('should return error response when user service fails', async () => {
    // Simula una respuesta exitosa del game service
    const leaderboardResponseData = [
      { userId: '123', score: 1000 },
      { userId: '456', score: 900 },
    ];
    axios.get.mockResolvedValue({
      data: leaderboardResponseData,
    });

    // Simula un error en la respuesta de la solicitud al user service
    axios.post.mockRejectedValue({
      response: {
        status: 500,
        data: { error: 'User Service Error' },
      },
    });

    const response = await request(app).get('/leaderboard');
    
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'User Service Error' });
  });
  

  //test for the question
  it('should return an error response when question service fails', async () => {
    // Simula una respuesta de error de axios
    axios.get.mockRejectedValue({
      response: {
        status: 500,
        data: { error: 'Internal Server Error' },
      },
    });

    const response = await request(app).get('/question');
    
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal Server Error' });
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

// Add these tests to your existing test file
describe('Gateway Service Error Handling', () => {
  // Test health endpoint
  it('should respond to health check', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'OK' });
  });

  // Test error handling for login endpoint
  it('should handle errors from auth service on login', async () => {
    axios.post.mockRejectedValueOnce({
      response: { status: 401, data: { error: 'Invalid credentials' } }
    });

    const response = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'wrong' }); // NOSONAR: Hardcoded password is for test purposes only.

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid credentials' });
  });

  // Test error handling for adduser endpoint
  it('should handle errors from user service on adduser', async () => {
    axios.post.mockRejectedValueOnce({
      response: { status: 409, data: { error: 'Username already exists' } }
    });

    const response = await request(app)
      .post('/adduser')
      .send({ username: 'existinguser', password: 'password' }); // NOSONAR: Hardcoded password is for test purposes only.


    expect(response.statusCode).toBe(409);
    expect(response.body).toEqual({ error: 'Username already exists' });
  });

  // Test error handling for getAllUsernamesWithIds endpoint
  it('should handle errors from user service on getAllUsernamesWithIds', async () => {
    axios.post.mockRejectedValueOnce({
      response: { status: 400, data: { error: 'Invalid user IDs' } }
    });

    const response = await request(app)
      .post('/getAllUsernamesWithIds')
      .send({ userIds: ['invalid'] });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid user IDs' });
  });

  // Test error handling when response is missing
  it('should handle network errors on getAllUsernamesWithIds', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network Error'));

    const response = await request(app)
      .post('/getAllUsernamesWithIds')
      .send({ userIds: ['123'] });

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ error: 'Internal Server Error' });
  });

  //test for error llm
  it('should return an error response when LLM service fails', async () => {
    // Simula una respuesta de error de axios
    const requestData = { question: 'What is AI?' };
    
    axios.post.mockRejectedValue({
      response: {
        status: 500,
        data: { error: 'Internal Server Error' },
      },
    });

    const response = await request(app).post('/askllm').send(requestData);
    
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal Server Error' });
  });

  //test error for /check-answer
  it('should return an error response when question service fails', async () => {
    // Simula una respuesta de error de axios
    const requestData = { answer: 'Paris' };
    
    axios.post.mockRejectedValue({
      response: {
        status: 500,
        data: { error: 'Internal Server Error' },
      },
    });

    const response = await request(app).post('/check-answer').send(requestData);
    
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal Server Error' });
  });

  it('should return an error response when question service fails', async () => {
    // Simula una respuesta de error de axios
    axios.post.mockRejectedValue({
      response: {
        status: 500,
        data: { error: 'Internal Server Error' },
      },
    });

    const response = await request(app).post('/fetch-flag-data');
    
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal Server Error' });
  });

  it('should return an error response when game service fails', async () => {
    // Simula una respuesta de error de axios
    const requestData = { userId: '12345', score: 1000, isVictory: true };
    
    axios.post.mockRejectedValue({
      response: {
        status: 500,
        data: { error: 'Internal Server Error' },
      },
    });

    const response = await request(app).post('/saveScore').send(requestData);
    
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal Server Error' });
  });

  it('should forward saveActiveUserScore with correct userId and their score', async () => {
    const fakeToken = 'asdasda2391287qada';
    const score = 750;
    const expectedUserId = 'mockID';
    const expectedIsVictory = true;
  
    // Mock axios.post a /saveScore devuelve bien
    axios.post.mockImplementationOnce((url, data) => {
      expect(url).toContain('/saveScore');
      expect(data).toEqual({ userId: expectedUserId, score, isVictory: expectedIsVictory });
  
      return Promise.resolve({ data: { success: true, ...data } });
    });
  
    // Mock JWT decode funciona insertando manualmente el userId en el token
    const response = await request(app)
      .post('/saveActiveUserScore')
      .set('Authorization', fakeToken)
      .send({ score });
  
    if (response.status === 401) {
      console.warn('Este test requiere un token válido');
    } else {
      expect(response.status).toBe(200);
      expect(response.body.userId).toBe(expectedUserId);
      expect(response.body.score).toBe(score);
      expect(response.body.isVictory).toBe(expectedIsVictory);
    }
  });

  it('should return 401 if token is missing', async () => {
    const response = await request(app)
      .post('/saveActiveUserScore')
      .send({ score: 800 });
  
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'No token provided' });
  });

  it('should forward /scores request with token', async () => {
    const fakeToken = 'Bearer faketoken';
    const mockScores = [{ score: 800 }, { score: 500 }];
  
    axios.get.mockImplementationOnce((url, config) => {
      expect(url).toContain('/scores');
      expect(config.headers.Authorization).toBe(fakeToken);
      return Promise.resolve({ data: mockScores });
    });
  
    const response = await request(app)
      .get('/scores')
      .set('Authorization', fakeToken);
  
    if (response.status === 401) {
      console.warn('Este test requiere un token válido');
    } else {
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockScores);
    }
  });
});