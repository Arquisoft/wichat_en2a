const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    createdAt: Date,
    profilePicture: {
        type: String,  // store the URL of the image
        default: null  // default value -> null
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User