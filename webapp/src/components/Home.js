import React from 'react';
import {Button, Typography, Box} from '@mui/material';
import Navbar from './Navbar';
import {useNavigate} from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();

    return (
        <>
            <Navbar/>
            <Box sx={{
                minHeight: '100vh',
                width: '100vw',
                backgroundColor: '#6A5ACD', // Purple background
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center',
                justifyContent: 'center',
                gap: { xs: 4, md: 8 },
                padding: '0 5%',
                textAlign: { xs: 'center', md: 'left' }
            }}>
                {/* Left container */}
                <Box sx={{
                    flex: 1,
                    minWidth: '300px',
                    maxWidth: { xs: '100%', md: '50%' }, // Full width on small, half on larger
                }}>
                    <Typography
                        component="h1"
                        variant={{ xs: 'h3', sm: 'h2', md: 'h1' }} // Adjusts size for different screens
                        sx={{color: 'white', fontWeight: 'bold'}}>
                        Welcome back!
                    </Typography>
                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: '#FFD700',
                            color: 'black',
                            fontWeight: 'bold',
                            padding: '15px 40px',
                            fontSize: { xs: '1.2rem', md: '1.5rem' },                            borderRadius: '30px',
                            '&:hover': {backgroundColor: '#FFC107'},
                            marginTop: 2 //Space below text
                        }}
                        onClick={() => navigate('/game')}>
                        Play Game
                    </Button>
                </Box>
                {/* Imagen a la derecha */}
                <Box sx={{
                    flex: 1,
                    minWidth: '300px',
                    maxWidth: { xs: '80%', md: '50%' },
                    display: 'flex',
                    justifyContent: 'center'
                }}>
                    <img
                        src="/questionMark.webp"
                        alt="Trivia Logo"
                        style={{ width: 'auto', height: 'auto' }}
                    />
                </Box>
            </Box>
        </>
    );
};

export default Home;