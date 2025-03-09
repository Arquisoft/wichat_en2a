const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    type: { type: String, required: true }, 
    imageUrl: { type: String, required: true }, 
    options: { type: [String], required: true }, // Opciones de respuesta
    correctAnswer: { type: String, required: true }, 
    createdAt: { type: Date, default: Date.now },
    alreadyShown: { type: Boolean, default:false } 
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;