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
    if (url.startsWith("https://generativelanguage")) {
      return Promise.resolve({
        data: {
          candidates: [{ content: { parts: [{ text: "llmanswer" }] } }],
        },
      });
    } else if (url.startsWith("https://empathyai")) {
      // response.data.choices[0]?.message?.content,
      return Promise.resolve({
        data: { choices: [{ message: { content: "llmanswer" } }] },
      });
    }
  });
}

describe("LLM Service", () => {
  beforeEach(() => {
    // Mock responses from external services
    generateTemplateMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // Test /ask endpoint with gemini
  it("the llm should reply", async () => {
    const response = await request(app)
      .post("/ask")
      .send({ question: "a question", model: "gemini" });

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe("llmanswer");
  });

  // Test /ask endpoint with empathy
  it("the llm should reply", async () => {
    const response = await request(app)
      .post("/ask")
      .send({ question: "a question", model: "empathy" });

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe("llmanswer");
  });
});

describe("Distractors generation", () => {
  beforeEach(() => {
    // Mock responses from external services
    axios.post.mockImplementation((url, data) => {
      if (url.startsWith("https://generativelanguage")) {
        return Promise.resolve({
          data: {
            candidates: [
              { content: { parts: [{ text: "India,Nepal,Mongolia" }] } },
            ],
          },
        });
      } else if (url.startsWith("https://empathyai")) {
        return Promise.resolve({
          data: { choices: [{ message: { content: "Gabon,Somalia,Niger" } }] },
        });
      }
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // Test endpoint with empathy
  it("should generate distractors", async () => {
    const response = await request(app).post("/generateIncorrectOptions").send({
      model: "empathy",
      correctAnswer: "Cote D'Ivoire",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.incorrectOptions).toEqual([
      "Gabon",
      "Somalia",
      "Niger",
    ]);
  });

  // Test endpoint with gemini
  it("should generate distractors", async () => {
    const response = await request(app)
      .post("/generateIncorrectOptions")
      .send({ model: "gemini", correctAnswer: "Somalia" });

    expect(response.statusCode).toBe(200);
    expect(response.body.incorrectOptions).toEqual([
      "India",
      "Nepal",
      "Mongolia",
    ]);
  });
});

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
