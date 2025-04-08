import React, { useEffect, useState } from "react";
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

const Leaderboard = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                setLoading(true);
                // check if 8005 or 8000. Its 8000! takes gateway one in order to get
                const response = await fetch(`${apiEndpoint}/leaderboard`);
                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }
                const data = await response.json();
                setPlayers(data);
                setError(null);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
                setError("Failed to load leaderboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        }

        fetchLeaderboard();
    }, []);

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

    if (error) {
        return (
            <>
                <Navbar />
                <Box sx={{ my: 2, textAlign: 'center' }}>
                    <Typography color="error">{error}</Typography>
                </Box>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden', mt: 2 }}>
                <Typography variant="h6" sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                    Leaderboard
                </Typography>
                <TableContainer sx={{ maxHeight: 440 }}>
                    <Table stickyHeader aria-label="leaderboard table" size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>User</TableCell>
                                <TableCell align="right">Total Score</TableCell>
                                <TableCell align="right">Games</TableCell>
                                <TableCell align="right">Avg. Score</TableCell>
                                <TableCell align="right">Win-rate (%)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {players.length > 0 ? (
                                players.map((player, index) => (
                                    <TableRow
                                        key={player._id}
                                        sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {player.username}
                                        </TableCell>
                                        <TableCell align="right">{player.totalScore}</TableCell>
                                        <TableCell align="right">{player.gamesPlayed}</TableCell>
                                        <TableCell align="right">
                                            {player.avgPointsPerGame?.toFixed(2) || "N/A"}
                                        </TableCell>
                                        <TableCell align="right">
                                            {player.winRate?.toFixed(2) || "0.00"}%
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No player data available
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

export default Leaderboard;