import React, { useEffect, useState } from 'react';
import { Button, Typography, Box, CircularProgress } from '@mui/material';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [username, setUsername] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchUser() {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No token found. Please log in.');
                }

                // Calls userservice to retrieve the username
                const response = await fetch('http://localhost:8001/me', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Error fetching user data');
                }

                const data = await response.json();
                setUsername(data.username);  // We save username in the state
            } catch (error) {
                console.error('Error fetching user:', error);
                setUsername('Guest');  // If error shows 'Guest'
            } finally {
                setLoading(false);  // Loads everything does not matter if username of Guest
            }
        }

        fetchUser();
    }, []);  // Efect as we want to fetch user data

    if (loading) {
        return (
            <>
                <Navbar />
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <Box
                sx={{
                    minHeight: '100vh',
                    width: '100vw',
                    backgroundColor: '#6A5ACD', // Purple background
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: { xs: 4, md: 8 },
                    padding: '0 5%',
                    textAlign: { xs: 'center', md: 'left' },
                }}
            >
                {/* Left container */}
                <Box
                    sx={{
                        flex: 1,
                        minWidth: '300px',
                        maxWidth: { xs: '100%', md: '50%' },
                    }}
                >
                    <Typography
                        component="h1"
                        variant={{ xs: 'h3', sm: 'h2', md: 'h1' }}
                        sx={{ color: 'white', fontWeight: 'bold' }}
                    >
                        Welcome back, {username}!
                    </Typography>
                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: '#FFD700',
                            color: 'black',
                            fontWeight: 'bold',
                            padding: '15px 40px',
                            fontSize: { xs: '1.2rem', md: '1.5rem' },
                            borderRadius: '30px',
                            '&:hover': { backgroundColor: '#FFC107' },
                            marginTop: 2, // Space below text
                        }}
                        onClick={() => navigate('/gamemodes')}
                    >
                        Play Game
                    </Button>
                </Box>
                {/* Imagen a la derecha */}
                <Box
                    sx={{
                        flex: 1,
                        minWidth: '300px',
                        maxWidth: { xs: '80%', md: '50%' },
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
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
