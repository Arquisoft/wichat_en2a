import React from 'react';
import { Container, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const GameOver = () => {
    const navigate = useNavigate();

    return (
        <Container component="main" maxWidth="sm" sx={{ textAlign: 'center', mt: '2rem' }}>
            <Typography variant="h3" sx={{ mb: '1rem' }}>Game Over!</Typography>
            <Typography variant="h5" sx={{ mb: '2rem' }}>You answered 10 questions.</Typography>
            <Button variant="contained" color="primary" onClick={() => navigate('/home')}>
                Back to Home
            </Button>
            <Button variant="contained" color="primary" onClick={() => navigate('/leaderboard')}>
                See leaderboard
            </Button>
            <Button variant="contained" color="primary" onClick={() => navigate('/scoresByUser/')}>
                See my scores
            </Button>
        </Container>
    );
};

export default GameOver;
