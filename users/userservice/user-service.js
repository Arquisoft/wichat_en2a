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

//add user endpint
app.post('/adduser', async (req, res) => {
    try {
        // Check if required fields are present in the request body
        validateRequiredFields(req, ['username', 'password']);

        // Check if username already exists
        const existingUser = await User.findOne({ username: req.body.username });
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Encrypt the password before saving it
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({
            username: req.body.username,
            password: hashedPassword,
        });
        await newUser.save();
        res.status(201).json(newUser); //201 means created, not just 200 OK, clearer this way
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// delete user endpoint
app.delete('/users/:userId', async (req, res) => {
  try {
      const userId = req.params.userId;
      
      // Check if exists
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }
      
      // Delete user
      await User.findByIdAndDelete(userId);
      
      res.json({ message: 'User deleted successfully' });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// update user endpoint
app.put('/users/:userId', async (req, res) => {
  try {
      const userId = req.params.userId;
      const updateData = {};
      
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }
      
      // username update 
      if (req.body.username !== undefined) {
          if (req.body.username.trim() === '') {
              return res.status(400).json({ error: 'Username cannot be empty' });
          }
          updateData.username = req.body.username;
      }
      
      // Handle password update - prevent empty password
      if (req.body.password !== undefined) {
          if (req.body.password === '') {
              return res.status(400).json({ error: 'Password cannot be empty' });
          }
          updateData.password = await bcrypt.hash(req.body.password, 10);
      }
      
      // profile picture update - empty string or null to remove profile picture
      if (req.body.profilePicture !== undefined) {
          // if empty string -> to remove profile picture
          updateData.profilePicture = req.body.profilePicture === '' ? null : req.body.profilePicture;
      }
      
      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ error: 'No valid fields to update' });
      }
      
      // Update user with new data
      const updatedUser = await User.findByIdAndUpdate(
          userId,
          updateData,
          { new: true } // Return the updated user
      );
      
      res.json(updatedUser);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// Endpoint to get username of one userId
app.get('/getUserById/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate that userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid userId format' });
        }

        // Fetch user and select only the necessary fields
        const user = await User.findById(userId).select('username _id');
       
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return an object with both _id and username
        res.json({
            _id: user._id.toString(), // Ensure it's a string
            username: user.username
        });
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to get usernames by multiple userIds
// In user service
app.post('/getAllUsernamesWithIds', async (req, res) => {
    try {
      const { userIds } = req.body;
      
      // Ensure userIds is an array
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: 'Invalid userIds array' });
      }
  
      const users = await User.find({ _id: { $in: userIds } }, { _id: 1, username: 1 });
  
      // Convert array to object map { userId: username }
      const userMap = users.reduce((acc, user) => {
        acc[user._id] = user.username;
        return acc;
      }, {});
  
      res.json(userMap);
    } catch (error) {
      console.error('Error fetching usernames:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});
  
// Endpoint to get a list of users
app.get('/users', async (req, res) => {
    try {
        // Fetch all users from the database
        const users = await User.find({}, 'username _id'); // Use _id not *id
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
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