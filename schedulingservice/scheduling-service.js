const axios = require("axios");

const gatewayServiceUrl =
  process.env.GATEWAY_SERVICE_URL || "http://localhost:8000";
const numberOfQuestions = 500; // Number of questions to fetch for each type
let initialLoad = true; // Flag to indicate if it's the first load

async function updateQuestions() {
  const date = new Date();

  if ((date.getHours() === 1 && date.getMinutes() === 0) || initialLoad) {
    // Update the questions at 1 AM
    console.log("Cleaning the database...");
    await axios.post(`${gatewayServiceUrl}/clear-questions`);

    console.log("Fetching new questions...");
    try {
      axios.post(
        `${gatewayServiceUrl}/fetch-custom-question-data`,
        {
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
        {
          headers: { "Content-Type": "application/json" }, // Correct placement of headers
        }
      );
      console.log("New questions fetched and database updated.");
    } catch (error) {
      console.error("Error fetching new questions:", error.message);
    }
  }
}

// FUNCTIONS TO START AND STOP THE SCHEDULER (MAINLY FOR TESTING PURPOSES)
let updateInterval = null;
function startScheduler() {
  updateInterval = setInterval(updateQuestions, 60000);
}

function stopScheduler() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
}

updateQuestions(); // Call the function to fill the database when the module is loaded
initialLoad = false; // Set the initial load flag to false after the first call
startScheduler(); // Start the scheduler when the module is loaded

// Export the function for testing purposes
if (process.env.NODE_ENV === "test") {
  module.exports = { updateQuestions, startScheduler, stopScheduler };
}
