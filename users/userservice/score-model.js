const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },
    score: {
        type: Number,
        required: true,
    },
    isVictory: { 
        type: Boolean,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Score = mongoose.model('Score', scoreSchema);

module.exports = Score;