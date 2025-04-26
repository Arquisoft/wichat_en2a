const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,  // store the URL of the image
      default: null  // default value -> null
    },
    createdAt: {
      type: Date,
      default: Date.now, 
    },
    isAdmin: {
      type: Boolean,
      default: false
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User