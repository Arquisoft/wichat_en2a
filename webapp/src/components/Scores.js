import React, { useState, useEffect } from 'react';
import { 
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Typography, 
    CircularProgress, 
    Box,
    Container
} from '@mui/material';
import Navbar from './Navbar';

const Scores = () => {
    const [userScores, setUserScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserScores = async () => {
            try {
                // Get the token from local storage
                const token = localStorage.getItem('token');
                
                if (!token) {
                    throw new Error('No authentication token found');
                }

                // Fetch current user's scores
                const response = await fetch('http://localhost:8000/scores/me', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user scores');
                }

                const data = await response.json();
                setUserScores(data);
                setError(null);
            } catch (error) {
                console.error('Error fetching user scores:', error);
                setError(error.message || 'Failed to load scores');
            } finally {
                setLoading(false);
            }
        };

        fetchUserScores();
    }, []);

    if (loading) {
        return (
            <>
                <Navbar/>
                <Container sx={{ mt: 10 }}>
                    <Box sx={{display: 'flex', justifyContent: 'center', my: 4}}>
                        <CircularProgress/>
                    </Box>
                </Container>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar/>
                <Container sx={{ mt: 10 }}>
                    <Box sx={{my: 2, textAlign: 'center'}}>
                        <Typography color="error">{error}</Typography>
                    </Box>
                </Container>
            </>
        );
    }

    return (
        <>
            <Navbar/>
            <Container sx={{ mt: 10 }}>
                <Paper elevation={3} sx={{width: '100%', overflow: 'hidden'}}>
                    <Typography variant="h6" sx={{p: 2, bgcolor: 'primary.main', color: 'white'}}>
                        My Scores
                    </Typography>
                    <TableContainer>
                        <Table aria-label="user scores table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Game</TableCell>
                                    <TableCell align="right">Score</TableCell>
                                    <TableCell align="right">Date</TableCell>
                                    <TableCell align="right">Duration</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {userScores.length > 0 ? (
                                    userScores.map((score, index) => (
                                        <TableRow 
                                            key={index}
                                            sx={{'&:nth-of-type(odd)': {bgcolor: 'action.hover'}}}
                                        >
                                            <TableCell component="th" scope="row">
                                                {score.gameType || 'Unknown Game'}
                                            </TableCell>
                                            <TableCell align="right">{score.points}</TableCell>
                                            <TableCell align="right">
                                                {new Date(score.createdAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell align="right">
                                                {score.gameDuration ? `${score.gameDuration} sec` : 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            No scores found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Container>
        </>
    );
};

export default Scores;