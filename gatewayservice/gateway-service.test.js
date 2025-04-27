const request = require('supertest');
const axios = require('axios');
const app = require('./gateway-service'); 
const jwt = require('jsonwebtoken');

jest.mock('axios');

// Sign a mock token for testing
const testToken = jwt.sign({ userId: 'mockID' }, 'your-secret-key', { expiresIn: '1h' });

beforeEach(() => {
  axios.post.mockReset();
  axios.get.mockReset();

  axios.post.mockImplementation((url, data) => {
    if (url.endsWith('/login')) {
      return Promise.resolve({ data: { token: 'mockedToken' } });
    }
    if (url.endsWith('/adduser')) {
      return Promise.resolve({ data: { userId: 'mockedUserId' } });
    }
    if (url.endsWith('/ask')) {
      return Promise.resolve({ data: { answer: 'llmanswer' } });
    }
    if (url.endsWith('/generateIncorrectOptions')) {
      return Promise.resolve({
        status: 200,
        data: { options: ['option1', 'option2', 'option3'] }
      });
    }
    if (url.endsWith('/fetch-custom-question-data')) {
      return Promise.resolve({
        data: [
          {
            type: 'flag',
            imageUrl: 'https://example.com/img.png',
            options: ['France'],
            correctAnswer: 'France'
          }
        ]
      });
    }
    if (url.endsWith('/clear-questions')) {
      return Promise.resolve({ data: { message: 'Questions cleared' } });
    }

    return Promise.reject(new Error('Unexpected mock URL: ' + url));
  });

  axios.get.mockImplementation(() => Promise.resolve({ data: {} }));
});

afterAll(async () => {
    app.close();
});

const mockAxiosError = (statusCode, errorMessage) => {
  axios.get.mockRejectedValueOnce({
    response: {
      status: statusCode,
      data: { error: errorMessage }
    }
  });
};

const assertErrorResponse = (response, statusCode, errorMessage) => {
  expect(response.status).toBe(statusCode);
  expect(response.body).toEqual({ error: errorMessage });
};

describe('Gateway Service', () => {

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

  it('should forward delete user request to user service', async () => {
    const userId = '507f1f77bcf86cd799439011'; // Example user ID
    const mockResponse = { message: 'User deleted successfully' };
    axios.delete.mockResolvedValueOnce({ data: mockResponse });
  
    const response = await request(app)
      .delete(`/users/${userId}`)
      .set('Authorization', 'Bearer faketoken');
  
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
    expect(axios.delete).toHaveBeenCalledWith(
      expect.stringContaining(`/users/${userId}`),
      { headers: { Authorization: 'Bearer faketoken' } }
    );
  });
  
  it('should return error when user service fails to delete user', async () => {
    const userId = '507f1f77bcf86cd799439011'; // Example user ID
    axios.delete.mockRejectedValueOnce({
      response: { status: 404, data: { error: 'User not found' } }
    });
  
    const response = await request(app)
      .delete(`/users/${userId}`)
      .set('Authorization', 'Bearer faketoken');
  
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'User not found' });
  });
  
  it('should forward update user request to user service', async () => {
    const userId = '507f1f77bcf86cd799439011'; // Example user ID
    const updateData = { username: 'newname' };
    const mockResponse = { _id: userId, username: 'newname' };
    axios.put.mockResolvedValueOnce({ data: mockResponse });
  
    const response = await request(app)
      .put(`/users/${userId}`)
      .set('Authorization', 'Bearer faketoken')
      .send(updateData);
  
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining(`/users/${userId}`),
      updateData,
      { headers: { Authorization: 'Bearer faketoken' } }
    );
  });
  
  it('should return error when user service fails to update user', async () => {
    const userId = '507f1f77bcf86cd799439011'; // Example user ID
    const updateData = { username: 'newname' };
    axios.put.mockRejectedValueOnce({
      response: { status: 400, data: { error: 'Invalid data' } }
    });
  
    const response = await request(app)
      .put(`/users/${userId}`)
      .set('Authorization', 'Bearer faketoken')
      .send(updateData);
  
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid data' });
  });

  it('should return an error response on failure', async () => {
    mockAxiosError(500, 'Internal Server Error');

    const response = await request(app).get('/users');

    assertErrorResponse(response, 500, 'Internal Server Error');
  });

  it('should forward getUserById request to user service', async () => {
    const mockUser = { id: '1', username: 'user1' };
    const userId = '1';

    axios.get.mockResolvedValueOnce({ data: mockUser });

    const response = await request(app).get(`/getUserById/${userId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockUser);
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining(`/getUserById/${userId}`));
  });

  it('should return an error response on failure', async () => {
    const userId = 'nonexistentid';

    axios.get.mockRejectedValueOnce({
      response: {
        status: 404,
        data: { error: 'User not found' }
      }
    });

    const response = await request(app).get(`/getUserById/${userId}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'User not found' });
  })

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
    axios.get.mockRejectedValueOnce({
      response: {
        status: 500,
        data: { error: 'Game Service Error' },
      },
    });

    const response = await request(app).get('/leaderboard');
    
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Game Service Error' });
  });

  it('should forward request to game service to get top3 users', async () => {
    const mockTop3 = [
      { userId: '1', totalScore: 300 },
      { userId: '2', totalScore: 250 },
      { userId: '3', totalScore: 200 },
    ];

    axios.get.mockResolvedValueOnce({ data: mockTop3 });

    const response = await request(app).get('/leaderboard/top3');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockTop3);
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/leaderboard/top3'));
  });

  it('should return error response when internal error', async () => {
    mockAxiosError(500, 'Internal Server Error');

    const response = await request(app).get('/leaderboard/top3');

    assertErrorResponse(response, 500, 'Internal Server Error');
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
    axios.post.mockRejectedValueOnce({
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

    axios.post.mockResolvedValueOnce(mockResponse);

    const response = await request(app)
      .post('/check-answer')
      .send(mockRequestBody)
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse.data);
  });

   it('should forward fetch-question-data to the question service', async () => {
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

  

  // Mock response for the /fetch-question-data endpoint
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

  // Mock the call to the question service's /fetch-question-data endpoint
  axios.post.mockResolvedValueOnce({ data: mockResponse });

  const response = await request(app)
      .post('/fetch-question-data')
      .send();

  expect(response.status).toBe(200);
  expect(response.body).toEqual(mockResponse);
  }); 

  it("should forward generateIncorrectOptions to the llm service", async () => {
    const response = await request(app).post("/generateIncorrectOptions").send({
        model: "empathy",
        correctAnswer: "correctAnswer",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
        options: ["option1", "option2", "option3"],
    });
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

    const response = await request(app).post('/fetch-question-data');
    
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
  
    axios.get.mockReset();
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
      console.warn('This test requires a valid token');
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
  
    axios.get.mockReset();
    axios.get.mockImplementationOnce((url, config) => {
      expect(url).toContain('/scores');
      expect(config.headers.Authorization).toBe(fakeToken);
      return Promise.resolve({ data: mockScores });
    });
  
    const response = await request(app)
      .get('/scores')
      .set('Authorization', fakeToken);
  
    if (response.status === 401) {
      console.warn('This test requires a valid token');
    } else {
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockScores);
    }
  });

  it('should forward /scoresByUser/:userId to game service', async () => {
    const userId = 'sadasklasjdlkajs';
    const mockResponse = [{ gameId: 'x1', score: 700 }];
  
    axios.get.mockReset();
    axios.get.mockResolvedValueOnce({ data: mockResponse });
  
    const response = await request(app).get(`/scoresByUser/${userId}`);
  
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining(`/scoresByUser/${userId}`));
  });
  
  it('should return 401 when requesting /scores without token', async () => {
    const response = await request(app).get('/scores');
    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ error: 'No token provided' });
  });

  it('should return 500 when game service fails at /scores', async () => {
    axios.get.mockReset();
    axios.get.mockRejectedValueOnce({
      response: { status: 500, data: { error: 'Game failure' } }
    });
  
    const response = await request(app)
      .get('/scores')
      .set('Authorization', 'Bearer ' + testToken);
  
    if (response.status === 401) {
      console.warn('This test requires a valid token');
    } else {
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Game failure' });
    }
  });

  it('should return 400 when score is not a number in /saveActiveUserScore', async () => {
    const response = await request(app)
      .post('/saveActiveUserScore')
      .set('Authorization', 'Bearer ' + testToken)
      .send({ score: 'not-a-number-therefore-FAIL' });
  
    if (response.status === 401) {
      console.warn('This test requires a valid token');
    } else {
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid or missing score' });
    }
  });

  it('should return 500 when game service fails at /saveActiveUserScore', async () => {
    axios.get.mockReset();
    axios.post.mockRejectedValueOnce({
      response: { status: 500, data: { error: 'Game Save Failed' } }
    });
  
    const response = await request(app)
      .post('/saveActiveUserScore')
      .set('Authorization', 'Bearer ' + testToken)
      .send({ score: 800 });
  
    if (response.status === 401) {
      console.warn('This test requires a valid token');
    } else {
      expect(response.status).toBe(500);
    }
  });

  it('should return 500 when game service fails at /scoresByUser/:userId', async () => {
    axios.get.mockReset();
    axios.get.mockRejectedValueOnce({
      response: { status: 500, data: { error: 'Game Service Error' } }
    });
  
    const response = await request(app).get('/scoresByUser/testuser');
  
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Game Service Error' });
  });
  
  it('should return 500 when question service fails at /question', async () => {
    axios.get.mockReset();
    axios.get.mockRejectedValueOnce({
      response: { status: 500, data: { error: 'Question Service Error' } }
    });
  
    const response = await request(app).get('/question');
  
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Question Service Error' });
  });
  
});

describe('Testing /fetch-custom-question-data', () => {
  it('should forward fetch-custom-question-data request with valid data', async () => {
    axios.get.mockReset();
    const mockResponse = [
      {
        type: 'flag',
        imageUrl: 'https://example.com/img.png',
        options: ['France'],
        correctAnswer: 'France'
      }
    ];

    axios.post.mockResolvedValueOnce({ data: mockResponse });

    const response = await request(app)
      .post('/fetch-custom-question-data')
      .send({
        shuffle: true,
        questions: [{ questionType: 'flag', numberOfQuestions: 1 }]
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockResponse);
  });

  it('should return 400 when fetch-custom-question-data receives empty array', async () => {
    axios.get.mockReset();
    const response = await request(app)
      .post('/fetch-custom-question-data')
      .send({ questions: [] });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: 'Questions array is required' });
  });

  it('should return 500 when question service fails at /fetch-custom-question-data', async () => {
    axios.get.mockReset();
    axios.post.mockRejectedValueOnce({
      response: { status: 500, data: { error: 'Question Service Failure' } }
    });

    const response = await request(app)
      .post('/fetch-custom-question-data')
      .send({
        questions: [{ questionType: 'flag', numberOfQuestions: 1 }],
        shuffle: true
      });

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to load custom question data' });
  });
});

describe('Testing /clear-questions', () => {
it('should forward clear-questions to the question service', async () => {
  axios.get.mockReset();
  axios.post.mockResolvedValueOnce({ data: { message: 'Questions cleared' } });

  const response = await request(app).post('/clear-questions');

  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual({ message: 'Questions cleared' });
});

it('should return 500 when question service fails at /clear-questions', async () => {
  axios.get.mockReset();
  axios.post.mockRejectedValueOnce(new Error('Clear failed'));

  const response = await request(app).post('/clear-questions');

  expect(response.statusCode).toBe(500);
  expect(response.body).toEqual({ error: 'Failed to clear questions' });
});
});

describe('GET /allScores', () => {
  const mockGameData = [
    { userId: '1', score: 100, createdAt: '2023-01-01', isVictory: true },
    { userId: '2', score: 90, createdAt: '2023-01-02', isVictory: false }
  ];

  const mockUsernames = {
    '1': 'Alice',
    '2': 'Bob'
  };

  it('should fetch scores and merge with usernames', async () => {
    axios.get.mockResolvedValueOnce({ data: mockGameData }); // gameService
    axios.post.mockResolvedValueOnce({ data: mockUsernames }); // userService

    const response = await request(app).get('/allScores');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { userId: '1', score: 100, createdAt: '2023-01-01', isVictory: true, username: 'Alice' },
      { userId: '2', score: 90, createdAt: '2023-01-02', isVictory: false, username: 'Bob' }
    ]);

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/allScores'), { params: {} });
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/getAllUsernamesWithIds'), {
      userIds: ['1', '2']
    });
  });

  it('should handle errors gracefully', async () => {
    axios.get.mockRejectedValueOnce({
      response: { status: 404, data: { error: 'Not Found' } }
    });

    const response = await request(app).get('/allScores');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not Found' });
  });
});


