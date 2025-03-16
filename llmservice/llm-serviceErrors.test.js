const request = require("supertest");
const axios = require("axios");
const app = require("./llm-service");
const e = require("express");

afterAll(async () => {
  app.close();
});

jest.mock("axios");

function generateTemplateMocks() {
  axios.post.mockImplementation((url, data) => {
    // response.data.choices[0]?.message?.content,
    return Promise.resolve({
      data: { choices: [{ message: { content: "llmanswer" } }] },
    });
  });
}

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
});
