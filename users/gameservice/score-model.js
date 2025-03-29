const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const scoreSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    isVictory: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexing
scoreSchema.index({ userId: 1 }); // Ascending order for user ids
scoreSchema.index({ score: -1 }); // Descending for high scores

// Helper method to check if a given userId matches
scoreSchema.methods.isUserMatch = function(compareId) {
    // Normalize both to ObjectId and compare
    return this.userId.equals(mongoose.Types.ObjectId(compareId));
};

const Score = mongoose.model('Score', scoreSchema);
module.exports = Score;