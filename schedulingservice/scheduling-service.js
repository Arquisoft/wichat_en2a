const axios = require("axios");

const gatewayServiceUrl =
  process.env.GATEWAY_SERVICE_URL || "http://localhost:8000";
const numberOfQuestions = 100; // Number of questions to fetch for each type
let initialLoad = true; // Flag to indicate if it's the first load
const types = ["flag", "car", "famous-person", "dino", "place"]; // List of question types

async function updateQuestions() {
  const date = new Date();

  if ((date.getHours() === 1 && date.getMinutes() === 0) || initialLoad) {
    // Update the questions at 1 AM
    console.log("Cleaning the database...");
    const cleanStart = Date.now();
    try {
      await axios.post(`${gatewayServiceUrl}/clear-questions`);
    } catch (error) {
      console.error("Error clearing the database:", error);
      return; // Exit if there's an error clearing the database
    }
    
    console.log("Fetching new questions...");
    const fetchStart = Date.now();

    let attempts = 0;
    let success; // Flag to track if the fetch was successful

    for (const type of types) {
      success = false; // Reset success for each type
      while (attempts < 3 && !success) {
        try {
          await axios.post(
            `${gatewayServiceUrl}/fetch-question-data`,
            {
              questionType: type,
              numberOfQuestions: numberOfQuestions,
            },
            {
              headers: { "Content-Type": "application/json" }, // Correct placement of headers
            }
          );
          success = true; // Set success to true if the fetch was successful
          console.log(
            `Fetched ${numberOfQuestions} for ${type} questions successfully.`
          );
        } catch (error) {
          attempts++;
          console.log(
            `Error fetching questions at attempt ${attempts}: ${error}`
          );
        }
        logErrorCaseAttemts(attempts, type);
      }
      attempts = 0; // Reset attempts for the next type
    }
    console.log(`New questions fetched in ${Date.now() - fetchStart} ms`);
    console.log(
      `Database cleaned and updated in ${Date.now() - cleanStart} ms`
    );
  }
}

function logErrorCaseAttemts(attempts, type) {
  if (attempts == 3) {
    console.log(
      `Fetch for ${type || "some type"} has failed, questions will be added while the game is executing...`
    );
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
