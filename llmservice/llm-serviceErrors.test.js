const request = require("supertest");
const axios = require("axios");
const app = require("./llm-service");
const { generateTemplateMocks } = require("./__mocks__/testUtils");

afterAll(async () => {
  app.close();
});

jest.mock("axios");

describe("Error handling", () => {
  beforeEach(() => {
    generateTemplateMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should fail if the model is not supported when asking a question", async () => {
    const response = await request(app)
      .post("/ask")
      .send({ question: "a question", model: "openai" });

    expect(response.statusCode).toBe(400);
  });

  it("should fail if the model is not supported when generating the distractors", async () => {
    const response = await request(app)
      .post("/generateIncorrectOptions")
      .send({ question: "a question", model: "openai" });

    expect(response.statusCode).toBe(400);
  });

  it("should fail if the required fields are missing when asking a question", async () => {
    const response = await request(app)
      .post("/ask")
      .send({ question: "a question" });

    expect(response.statusCode).toBe(400);
  });

  it("should fail if the required fields are missing when generating the distractors", async () => {
    const response = await request(app)
      .post("/generateIncorrectOptions")
      .send({ model: "gemini" });

    expect(response.statusCode).toBe(400);
  });

  it("should fail if the type is not supported when generating incorrect options", async () => {
    const response = await request(app)
      .post("/generateIncorrectOptions")
      .send({
        model: "empathy",
        correctAnswer: "Paris",
        type: "invalid",
      });
  
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("No question found for type: invalid");
  });

  it("should fail if the model is not supported when asking a question", async () => {
    const response = await request(app)
      .post("/ask")
      .send({ 
        question: "a question",
        model: "openai",
        userMessage: "a message",
        type: "flag",
        correctAnswer: "an answer"
      });
  
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Model "openai" is not supported.');
  });
});
