const axios = require("axios");
const { updateQuestions, stopScheduler } = require("./scheduling-service");

jest.mock("axios");
jest.useFakeTimers();

describe("Question Updater", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    stopScheduler(); // Stop the scheduler after all tests
  });

  // Helper function to mock the time
  const setMockTime = (hours, minutes) => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date(2023, 0, 1, hours, minutes, 0));
  };

  it("should make API calls at 1:00 AM", async () => {
    setMockTime(1, 0); // Set time to 1:00 AM

    axios.post.mockResolvedValue({ data: {} });

    await updateQuestions();

    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8000/clear-questions"
    );
    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8000/fetch-custom-question-data",
      {
        questions: expect.arrayContaining([
          expect.objectContaining({
            questionType: expect.any(String),
            numberOfQuestions: 200,
          }),
        ]),
        shuffle: false,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  });

  it("should not make API calls at 1:01 AM", async () => {
    setMockTime(1, 1); // Set time to 1:01 AM

    axios.post.mockResolvedValue({ data: {} });

    await updateQuestions();

    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should not make API calls at 0:59 AM", async () => {
    setMockTime(0, 59); // Set time to 0:59 AM

    axios.post.mockResolvedValue({ data: {} });

    await updateQuestions();

    expect(axios.post).not.toHaveBeenCalled();
  });
});
