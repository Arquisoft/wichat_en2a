const request = require("supertest");
const axios = require("axios");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Question = require("./question-model");

let mongoServer;
let app;

jest.mock("axios");

axios.post.mockImplementation((url) => {
  if (url.includes("generateIncorrectOptions")) {
    return Promise.resolve({
      data: { incorrectOptions: ["Incorrect1", "Incorrect2", "Incorrect3"] },
    });
  }
});

axios.get.mockImplementation((url) => {
  if (url.includes("wikidata")) {
    return Promise.resolve({
      data: {
        results: {
          bindings: [
            {
              countryLabel: { value: "CorrectAnswer" },
              flag: { value: "https://example.com/flag.png" },
            },
          ],
        },
      },
    });
  }
});

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  app = require("./question-service");
});

afterAll(async () => {
  app.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  console.log("Clearing the database before each test");
  await Question.deleteMany({}); // Clear the database before each test
});

async function addMockQuestionToDB() {
  const testQuestion = {
    type: "flag",
    imageUrl: "https://example.com/flag.png",
    options: ["CorrectAnswer", "Incorrect1", "Incorrect2", "Incorrect3"],
    correctAnswer: "CorrectAnswer",
    alreadyShown: false,
  };

  const savedQuestion = await Question.create(testQuestion);

  return savedQuestion;
}

describe("Question Service", () => {
  it("should fetch data from wikidata and store in the DB on POST /fetch-flag-data", async () => {
    // Make a POST request to /fetch-flag-data
    const response = await request(app).post("/fetch-flag-data");

    // Check the response status and body
    expect(response.statusCode).toBe(200); //200 is HTTP status code for a successful request
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);

    // data was saved in the database
    const questions = await Question.find();
    expect(questions.length).toBeGreaterThan(0);
  });

  it("should fetch a random question from DB on GET /question", async () => {
    // Insert a test question into the database
    const testQuestion = {
      type: "flag",
      imageUrl: "https://example.com/flag.png",
      options: ["CorrectAnswer", "Incorrect1", "Incorrect2", "Incorrect3"],
      correctAnswer: "CorrectAnswer",
      alreadyShown: false,
    };
    await Question.create(testQuestion);

    // Make a GET request to /question
    const response = await request(app).get("/question");

    // Check the response status and body
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      type: "flag",
      imageUrl: "https://example.com/flag.png",
      options: ["CorrectAnswer", "Incorrect1", "Incorrect2", "Incorrect3"],
      correctAnswer: "CorrectAnswer",
    });

    // question is marked as already shown
    const updatedQuestion = await Question.findById(response.body._id);
    expect(updatedQuestion.alreadyShown).toBe(true);
  });

  it("should check if the choosen option is the right one on POST /check-answer", async () => {
    // Insert a test question into the database
    const savedQuestion = await addMockQuestionToDB();

    // Make a POST request to /check-answer
    const response = await request(app)
      .post("/check-answer")
      .send({ questionId: savedQuestion._id, selectedAnswer: "CorrectAnswer" });

    // Check the response status and body
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ isCorrect: true });

    // Test with an incorrect answer
    const incorrectResponse = await request(app)
      .post("/check-answer")
      .send({ questionId: savedQuestion._id, selectedAnswer: "Incorrect1" });

    expect(incorrectResponse.statusCode).toBe(200);
    expect(incorrectResponse.body).toEqual({ isCorrect: false });
  });
});

describe("Question Service Error Handling", () => {
  it("should return an error if no question is found on GET /question", async () => {
    // Make a GET request to /question with an empty database
    const response = await request(app).get("/question");

    expect(response.statusCode).toBe(404);
  });

  it("should return an error if questionId is missing on POST /check-answer", async () => {
    // Insert a test question into the database
    const savedQuestion = await addMockQuestionToDB();

    // Make a POST request to /check-answer without questionId
    const response = await request(app)
      .post("/check-answer")
      .send({ selectedAnswer: "CorrectAnswer" });

    expect(response.statusCode).toBe(400);
  });

  it("should return an error if correctAnwer is missing on POST /check-answer", async () => {
    // Insert a test question into the database
    const savedQuestion = await addMockQuestionToDB();

    const response = await request(app)
      .post("/check-answer")
      .send({ questionId: savedQuestion._id });

    expect(response.statusCode).toBe(400);
  });

  it("should return an error if neither questionId nor selectedAnswer is provided on POST /check-answer", async () => {
    const response = await request(app).post("/check-answer").send({});

    expect(response.statusCode).toBe(400);
  });

  it("should return false if no questions are available to check on POST /check-answer", async () => {
    const response = await request(app)
      .post("/check-answer")
      .send({ questionId: "123", selectedAnswer: "CorrectAnswer" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ isCorrect: false });
  });
});
