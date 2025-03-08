// user-service.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./user-model')

const app = express();
const port = 8001;

// Middleware to parse JSON in request body
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);



// Function to validate required fields in the request body
function validateRequiredFields(req, requiredFields) {
    for (const field of requiredFields) {
      if (!(field in req.body)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
}

app.post('/adduser', async (req, res) => {
    try {
        // Check if required fields are present in the request body
        validateRequiredFields(req, ['username', 'password']);

        // Encrypt the password before saving it
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = new User({
            username: req.body.username,
            password: hashedPassword,
        });

        await newUser.save();
        res.json(newUser);
    } catch (error) {
        res.status(400).json({ error: error.message }); 
    }});

app.post('/updateProfilePicture', [

        // Validate  inputs
        check('username').isString().trim().escape(),
        check('profilePicture').isURL().trim().escape()
    
    ], async (req, res) => {
    
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
    
            const { username, profilePicture } = req.body;
    
            // Update user profile pic
            const user = await User.findOneAndUpdate(
                { username },
                { profilePicture },
                { new: true }
            );
            if (!user) {
                return res.status(404).json({ error: 'User  not found' });
            }
            res.json({ message: 'Profile picture updated successfully', user });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

const server = app.listen(port, () => {
  console.log(`User Service listening at http://localhost:${port}`);
});


// Listen for the 'close' event on the Express.js server
server.on('close', () => {
    // Close the Mongoose connection
    mongoose.connection.close();
  });

module.exports = server