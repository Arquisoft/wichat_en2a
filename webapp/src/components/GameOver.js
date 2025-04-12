import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from "./Navbar";

const GameOver = () => {
    const navigate = useNavigate();
    const totalQuestions = localStorage.getItem('totalQuestions') || 10;

    return (
        <>
            <Navbar />
            <Box sx={{
                minHeight: '100vh',
                width: '100vw',
                backgroundColor: '#6A5ACD', // Purple background
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                padding: '0 5%',
                textAlign: 'center'
            }}>
                <Typography variant="h3" sx={{ color: 'white' }}>
                    Game Over!
                </Typography>

                <Typography variant="h4" sx={{ color: 'white', mb: 2 }}>
                    You answered {totalQuestions} questions.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button variant="contained"
                            sx={{ backgroundColor: '#FFD700', color: 'black' }}
                            onClick={() => {
                                localStorage.removeItem('totalQuestions');
                                localStorage.removeItem('timeLimit');
                                navigate('/home')
                            }}>
                        Back to Home
                    </Button>
                    <Button variant="contained"
                            sx={{ backgroundColor: '#FFD700', color: 'black' }}
                            onClick={() => {
                                localStorage.removeItem('totalQuestions');
                                localStorage.removeItem('timeLimit');
                                navigate('/leaderboard')
                            }}>
                        See leaderboard
                    </Button>
                    <Button variant="contained"
                            sx={{ backgroundColor: '#FFD700', color: 'black' }}
                            onClick={() => {
                                localStorage.removeItem('totalQuestions');
                                localStorage.removeItem('timeLimit');
                                navigate('/scores');
                            }}>
                        See my scores
                    </Button>
                </Box>
            </Box>
        </>
    );
};

export default GameOver;
