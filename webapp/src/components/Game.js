import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Button, Box, CircularProgress } from '@mui/material';
import Navbar from './Navbar';
import './game-styles.css';
import { useNavigate } from 'react-router-dom';
import Timer from './Timer';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

const Game = () => {
    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [answerSelected, setAnswerSelected] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [chosenAnswer, setChosenAnswer] = useState(null);
    const [timerKey, setTimerKey] = useState(0);
    const [questionCount, setQuestionCount] = useState(0);
    const [score, setScore] = useState(0);
    const [hint, setHint] = useState(null);
    const navigate = useNavigate();

    const MAX_QUESTIONS = 10;
    const COLORS = {
        primary: '#6A5ACD',
        success: '#4CAF50',
        error: '#F44336',
        hover: '#1565c0'
    };

    const fetchQuestion = async () => {
        if (questionCount >= MAX_QUESTIONS) return endGame();
        try {
            setHint(null);
            const response = await axios.get(`${apiEndpoint}/question`);
            setQuestion(response.data);
            setTimerKey(prevKey => prevKey + 1);
            setQuestionCount(prev => prev + 1);
        } catch (error) {
            setError('Failed to load question');
        } finally {
            setLoading(false);
            setAnswerSelected(false);
        }
    };

    const saveScore = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found');
            await axios.post(`${apiEndpoint}/saveActiveUserScore`, { score }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            setError('Failed to save your score');
        }
    };

    const endGame = async () => {
        setLoading(true);
        await saveScore();
        navigate('/game-over');
        setLoading(false);
    };

    const retrieveHint = async () => {
        try {
            const response = await axios.post(`${apiEndpoint}/askllm`, { question: question.correctAnswer, model: "empathy" });
            setHint(response.data.answer);
        } catch (error) {
            setError('Fetching hint failed');
        }
    };

    const checkAnswer = async (answer) => {
        try {
            setChosenAnswer(answer);
            const response = await axios.post(`${apiEndpoint}/check-answer`, {
                questionId: question._id,
                selectedAnswer: answer
            });
            setIsCorrect(response.data.isCorrect);
            if (response.data.isCorrect) setScore(prevScore => prevScore + 100);
            if (!response.data.isCorrect) setCorrectAnswer(question.correctAnswer);
        } catch (error) {
            setError('Failed to check answer');
        }
    };

    useEffect(() => { fetchQuestion(); }, []);

    if (loading) return <Container><CircularProgress /></Container>;
    if (error) return <Container><Typography color='error'>{error}</Typography></Container>;

    return (
        <>
            <Navbar />
            <Container>
                <Typography variant="h4">Quiz Game!</Typography>
                <Typography variant="h6">Score: {score} / {MAX_QUESTIONS * 100}</Typography>
                <Typography>Question {questionCount} of {MAX_QUESTIONS}</Typography>
                <Timer key={timerKey} duration={40} onTimeUp={() => setAnswerSelected(true)} answerSelected={answerSelected} />
                <Box>
                    <Typography variant="h6">Which country is this flag from?</Typography>
                    {question?.imageUrl ? (
                        <img src={question.imageUrl} alt="Flag" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                    ) : (
                        <Typography variant="h6">No image available</Typography>
                    )}
                    {question.options.map((option, index) => (
                        <Button
                            key={index}
                            variant="contained"
                            fullWidth
                            sx={{ backgroundColor: answerSelected && option === correctAnswer ? COLORS.success : COLORS.primary }}
                            disabled={answerSelected}
                            onClick={() => { setAnswerSelected(true); checkAnswer(option); }}
                        >
                            {option}
                        </Button>
                    ))}
                </Box>
                <Button variant="contained" onClick={retrieveHint}>Hint</Button>
                <Button variant="contained" onClick={fetchQuestion} disabled={!answerSelected}>Next Question</Button>
            </Container>
        </>
    );
};

export default Game;
