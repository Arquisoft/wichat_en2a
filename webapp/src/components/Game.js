import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {Container, Typography, Button, Box, CircularProgress, TextField, Paper} from '@mui/material';
import Navbar from './Navbar';
import './game-styles.css';
import {useNavigate} from 'react-router-dom';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

const Game = () => {
    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [answerSelected, setAnswerSelected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loadingMessage, setLoadingMessage] = useState(false);

    const navigate = useNavigate();
    // Fetch question from the API
    const fetchQuestion = async () => {
        try {
            setMessages([]);
            setInput("");
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
        if (!input.trim()) return;
        const newMessages = [...messages, { text: input, sender: 'user' }];
        setMessages(newMessages);
        const inputOld = input;
        setInput('');
        setLoadingMessage(true);

        try {
            const response = await axios.post(`${apiEndpoint}/askllm`, {
                question: "Which country is this flag from?", //hardcoded for now until we get more question types
                userMessage: inputOld,
                model: "gemini",
                correctAnswer: question.correctAnswer
            });
            setMessages([...newMessages, { text: response.data.answer, sender: 'bot' }]);
        } catch (error) {
            setMessages([...newMessages, { text: 'An error occurred, please try again.', sender: 'bot' }]);
        } finally {
            setLoadingMessage(false);
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
                            width: '100%',
                            overflow: 'hidden'
                        }}>
                            <Paper sx={{ maxHeight: '30vh', overflowY: 'auto', p: '1rem', border: '1px solid gray' }}>
                                {messages.map((msg, index) => (
                                    <Box key={index} sx={{ 
                                        textAlign: msg.sender === 'user' ? 'right' : 'left', 
                                        mb: '0.5rem'
                                    }}>
                                        <Typography 
                                            variant="body1" 
                                            sx={{ 
                                                display: 'inline-block',
                                                p: '0.5rem',
                                                borderRadius: '0.5rem',
                                                bgcolor: msg.sender === 'user' ? 'primary.light' : 'secondary.light'
                                            }}>
                                            {msg.text}
                                        </Typography>
                                    </Box>
                                ))}
                            </Paper>

                            <Box sx={{ display: 'flex', mt: '1rem' }}>
                                <TextField 
                                    fullWidth 
                                    variant="outlined" 
                                    placeholder="Type a message..."
                                    value={input} 
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <Button 
                                    variant="contained" 
                                    sx={{ ml: '1rem' }}
                                    onClick={retrieveHint} 
                                    disabled={loadingMessage}
                                >
                                    Send
                                </Button>
                            </Box>
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
                        maxHeight: '60vh',
                        overflow: 'hidden'
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