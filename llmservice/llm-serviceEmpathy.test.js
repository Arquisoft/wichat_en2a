const request = require("supertest");
const axios = require("axios");
const app = require("./llm-service");

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
      .send({ question: "a question", model: "empathy" });

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe("llmanswer");
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
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.incorrectOptions).toHaveLength(3);
    expect(response.body.incorrectOptions).toEqual([
      "Gabon",
      "Somalia",
      "Niger",
    ]);
  });
});
