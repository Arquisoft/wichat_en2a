const request = require("supertest");
const axios = require("axios");
const app = require("./gateway-service");

jest.mock("axios");

afterAll(async () => {
  app.close();
});

describe("Gateway Service", () => {
  // Mock responses from external services
  axios.post.mockImplementation((url, data) => {
    if (url.endsWith("/login")) {
      return Promise.resolve({ data: { token: "mockedToken" } });
    } else if (url.endsWith("/adduser")) {
      return Promise.resolve({ data: { userId: "mockedUserId" } });
    } else if (url.endsWith("/ask")) {
      return Promise.resolve({ data: { answer: "llmanswer" } });
    } else if (url.endsWith("/generateIncorrectOptions")) {
      return Promise.resolve({
        data: { options: ["option1", "option2", "option3"] },
      });
    }
  });

  // Test /login endpoint
  it("should forward login request to auth service", async () => {
    const response = await request(app)
      .post("/login")
      .send({ username: "testuser", password: "testpassword" });

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBe("mockedToken");
  });

  // Test /adduser endpoint
  it("should forward add user request to user service", async () => {
    const response = await request(app)
      .post("/adduser")
      .send({ username: "newuser", password: "newpassword" });

    expect(response.statusCode).toBe(200);
    expect(response.body.userId).toBe("mockedUserId");
  });

  // Test /askllm endpoint
  it("should forward askllm request to the llm service", async () => {
    const response = await request(app)
      .post("/askllm")
      .send({ question: "question", apiKey: "apiKey", model: "gemini" });

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe("llmanswer");
  });

  it("should forward question to the question service", async () => {
    const mockResponse = { data: { question: "https://example.com/flag.png" } };
    axios.get.mockResolvedValueOnce(mockResponse);

    const response = await request(app).get("/question");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse.data);
  });

  it("should forward check-answer to the question service", async () => {
    const mockRequestBody = { questionId: 1, answer: "France" };
    const mockResponse = { data: { correct: true } };

    axios.post.mockResolvedValueOnce(mockResponse);

    const response = await request(app)
      .post("/check-answer")
      .send(mockRequestBody)
      .set("Content-Type", "application/json");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse.data);
  });

  it("should forward fetch-flag-data to the question service", async () => {
    const mockResponse = [
      {
        type: "flag",
        imageUrl: "https://example.com/flag-france.png",
        options: ["France"],
        correctAnswer: "France",
      },
      {
        type: "flag",
        imageUrl: "https://example.com/flag-usa.png",
        options: ["United States"],
        correctAnswer: "United States",
      },
    ];

    // Mock response for the /fetch-flag-data endpoint
    axios.get.mockImplementation((url) => {
      if (url.includes("wikidata.org/sparql")) {
        return Promise.resolve({
          data: {
            results: {
              bindings: [
                {
                  country: { value: "https://www.wikidata.org/entity/Q142" },
                  countryLabel: { value: "France" },
                  flag: { value: "https://example.com/flag-france.png" },
                },
                {
                  country: { value: "https://www.wikidata.org/entity/Q30" },
                  countryLabel: { value: "United States" },
                  flag: { value: "https://example.com/flag-usa.png" },
                },
              ],
            },
          },
        });
      }
    });

    // Mock the axios call to Wikidata
    axios.get.mockResolvedValueOnce({
      data: {
        results: {
          bindings: [
            {
              country: { value: "https://www.wikidata.org/entity/Q142" },
              countryLabel: { value: "France" },
              flag: { value: "https://example.com/flag-france.png" },
            },
            {
              country: { value: "https://www.wikidata.org/entity/Q30" },
              countryLabel: { value: "United States" },
              flag: { value: "https://example.com/flag-usa.png" },
            },
          ],
        },
      },
    });

    // Mock the call to the question service's /fetch-flag-data endpoint
    axios.post.mockResolvedValueOnce({ data: mockResponse });

    const response = await request(app).post("/fetch-flag-data").send();

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
  });

  it("should forward generateIncorrectOptions to the llm service", async () => {
    const response = await request(app).post("/generateIncorrectOptions").send({
      model: "empathy",
      apiKey: "apiKey",
      correctAnswer: "correctAnswer",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      options: ["option1", "option2", "option3"],
    });
  });
});
