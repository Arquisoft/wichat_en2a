import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Button, Box, CircularProgress } from '@mui/material';
import Navbar from './Navbar';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

const Game = ({ onNavigate }) => {
    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [answerSelected, setAnswerSelected] = useState(false);
    const [hint, setHint] = useState(null);

    // Fetch question from the API
    const fetchQuestion = async () => {
        try {
            setHint(null); // Delete hint text if any
            console.log("Fetching question...");
            const response = await axios.get(`${apiEndpoint}/question`);
            console.log("Received question:", response.data);
            setQuestion(response.data);
        } catch (error) {
            console.error('Error fetching question:', error);
            setError('Failed to load question');
        } finally {
            setLoading(false);
            setAnswerSelected(false);  // Reset the state for answer selection
        }
    };

    const retrieveHint = async () => {
        try {
          // Send request to LLM to get a hint based on our question
          const response = await axios.post(`${apiEndpoint}/askllm`, { question: question.correctAnswer , model: "empathy" });
          
          // Log or store the hint response
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
            <Container component="main" maxWidth="xl" sx={{ textAlign: 'center', mt: '2rem', minHeight: '85vh', width: '100%', px: '1rem' }}>
                <Typography component="h1" variant="h4" sx={{ mb: '2rem' }}>
                    Quiz Game!
                </Typography>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container component="main" maxWidth="xl" sx={{ textAlign: 'center', mt: '2rem', minHeight: '85vh', width: '100%', px: '1rem' }}>
                <Typography component="h1" variant="h4" sx={{ mb: '2rem', color: 'red' }}>
                    {error}
                </Typography>
            </Container>
        );
    }

    return (
        <>
        <Navbar onNavigate={onNavigate}/>
        <Container component="main" maxWidth="xl" sx={{ textAlign: 'center', mt: '2rem', minHeight: '85vh', width: '100%', px: '1rem' }}>
            <Typography component="h1" variant="h4" sx={{ mb: '2rem' }}>
                Quiz Game!
            </Typography>

            {/* Main container */}
            <Box sx={{ display: 'flex', width: '100%', minHeight: '70vh', gap: '1rem', flexDirection: 'row'}}>

                {/* Left side - Two thirds */}
                <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    
                    {/* Upper part of left side - 1 half */}
                    <Box sx={{ flex: 1, p: '1rem', border: '1px solid gray', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Typography variant="h6" sx={{ mb: '1rem' }}>{"Which country is this flag from?"}</Typography>
                        <Button key={0} variant="contained" fullWidth sx={{ mb: '0.5rem', py: '1rem' }} onClick={() => setAnswerSelected(true)}>
                            {question.options[0]}
                        </Button>
                        <Button key={1} variant="contained" fullWidth sx={{ mb: '0.5rem', py: '1rem' }} onClick={() => setAnswerSelected(true)}>
                            {question.options[1]}
                        </Button>
                        <Button key={2} variant="contained" fullWidth sx={{ mb: '0.5rem', py: '1rem' }} onClick={() => setAnswerSelected(true)}>
                            {question.options[2]}
                        </Button>
                        <Button key={3} variant="contained" fullWidth sx={{ mb: '0.5rem', py: '1rem' }} onClick={() => setAnswerSelected(true)}>
                            {question.options[3]}
                        </Button>
                    </Box>

                    {/* Lower part of left side - 1 half  */}
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid gray', borderRadius: '0.5rem', width: '100%' }}>
                        {question?.imageUrl ? (
                            <img src={question.imageUrl} alt="Question related" style={{ width: '100%', height: 'auto', maxHeight: '100%' }} />
                        ) : (
                            <Typography variant="h6">No image available</Typography>
                        )}
                    </Box>
                </Box>

                {/* Right side - 1 third */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: '1.5rem', border: '1px solid gray', borderRadius: '0.5rem', width: '100%' }}>
                    {/* LLM text space - 4/5 */}
                    <Typography variant="h6" sx={{ flex: 4 }}>{hint || "Information hint here"}</Typography>

                    {/* ? button - 1/5 */}
                    <Button variant="contained" sx={{ alignSelf: 'center', py: '1.5rem', fontSize: '1.5rem' }} onClick={retrieveHint}>?</Button>
                </Box>
            </Box>

            {/* Back btn below */}
            <Box sx={{ mt: '2rem', display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                <Button variant="contained" color="error" onClick={() => onNavigate('home')}>
                    Back
                </Button>
                <Button variant="contained" color="primary" disabled={!answerSelected} onClick={fetchQuestion} sx={{ ml: '1rem' }}>
                    Next Question
                </Button>
            </Box>
        </Container>
        </>
    );
};

export default Game;
