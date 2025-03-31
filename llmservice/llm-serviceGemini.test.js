const request = require("supertest");
const server = require("./llm-service.js"); // Asegúrate de que la ruta sea correcta
const { GoogleGenerativeAI } = require("@google/generative-ai");

jest.mock("@google/generative-ai");

describe("/ask endpoint with Gemini", () => {
  afterAll(() => {
    server.close();
  });

  it("should return a clue for the given question using gemini model", async () => {
    const response = await request(server)
      .post("/ask")
      .send({ question: "What is the capital of France?", userMessage: "Where is it roughly located?", model: "gemini", correctAnswer: "Paris" });

    expect(response.status).toBe(200);
    expect(response.body.answer).toBe("llmAnswer");
  });
});
