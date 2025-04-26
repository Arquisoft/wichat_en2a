const axios = require("axios");

const gatewatServiceUrl =
  process.env.GATEWAY_SERVICE_URL || "http://localhost:8000";
const numberOfQuestions = 500; // Number of questions to fetch for each type

let date;
let questionsUpdated = false;

while (true) {
  date = new Date();
  if (date.getHours() === 1 && date.getMinutes() === 0 && !questionsUpdated) {
    // Update the questions at 1 AM
    console.log("Cleaning the database...");
    await axios.post(`${gatewatServiceUrl}/clear-questions`);

    console.log("Fetching new questions...");
    axios.post(`${gatewatServiceUrl}/`, {
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
    questionsUpdated = true;
  }

  if (date.getHours() === 2 && date.getMinutes() === 0) {
    // Reset the flag at 2:00 AM
    questionsUpdated = false;
  }
}
