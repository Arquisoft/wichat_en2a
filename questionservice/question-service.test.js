const request = require("supertest");
const axios = require("axios");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Question = require("./question-model");

let mongoServer;
let app;

jest.mock("axios");

function createMocks() {
  axios.post.mockImplementation((url) => {
    if (url.includes("generateIncorrectOptions")) {
      return Promise.resolve({
        status: 200,
        data: { incorrectOptions: ["Incorrect1", "Incorrect2", "Incorrect3"] },
      });
    }
  });

  axios.get.mockImplementation((url) => {
    if (url.includes("wikidata")) {
      // Get the number of questions to generate from the URL or default to 30
      const decodedUrl = decodeURIComponent(url);

      const match = decodedUrl.match("LIMIT (\\d+)");

      const numberOfQuestions = match ? parseInt(match[1], 10) : 30; // Default to 30 if not found

      return Promise.resolve({
        data: {
          results: {
            bindings: Array.from({ length: numberOfQuestions }, (_, i) => ({
              countryLabel: { value: `Country${i}` },
              flag: { value: `https://example.com/flag${i}.png` },
            })),
          },
        },
      });
    }
  });
}

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
  createMocks();
});

afterEach(() => {
  jest.clearAllMocks(); // Clear all mocks after each test
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
    expect(response.body.length).toBe(30); // By default, we fetch 30 questions

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
    await addMockQuestionToDB();

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

  it("should should fail and do not generate questions on POST /fetch-flag-data if the LLM has some issue", async () => {
    axios.post.mockImplementation((url) => {
      if (url.includes("/generateIncorrectOptions")) {
        return Promise.resolve({
          status: 400,
          data: { error: "LLM error" },
        });
      }
    });

    const response = await request(app).post("/fetch-flag-data");

    // Check the response status
    expect(response.statusCode).toBe(500);

    // Verify that no questions were saved in the database
    const questions = await Question.find();
    expect(questions.length).toBe(0);
  });
});

describe("Question Generation parametrization", () => {
  it("should generate a specified number of questions", async () => {
    const numberOfQuestions = 5; // Specify the number of questions to generate

    // Make a POST request to /fetch-flag-data with the specified number of questions
    const response = await request(app)
      .post("/fetch-flag-data")
      .send({ numberOfQuestions });

    // Check the response status and body
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(numberOfQuestions); // Check if the number of questions is correct

    // Verify that the questions were saved in the database
    const questions = await Question.find();
    expect(questions.length).toBe(numberOfQuestions);
  });

  it("should default to 30 questions if an invalid number (any negative number or 0) is provided", async () => {
    // Make a POST request to /fetch-flag-data without specifying the number of questions
    const response = await request(app).post("/fetch-flag-data").send({
      numberOfQuestions: -1, // Invalid number of questions
    });

    // Check the response status and body
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(30); // Default to 30 questions

    // Verify that the questions were saved in the database
    const questions = await Question.find();
    expect(questions.length).toBe(30);

    const response2 = await request(app)
      .post("/fetch-flag-data")
      .send({ numberOfQuestions: 0 });

    // Check the response status and body
    expect(response2.statusCode).toBe(200);
    expect(response2.body).toBeInstanceOf(Array);
    expect(response2.body.length).toBe(30); // Default to 30 questions

    // Verify that the questions were saved in the database
    const questions2 = await Question.find();
    expect(questions2.length).toBe(60); // 30 from the first request and 30 from the second request
  });

  it("should generate 30 questions if the number of questions is not a number", async () => {
    // Make a POST request to /fetch-flag-data with an invalid number of questions
    const response = await request(app).post("/fetch-flag-data").send({
      numberOfQuestions: "invalid", // Invalid number of questions
    });

    // Check the response status and body
    // Check the response status and body
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(30); // Default to 30 questions

    // Verify that no questions were saved in the database
    const questions = await Question.find();
    expect(questions.length).toBe(30);
  });

  it("should generate 30 questions if a type other than 'Integer' is provided", async () => {
    // Make a POST request to /fetch-flag-data with an invalid type for number of questions
    const response = await request(app).post("/fetch-flag-data").send({
      numberOfQuestions: 3.455, // Invalid type
    });

    // Check the response status and body
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(30); // Default to 30 questions

    // Verify that no questions were saved in the database
    const questions = await Question.find();
    expect(questions.length).toBe(30);
  });
});
