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
            <Box sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" }, // Column on small screens, row on larger
                alignItems: "center",
                justifyContent: "space-around",
                height: "100vh",
                width: "100vw",
                textAlign: { xs: "center", md: "left" }, // Center text on small screens, left on big screens
                backgroundColor: "#6A5ACD",
                paddingTop: "64px",
                paddingX: { xs: 2, md: 10 } // Add padding for small screens
            }}>
                {/* Left Section: Text */}
                <Box sx={{ maxWidth: { xs: "90%", md: "40%" }, color: "white" }}>
                    <Typography
                        variant="h3"
                        sx={{ fontWeight: "bold", fontSize: { xs: "2rem", md: "3.5rem" } }}
                    >
                        Welcome back, {username}!
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{ marginBottom: 3, fontSize: { xs: "1.2rem", md: "2rem" } }}
                    >
                        Get ready to test your knowledge!
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
                            '&:hover': { backgroundColor: '#FFC107' }
                        }}
                        onClick={() => navigate("/game")}
                    >
                        PLAY
                    </Button>
                </Box>

                {/* Right Section: Image */}
                <Box component="img"
                     src="/questionMark.webp"
                     alt="Play Icon"
                     sx={{
                         width: "40%" , // Smaller on mobile, bigger on large screens
                         marginLeft: { xs: 0, md: 3 }, // Remove left margin for small screens
                         marginTop: { xs: 3, md: 0 } // Add top margin on mobile
                     }}
                />
            </Box>
        </>
    );
};

export default Home;
