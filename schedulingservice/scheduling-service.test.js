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

    expect(axios.post).toHaveBeenCalledTimes(6); // One for cleaning + 1 per type (5 types)
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

  it("should stop execution if cleaning the database fails", async () => {
    setMockTime(1, 0); // Set time to 1:00 AM

    // Mock the first call to fail (cleaning the database)
    axios.post.mockRejectedValueOnce(new Error("DB error"));

    await updateQuestions();

    expect(axios.post).toHaveBeenCalledTimes(1); // Only the first call should be made
  });

  it("should retry fetching questions up to 3 times on failure", async () => {
    setMockTime(1, 0); // Set time to 1:00 AM
    let counter = 0;

    axios.post.mockImplementation((url) => {
      if (url.includes("/clear-questions")) {
        return Promise.resolve({ status: 200 });
      } else if (url.includes("/fetch-question-data")) {
        counter++;
        if (counter === 3) {
          counter = 0;
          return Promise.resolve({ data: {} }); // Simulate success on the second attempt
        } else {
          return Promise.reject(new Error("Fetch error")); // Simulate fetch failure
        }
      }
    });

    await updateQuestions();

    expect(axios.post).toHaveBeenCalledTimes(16); // 1 for cleaning + 3*5 for fetching questions (5 types, 3 attempts each)

  });
});
