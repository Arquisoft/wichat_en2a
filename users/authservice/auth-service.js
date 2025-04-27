const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./auth-model');
const NewUser = require('../userservice/user-model');
const { check, matchedData, validationResult } = require('express-validator');
const app = express();
const port = 8002; 

// Middleware to parse JSON in request body
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);

const checkAdminUser = async () => {
  const admin = await User.findOne({ isAdmin: true });
  // One admin exists -> do nothing
  if (admin) {
    return;
  }

  // No admin exists -> check if account called "admin" exists
  const adminUser = await User.findOne({ username: 'admin' });
  if (adminUser) {
    const bcrypt = require('bcrypt');
    const isDefaultPassword = await bcrypt.compare('admin123', adminUser.password);

    // "admin" password is default -> grant admin privileges to said account
    if (isDefaultPassword) {
      adminUser.isAdmin = true;
      await adminUser.save();
      console.log('Existing "admin" user with default password was granted admin privileges.');
      return;
    }
  }

  // no "admin" account or password is not default -> create new admin account
  const bcrypt = require('bcrypt');
  const passwordHash = await bcrypt.hash('admin123', 10);
  await User.create({ username: 'admin', password: passwordHash, isAdmin: true });
  console.log('Admin user created with username: admin & password: admin123. PLEASE change the account credentials after first login.');
};
checkAdminUser();


// Function to validate required fields in the request body
function validateRequiredFields(req, requiredFields) {
    for (const field of requiredFields) {
      if (!(field in req.body)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
}

// Route for user login
app.post('/login',  [
  check('username').isLength({ min: 3 }).trim().escape(),
  check('password').isLength({ min: 3 }).trim().escape()
],async (req, res) => {
  try {
    // Check if required fields are present in the request body
  
  validateRequiredFields(req, ['username', 'password']);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array().toString()});
  }
    let username =req.body.username.toString();
    let password =req.body.password.toString();

    // const userNotAuth = await NewUser.findOne({ username });
    // let profilePic = userNotAuth ? userNotAuth.profilePicture : null;

    // Find the user by username in the database
    const user = await User.findOne({ username });

    // Check if the user exists and verify the password
    if (user && await bcrypt.compare(password, user.password)) {

      // Generate a JWT token
      const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '1h' });
      // Respond with the token, user ID and user information
      res.json({ 
        token: token, 
        userId: user._id, // Add user ID to response to use on GAME-SERVICE
        username: username, 
        createdAt: user.createdAt || new Date().toISOString(),
        isAdmin: user.isAdmin || false,
        profilePicture: user.profilePicture || "/avatars/default.jpg"
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Auth Service listening at http://localhost:${port}`);
});

server.on('close', () => {
    // Close the Mongoose connection
    mongoose.connection.close();
  });

module.exports = server
