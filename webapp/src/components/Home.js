import React, { useEffect, useState } from 'react';
import {Button, Typography, Box} from '@mui/material';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

const Home = () => {
    const [username, setUsername] = useState(null);
    const navigate = useNavigate();
    const [topPlayers, setTopPlayers] = useState([]);

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        setUsername(storedUsername || 'Guest');


         async function fetchTopPlayers() {
            try {
                let response = await axios.get(`${apiEndpoint}/leaderboard/top3`);
                let players = response.data;

                players = await Promise.all(
                    players.map(async (player) => {
                        const res = await fetch(`${apiEndpoint}/getUserById/${player._id}`);
                        const userData = await res.json();
                        return {
                            ...player,
                            username: userData.username || 'Unknown',
                        };
                    })
                );

                setTopPlayers(players);
            } catch (error) {
                console.error('Error fetching top players:', error);
            }
         }
        fetchTopPlayers();
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
                    {/* Top Players Box */}
                    <Box
                        sx={{
                            mt: 5, // More separation from PLAY button
                            backgroundColor: "#4B0082",
                            padding: 2,
                            borderRadius: "10px",
                            boxShadow: 3,
                            textAlign: "center"
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "gold" }}>
                            🏆 Top Players 🏆
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                            {topPlayers.length > 2 ? (
                                topPlayers.map((player, index) => (
                                    <Typography key={player.userId} variant="body1" sx={{ color: "white" }}>
                                        {index === 0 && '🥇'}
                                        {index === 1 && '🥈'}
                                        {index === 2 && '🥉'}
                                        {player.username} - {player.totalScore} pts
                                    </Typography>
                                ))
                            ) : (
                                <Typography variant="body1" sx={{ color: "white" }}>
                                    Not enough players to show the leaderboard
                                </Typography>
                            )}
                        </Box>
                    </Box>
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
