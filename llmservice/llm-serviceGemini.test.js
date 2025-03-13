const request = require('supertest');
const server = require('./llm-service.js'); // Asegúrate de que la ruta sea correcta

describe('LLM Service API', () => {
  afterAll(() => {
    server.close();
  });

  it('should return a clue for the given question using empathy model', async () => {
    const response = await request(server)
      .post('/ask')
      .send({ question: 'What is the capital of France?', model: 'empathy' });

    expect(response.status).toBe(200);
    expect(response.body.answer).toBeDefined();
  });

  it('should return incorrect options for the given correct answer using empathy model', async () => {
    const response = await request(server)
      .post('/generateIncorrectOptions')
      .send({ model: 'empathy', correctAnswer: 'France' });

    expect(response.status).toBe(200);
    expect(response.body.incorrectOptions).toHaveLength(3);
  });

  it('should return a clue for the given question using gemini model', async () => {
    const response = await request(server)
      .post('/ask')
      .send({ question: 'What is the capital of France?', model: 'gemini' });

    expect(response.status).toBe(200);
    expect(response.body.answer).toBeDefined();
  });

  it('should return incorrect options for the given correct answer using gemini model', async () => {
    const response = await request(server)
      .post('/generateIncorrectOptions')
      .send({ model: 'gemini', correctAnswer: 'France' });

    expect(response.status).toBe(200);
    expect(response.body.incorrectOptions).toHaveLength(3);
  });

  it('should return an error for unsupported model', async () => {
    const response = await request(server)
      .post('/ask')
      .send({ question: 'What is the capital of France?', model: 'unsupportedModel' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Model "unsupportedModel" is not supported.');
  });
});