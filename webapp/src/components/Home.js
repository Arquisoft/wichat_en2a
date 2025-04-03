import React, { useEffect, useState } from 'react';
import { Button, Typography, Box } from '@mui/material';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [username, setUsername] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, []);

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
