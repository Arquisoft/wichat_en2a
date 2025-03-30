import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from "./Navbar";

const GameOver = () => {
    const navigate = useNavigate();

    return (
        <>
            <Navbar />
            <Box sx={{
                minHeight: '100vh',
                width: '100vw',
                backgroundColor: '#6A5ACD', // Purple background
                display: 'flex',
                flexDirection: 'column',  // Organiza todo en columna
                alignItems: 'center',     // Centra los elementos
                justifyContent: 'center', // Centra verticalmente
                gap: 2,                   // Espacio entre elementos
                padding: '0 5%',
                textAlign: 'center'        // Asegura alineación centrada
            }}>
                <Typography variant="h3" sx={{ color: 'white' }}>
                    Game Over!
                </Typography>

                <Typography variant="h4" sx={{ color: 'white', mb: 2 }}>
                    You answered 10 questions.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button variant="contained"
                            sx={{ backgroundColor: '#FFD700', color: 'black' }}
                            onClick={() => navigate('/home')}>
                        Back to Home
                    </Button>
                    <Button variant="contained"
                            sx={{ backgroundColor: '#FFD700', color: 'black' }}
                            onClick={() => navigate('/leaderboard')}>
                        See leaderboard
                    </Button>
                    <Button variant="contained"
                            sx={{ backgroundColor: '#FFD700', color: 'black' }}
                            onClick={() => navigate('/scoresByUser/')}>
                        See my scores
                    </Button>
                </Box>
            </Box>
        </>
    );
};

export default GameOver;
