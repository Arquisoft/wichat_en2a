const request = require("supertest");
const axios = require("axios");
const app = require("./llm-service");
const { generateTemplateMocks } = require("./__mocks__/testUtils");

afterAll(async () => {
  app.close();
});

jest.mock("axios");

describe("/ask endpoint with empathy", () => {
  beforeEach(() => {
    generateTemplateMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // Test /ask endpoint with empathy
  it("the llm should reply", async () => {
    const response = await request(app)
      .post("/ask")
      .send({ question: "What is the capital of France?", userMessage: "Where is it roughly located?", model: "gemini", correctAnswer: "Paris" });

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe("llmAnswer");
  });
});

describe("/generateIncorrectOptions endpoint with empathy", () => {
  beforeEach(() => {
    // Mock responses from empathy
    axios.post.mockImplementation((url, data) => {
      return Promise.resolve({
        data: { choices: [{ message: { content: "Gabon,Somalia,Niger" } }] },
      });
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
      type: "flag"
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.incorrectOptions).toHaveLength(3);
    expect(response.body.incorrectOptions).toEqual([
      "Gabon",
      "Somalia",
      "Niger",
    ]);
  });

  it("should handle LLM error in empathy model gracefully", async () => {
    axios.post.mockImplementation(() => {
      throw new Error("Network failure");
    });
  
    const response = await request(app)
      .post("/ask")
      .send({
        question: "What's this flag?",
        userMessage: "Can you help?",
        model: "empathy",
        correctAnswer: "Spain",
        type: "flag"
      });
  
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("The LLM did not return a valid response.");
  });
});
