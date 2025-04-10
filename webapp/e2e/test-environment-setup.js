const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoserver;
let userservice;
let authservice;
let llmservice;
let gatewayservice;
let gameservice;
let questionservice;

async function startServer() {
    console.log('Starting MongoDB memory server...');
    mongoserver = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoserver.getUri();
    userservice = await require("../../users/userservice/user-service");
    authservice = await require("../../users/authservice/auth-service");
    llmservice = await require("../../llmservice/llm-service");
    questionservice = await require("../../questionservice/question-service");
    gatewayservice = await require("../../gatewayservice/gateway-service");
    gameservice = await require ("../../users/gameservice/game-service");
}

startServer();
