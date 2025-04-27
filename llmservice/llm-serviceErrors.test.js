const request = require("supertest");
const axios = require("axios");
const { app, server, getSelectedModel } = require("./llm-service");
const { generateTemplateMocks } = require("./__mocks__/testUtils");

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
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
    const response = await request(app).post("/generateIncorrectOptions").send({
      model: "empathy",
      correctAnswer: "Paris",
      type: "invalid",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("No question found for type: invalid");
  });

  it("should fail if the model is not supported when asking a question", async () => {
    const response = await request(app).post("/ask").send({
      question: "a question",
      model: "openai",
      userMessage: "a message",
      type: "flag",
      correctAnswer: "an answer",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Model "openai" is not supported.');
  });

  it("should log full error object if error.message is missing", async () => {
    const consoleCheck = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const err = { unexpectedEvent: true }; //no message included
    axios.post.mockImplementation(() => {
      throw err;
    });

    const response = await request(app).post("/ask").send({
      question: "a question",
      model: "empathy",
      userMessage: "a message",
      type: "flag",
      correctAnswer: "an answer",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "The LLM did not return a valid response."
    );

    expect(consoleCheck).toHaveBeenCalledWith("Error sending question:", {
      unexpectedEvent: true,
    });
    consoleCheck.mockRestore();
  });

  it("should switch empathy models when a 5XX error occurs", async () => {
    axios.post.mockImplementationOnce(() => {
      const error = new Error("Internal Server Error");
      error.response = { status: 500 };
      return Promise.reject(error);
    });

    const error = new Error("Internal Server Error");
    error.response = { status: 500 };

    axios.post.mockRejectedValueOnce(error);

    let originalModel = getSelectedModel();

    const response = await request(app).post("/generateIncorrectOptions").send({
      model: "empathy",
      correctAnswer: "Cote D'Ivoire",
      type: "flag",
    });

    expect(response.statusCode).toBe(400);
    expect(getSelectedModel()).not.toBe(originalModel); // Check if the model has switched
  });
});
