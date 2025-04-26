const axios = require("axios");

const gatewatServiceUrl =
  process.env.GATEWAY_SERVICE_URL || "http://localhost:8000";
const numberOfQuestions = 500; // Number of questions to fetch for each type

async function updateQuestions() {
  const date = new Date();

  if (date.getHours() === 1 && date.getMinutes() === 0) {
    // Update the questions at 1 AM
    console.log("Cleaning the database...");
    await axios.post(`${gatewatServiceUrl}/clear-questions`);

    console.log("Fetching new questions...");
    axios.post(`${gatewatServiceUrl}/fetch-custom-question-data`, {
      headers: {
        "Content-Type": "application/json",
      },
      payload: {
        questions: [
          { questionType: "flag", numberOfQuestions: numberOfQuestions },
          { questionType: "car", numberOfQuestions: numberOfQuestions },
          {
            questionType: "famous-person",
            numberOfQuestions: numberOfQuestions,
          },
          { questionType: "dino", numberOfQuestions: numberOfQuestions },
          { questionType: "place", numberOfQuestions: numberOfQuestions },
        ],
        shuffle: false,
      },
    });
  }
}

// FUNCTIONS TO START AND STOP THE SCHEDULER (MAINLY FOR TESTING PURPOSES)
function startScheduler() {
  updateInterval = setInterval(updateQuestions, 60000);
}

function stopScheduler() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
}

startScheduler(); // Start the scheduler when the module is loaded

// Export the function for testing purposes
if (process.env.NODE_ENV === "test") {
  module.exports = { updateQuestions, startScheduler, stopScheduler };
}
