const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true // Ensures no duplicate usernames
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
}, {
    // Enable virtual populate and other advanced features
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Method to safely compare ObjectIds
userSchema.methods.compareId = function(compareId) {
    // Ensures comparison works with string or ObjectId inputs
    return this._id.equals(mongoose.Types.ObjectId(compareId));
};

const User = mongoose.model('User', userSchema);
module.exports = User;