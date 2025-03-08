const request = require('supertest');
const axios = require('axios');
const app = require('./llm-service'); 

afterAll(async () => {
    app.close();
  });

jest.mock('axios');

describe('LLM Service', () => {

  beforeEach(() => {
  // Mock responses from external services
  axios.post.mockImplementation((url, data) => {
    if (url.startsWith('https://generativelanguage')) {
      return Promise.resolve({ data: { candidates: [{ content: { parts: [{ text: 'llmanswer' }] } }] } });
    } else if (url.startsWith('https://empathyai')) {
      // response.data.choices[0]?.message?.content,
      return Promise.resolve({ data: { choices: [{message: {content: 'llmanswer'}}]} } );
    }
  });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // Test /ask endpoint with gemini
  it('the llm should reply', async () => {
    const response = await request(app)
      .post('/ask')
      .send({ question: 'a question', apiKey: 'apiKey', model: 'gemini' });

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe('llmanswer');
  });

  // Test /ask endpoint with empathy
  it('the llm should reply', async () => {
    const response = await request(app)
      .post('/ask')
      .send({ question: 'a question', apiKey: 'apiKey', model: 'empathy' });

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe('llmanswer');
});
});


describe('Distractors generation', () => {

  beforeEach(() => {
    // Mock responses from external services
  axios.post.mockImplementation((url, data) => {
    if (url.startsWith('https://generativelanguage')) {
      return Promise.resolve({ data: { candidates: [{ content: { parts: [{ text: 'India,Nepal,Mongolia' }] } }] } });
    } else if (url.startsWith('https://empathyai')) {
      return Promise.resolve({ data: { choices: [{message: {content: 'Gabon,Somalia,Niger'}}]} } );
    }
  });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // Test endpoint with empathy
  it('should generate distractors', async () => {
    const response = await request(app)
      .post('/generateIncorrectOptions')
      .send({ model: 'empathy', apiKey: 'apiKey', correctAnswer: 'Cote D\'Ivoire' });

    expect(response.statusCode).toBe(200);
    expect(response.body.incorrectOptions).toEqual(['Gabon', 'Somalia', 'Niger']);
});

// Test endpoint with gemini
it('should generate distractors', async () => {
  const response = await request(app)
    .post('/generateIncorrectOptions')
    .send({ model: 'gemini', apiKey: 'apiKey', correctAnswer: 'Somalia' });

    expect(response.statusCode).toBe(200);
    expect(response.body.incorrectOptions).toEqual(['India', 'Nepal', 'Mongolia']);
});
});