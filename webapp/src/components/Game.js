import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {Container, Typography, Button, Box, CircularProgress} from '@mui/material';
import Navbar from './Navbar';
import './game-styles.css';
import {useNavigate} from 'react-router-dom';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

const Game = () => {
    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [answerSelected, setAnswerSelected] = useState(false);
    const [hint, setHint] = useState(null);

    const navigate = useNavigate();
    // Fetch question from the API
    const fetchQuestion = async () => {
        try {
            setHint(null);
            console.log("Fetching question...");
            let response = await axios.get(`${apiEndpoint}/question`);
            //if for some reason a problem occurred and the questions collection is empty, fetch
            if (!response.data || response.data.length === 0) {
                console.log("No questions found, initializing database...");
                await axios.post(`${apiEndpoint}/fetch-flag-data`);
                console.log("Database initialized. Fetching question again...");
                response = await axios.get(`${apiEndpoint}/question`);
            }
            setQuestion(response.data);
        } catch (error) {
            console.error('Error fetching question:', error);
            setError('Failed to load question');
        } finally {
            setLoading(false);
            setAnswerSelected(false);
        }
    };

    const retrieveHint = async () => {
        try {
            const response = await axios.post(`${apiEndpoint}/askllm`, {
                question: question.correctAnswer,
                model: "empathy"
            });
            console.log('Hint received:', response.data.answer);
            setHint(response.data.answer);
        } catch (error) {
            setError(error.response?.data?.error || 'Fetching hint failed');
            console.error('Error fetching hint:', error);
        }
    };

    useEffect(() => {
        fetchQuestion();
    }, []);

    if (loading) {
        return (
            <Container component="main" maxWidth="xl"
                       sx={{textAlign: 'center', mt: '2rem', minHeight: '85vh', width: '100%', px: '1rem'}}>
                <Typography component="h1" variant="h4" sx={{mb: '2rem'}}>
                    Quiz Game!
                </Typography>
                <CircularProgress/>
            </Container>
        );
    }

    if (error) {
        return (
            <Container component="main" maxWidth="xl"
                       sx={{textAlign: 'center', mt: '2rem', minHeight: '85vh', width: '100%', px: '1rem'}}>
                <Typography component="h1" variant="h4" sx={{mb: '2rem', color: 'red'}}>
                    {error}
                </Typography>
            </Container>
        );
    }

    return (
        <>
            <Navbar />
            <Container component="main" maxWidth="xl"
                       sx={{textAlign: 'center', mt: '0.5rem', minHeight: '85vh', width: '100%', px: '1rem'}}>
                <Typography component="h1" variant="h4" sx={{mb: '1rem'}}>
                    Quiz Game!
                </Typography>

                <Box sx={{
                    display: 'flex',
                    width: '100%',
                    minHeight: '40vh',
                    maxHeight: '60vh',
                    gap: '1rem',
                    flexDirection: 'row',
                    overflow: 'auto'
                }}>
                    {/* Left side - 1/3 (antes era 2/3) */}
                    <Box sx={{flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%'}}>
                        {/* Upper part - Question and answers */}
                        <Box sx={{
                            flex: 1,
                            p: '1rem',
                            border: '1px solid gray',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%'
                        }}>
                            <Typography variant="h6" sx={{mb: '1rem'}}>Which country is this flag from?</Typography>
                            {question.options.map((option, index) => (
                                <Button key={index} variant="contained" fullWidth sx={{mb: '0.5rem', py: '1rem'}}
                                        onClick={() => setAnswerSelected(true)}>
                                    {option}
                                </Button>
                            ))}
                        </Box>

                        {/* Lower part - Hint box */}
                        <Box sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            p: '1.5rem',
                            border: '1px solid gray',
                            borderRadius: '0.5rem',
                            width: '100%'
                        }}>
                            <Typography variant="h6" sx={{flex: 4}}>{hint || "Information hint here"}</Typography>
                            <Button variant="contained" sx={{alignSelf: 'center', py: '1.5rem', fontSize: '1.5rem'}}
                                    onClick={retrieveHint}>?</Button>
                        </Box>
                    </Box>

                    {/* Right side - 2/3 (antes era 1/3) */}
                    <Box sx={{
                        flex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid gray',
                        borderRadius: '0.5rem',
                        width: '100%',
                        height: 'auto',
                        minHeight: '40vh',
                        maxHeight: '60vh'
                    }}>
                        {question?.imageUrl ? (
                            <img src={question.imageUrl} alt="Question related"
                                 style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit'}}/>
                        ) : (
                            <Typography variant="h6">No image available</Typography>
                        )}
                    </Box>
                </Box>

                {/* Back and Next Question buttons */}
                <Box sx={{mt: '0.5rem', display: 'flex', justifyContent: 'flex-start', width: '100%'}}>
                    <Button variant="contained" color="error" onClick={() => navigate('/home')}>
                        Back
                    </Button>
                    <Button variant="contained" color="primary" disabled={!answerSelected} onClick={fetchQuestion}
                            sx={{ml: '1rem'}}>
                        Next Question
                    </Button>
                </Box>
            </Container>
        </>
    );
};

export default Game;