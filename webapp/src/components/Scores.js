import React, { useEffect, useState } from 'react';
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
    Box
} from '@mui/material';
import Navbar from './Navbar';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

const Scores = () => {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchScores() {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No token found. Please log in.');
                }

                const response = await fetch(`${apiEndpoint}/scores`, {
                    headers: {
                        Authorization: `Bearer ${token}`  // Include in header
                        // in postman or curl
                        // curl -X GET "http://localhost:8000/scores" -H "Authorization: Bearer ey6...(token)
                    }
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }

                const data = await response.json();
                setScores(data);  // Salve response
                setError(null);
            } catch (error) {
                console.error("Error fetching scores:", error);
                setError(error.message || "Failed to load scores. Try again later.");
            } finally {
                setLoading(false);
            }
        }

        fetchScores();
    }, []);  // Effect for fetching scores

    if (loading) {
        return (
            <>
                <Navbar />
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress /> {/* Load spinner */}
                </Box>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <Box sx={{ my: 2, textAlign: 'center' }}>
                    <Typography color="error">{error}</Typography> {/* Show error message */}
                </Box>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden', mt: 2 }}>
                <Typography variant="h6" sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                    Your Scores
                </Typography>
                <TableContainer sx={{ maxHeight: 440 }}>
                    <Table stickyHeader aria-label="scores table" size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Score</TableCell>
                                <TableCell align="right">Date</TableCell>
                                <TableCell align="right">Victory</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {scores.length > 0 ? (
                                scores.map((score, index) => (
                                    <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                                        <TableCell component="th" scope="row">
                                            {score.score} {/* Mostramos el puntaje */}
                                        </TableCell>
                                        <TableCell align="right">{new Date(score.createdAt).toLocaleString()}</TableCell> {/* Mostramos la fecha */}
                                        <TableCell align="right">{score.isVictory ? 'Yes' : 'No'}</TableCell> {/* Mostramos si fue victoria */}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">
                                        No scores available
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </>
    );
};

export default Scores;
