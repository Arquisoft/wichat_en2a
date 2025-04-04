const express = require('express');
const axios = require('axios');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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
const gameServiceUrl = process.env.GAME_SERVICE_URL || 'http://localhost:8005';

app.use(cors());
app.use(express.json());

//Prometheus configuration
const metricsMiddleware = promBundle({includeMethod: true});
app.use(metricsMiddleware);

// Middleware to verify token
function verifyToken(req, res, next) {
  const token = req.header('Authorization');
  if (!token) {
      return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
      const decoded = jwt.verify(token.replace('Bearer ', ''), 'your-secret-key');
      req.userId = decoded.userId;
      next();
  } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
  }
}

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

// Endpoint to get usernames by multiple userIds
app.post('/getAllUsernamesWithIds', async (req, res) => {
  try {
    // Forward the request to the user service
    const usernamesResponse = await axios.post(`${userServiceUrl}/getAllUsernamesWithIds`, req.body);
    res.json(usernamesResponse.data);
  } catch (error) {
    console.error('Error fetching usernames:', error);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.error || 'Internal Server Error' 
    });
  }
});

// Endpoint to get a list of users
app.get('/users', async (req, res) => {
  try {
      // Forward the request to the user service
      const userResponse = await axios.get(`${userServiceUrl}/users`);
      res.json(userResponse.data);
  } catch (error) {
      res.status(error.response.status).json({ error: error.response.data.error });
      
  }
});

app.get('/getUserById/:userId', async (req, res) => {
    try {
        const response = await axios.get(`${userServiceUrl}/getUserById/${req.params.userId}`);
        res.json(response.data);
    } catch (error) {
        res.status(error.response.status).json({error: error.response.data.error});
    }
})

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

//gateway one 
// Endpoint to save the active user's score (on endgame)
// En el gateway, modifica para usar /saveScore
// Gateway endpoint to save active user's score
app.post('/saveActiveUserScore', verifyToken, async (req, res) => {
  try {
      const { score } = req.body;

      if (score === undefined || isNaN(score)) {
          return res.status(400).json({ error: "Invalid or missing score" });
      }

      const userId = req.userId; // Extracted from token
      const isVictory = score >= 700; // Determine victory condition

      // Forward request to /saveScore in game service
      const response = await axios.post(`${gameServiceUrl}/saveScore`,
          { userId, score, isVictory }
      );

      res.json(response.data);
  } catch (error) {
      console.error("Error in Gateway saving score:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});


// En tu archivo de gateway
app.get('/scoresByUser/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const response = await axios.get(`${gameServiceUrl}/scoresByUser/${userId}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.error || 'Internal Server Error' 
    });
  }
});

// Endpoint to get loggeduser scores
app.get('/scores', verifyToken, async (req, res) => {
  try {
      // Definir URL explícitamente sin usar construcción dinámica
      const GAME_SERVICE_BASE_URL = process.env.GAME_SERVICE_URL || 'http://localhost:8005';
      const SCORES_ENDPOINT = '/scores';
      
      // Validar protocolo del servicio configurado
      const urlObj = new URL(GAME_SERVICE_BASE_URL);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
          return res.status(400).json({ error: 'Invalid protocol in service configuration' });
      }
      
      // Concatenar de manera segura (sin parámetros de usuario)
      const requestUrl = `${GAME_SERVICE_BASE_URL}${SCORES_ENDPOINT}`;
      
      const authToken = req.header('Authorization');
      
      const response = await axios.get(requestUrl, { // NOSONAR
          headers: { 
              'Authorization': authToken
          }
      });
      
      res.json(response.data);
  } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.response?.data?.error || 'Internal Server Error' });
  }
});

// 8000!!!!!!!!!
app.get('/leaderboard', async (req, res) => {
  try {
    // Fetch leaderboard from the game service
    const leaderboardResponse = await axios.get(`${gameServiceUrl}/leaderboard`, {
      params: req.query, // Forward sorting params if any
    });

    const leaderboardData = leaderboardResponse.data;
    
    // Extract userIds from the leaderboard response
    const userIds = leaderboardData.map(entry => entry.userId);

    // Fetch usernames from the user service
    const usernamesResponse = await axios.post(`${userServiceUrl}/getAllUsernamesWithIds`, {
      userIds
    });

    const usernamesMap = usernamesResponse.data; // Assuming it returns an object { userId: username }

    // Merge leaderboard data with usernames
    const leaderboardWithUsernames = leaderboardData.map(entry => ({
      ...entry,
      username: usernamesMap[entry.userId] || 'Unknown User'
    }));

    res.json(leaderboardWithUsernames);
  } catch (error) {
    console.error('Leaderboard Fetch Error:', error);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.error || 'Internal Server Error' 
    });
  }
});

app.get('/leaderboard/top3', async (req, res) => {
    try{
        const response = await axios.get(`${gameServiceUrl}/leaderboard/top3`)
        res.json(response.data);
    } catch(error){
        res.status(error.response.status).json({ error: error.response.data.error });
    }
});

app.post('/generateIncorrectOptions', async (req, res) => {
  try {
    const incorrectOptionsResponse = await axios.post(`${llmServiceUrl}/generateIncorrectOptions`, req.body);
    res.json(incorrectOptionsResponse.data);
  } catch (error) {
      res.status(error.response.status).json({ error: error.response.data.error });
  }
});

// Read the OpenAPI YAML file synchronously
const openapiPath='./openapi.yaml'
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