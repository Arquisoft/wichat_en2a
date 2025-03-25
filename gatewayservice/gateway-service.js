const express = require('express');
const axios = require('axios');
const cors = require('cors');
const promBundle = require('express-prom-bundle');
//libraries required for OpenAPI-Swagger
const swaggerUi = require('swagger-ui-express'); 
const fs = require("fs");
const YAML = require('yaml');


const app = express();
const port = 8000;

const questionServiceUrl = process.env.QUESTION_SERVICE_URL || 'http://localhost:8004'
const llmServiceUrl = process.env.LLM_SERVICE_URL || 'http://localhost:8003';
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8002';
const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8001';
const gameServiceUrl = process.env.GAME_SERVICE_URL ||  'http://gameservice:8005';// # ✅ NEW: Added game service URL


app.use(cors());
app.use(express.json());

//Prometheus configuration
const metricsMiddleware = promBundle({includeMethod: true});
app.use(metricsMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.post('/login', async (req, res) => {
  try {
    // Forward the login request to the authentication service
    const authResponse = await axios.post(authServiceUrl+'/login', req.body);
    res.json(authResponse.data);
  } catch (error) {
      res.status(error.response.status).json({ error: error.response.data.error });
  }
});

app.post('/adduser', async (req, res) => {
  try {
    // Forward the add user request to the user service
    const userResponse = await axios.post(userServiceUrl+'/adduser', req.body);
    res.json(userResponse.data);
  } catch (error) {
      res.status(error.response.status).json({ error: error.response.data.error });
  }
});

app.post('/askllm', async (req, res) => {
  try {
    // Forward the add user request to the user service
    const llmResponse = await axios.post(llmServiceUrl+'/ask', req.body);
    res.json(llmResponse.data);
  } catch (error) {
      res.status(error.response.status).json({ error: error.response.data.error });
  }
});

app.get('/question', async (req, res) => {
  try {
    // Forward fetch question request to the question service
    const questionResponse = await axios.get(`${questionServiceUrl}/question`);
    res.json(questionResponse.data);
  } catch (error) {
      res.status(error.response.status).json({ error: error.response.data.error });
  }
});

app.post('/check-answer', async (req, res) => {
  try {
    // Forward check answer request to the question service
    const checkAnswerResponse = await axios.post(`${questionServiceUrl}/check-answer`, req.body);
    res.json(checkAnswerResponse.data);
  } catch (error) {
      res.status(error.response.status).json({ error: error.response.data.error });
  }
});

app.post('/fetch-flag-data', async (req, res) => {
  try {
    // Forward fetch flag data request to the question service
    const fetchFlagDataResponse = await axios.post(`${questionServiceUrl}/fetch-flag-data`);
    res.json(fetchFlagDataResponse.data);
  } catch (error) {
      res.status(error.response.status).json({ error: error.response.data.error });
  }
});

app.post('/saveScore', async (req, res) => {
  try {
    // Forward check answer request to the question service
    const checkAnswerResponse = await axios.post(`${gameServiceUrl}/saveScore`, req.body);
    res.json(checkAnswerResponse.data);
  } catch (error) {
      res.status(error.response.status).json({ error: error.response.data.error });
  }
});

app.post('/addScore', async (req, res) => {
  try {
    // Forward check answer request to the question service
    const checkAnswerResponse = await axios.post(`${gameServiceUrl}/check-answer`, req.body);
    res.json(checkAnswerResponse.data);
  } catch (error) {
      res.status(error.response.status).json({ error: error.response.data.error });
  }
});


// Read the OpenAPI YAML file synchronously
openapiPath='./openapi.yaml'
if (fs.existsSync(openapiPath)) {
  const file = fs.readFileSync(openapiPath, 'utf8');

  // Parse the YAML content into a JavaScript object representing the Swagger document
  const swaggerDocument = YAML.parse(file);

  // Serve the Swagger UI documentation at the '/api-doc' endpoint
  // This middleware serves the Swagger UI files and sets up the Swagger UI page
  // It takes the parsed Swagger document as input
  app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else {
  console.log("Not configuring OpenAPI. Configuration file not present.")
}


// Start the gateway service
const server = app.listen(port, () => {
  console.log(`Gateway Service listening at http://localhost:${port}`);
});

module.exports = server;
