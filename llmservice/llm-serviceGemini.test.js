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
      .send({ question: "Which country is this flag from?",
              userMessage: "Where is it roughly located?",
              model: "gemini",
              correctAnswer: "France",
              type: "flag"
            });

    expect(response.status).toBe(200);
    expect(response.body.answer).toBe("llmAnswer");
  });

  it("should handle error from Gemini model gracefully", async () => {
    GoogleGenerativeAI.__setMockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: async () => {
          throw new Error("Network failure");
        },
      }),
    }));

    const response = await request(server)
      .post("/ask")
      .send({
      question: "Which country is this flag from?",
      userMessage: "Where is it roughly located?",
      model: "gemini",
      correctAnswer: "France",
      type: "flag"
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("The LLM did not return a valid response.");
  });
});

