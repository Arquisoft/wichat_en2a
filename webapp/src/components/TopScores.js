import React, { useEffect, useState, useRef } from "react";
import {
    Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, CircularProgress,
    Box, TableSortLabel, Avatar, Select, MenuItem, FormControl, InputLabel,
    FormControlLabel, Switch
} from '@mui/material';
import Navbar from './Navbar';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';
const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

const TopScores = () => {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('score');
    const [topScores, setTopScores] = useState(25);
    const [currentUsername, setCurrentUsername] = useState(null);
    const currentUserRef = useRef(null);

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        setCurrentUsername(storedUsername || 'Guest');

        const fetchTopScores = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${apiEndpoint}/allScores`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (!response.ok) throw new Error(`Error: ${response.status}`);
                const data = await response.json();
                setScores(data);
            } catch (err) {
                console.error("Error fetching scores:", err);
                setError("Failed to load scores.");
            } finally {
                setLoading(false);
            }
        };

        fetchTopScores();
    }, []);

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedScores = React.useMemo(() => {
        const comparator = (a, b) => {
            const aVal = a[orderBy] ?? 0;
            const bVal = b[orderBy] ?? 0;
            return order === 'asc' ? aVal - bVal : bVal - aVal;
        };
        return [...scores].sort(comparator);
    }, [scores, order, orderBy]);

    const paginatedScores = sortedScores.slice(0, topScores);

    const handleTopScoresChange = (event) => {
        setTopScores(event.target.value);
    };

    if (loading) return (
        <>
            <Navbar />
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '50vh', mt: 8 }}>
                <CircularProgress size={60} thickness={4} sx={{ color: '#6A5ACD' }} />
                <Typography variant="h6" sx={{ mt: 2, color: '#6A5ACD' }}>Loading Top Scores...</Typography>
            </Box>
        </>
    );

    if (error) return (
        <>
            <Navbar />
            <Box sx={{ my: 4, textAlign: 'center', mt: 8 }}>
                <Typography variant="h6" color="error">{error}</Typography>
            </Box>
        </>
    );

    return (
        <>
            <Navbar />
            <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2, pt: 10 }}>
                <Paper elevation={3} sx={{ width: '100%', borderRadius: 2 }}>
                    <Box sx={{
                        p: 2,
                        bgcolor: '#6A5ACD',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            🏅 Top {topScores} Scores
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FormControl sx={{ minWidth: 120, ml: 2 }} size="small">
                                <InputLabel sx={{ color: 'white' }}>Top Scores</InputLabel>
                                <Select
                                    value={topScores}
                                    onChange={handleTopScoresChange}
                                    label="Top Scores"
                                    sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
                                >
                                    {[25, 50, 100].map(n => (
                                        <MenuItem key={n} value={n}>Top {n}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>User</TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={orderBy === 'score'}
                                            direction={orderBy === 'score' ? order : 'asc'}
                                            onClick={() => handleRequestSort('score')}
                                        >
                                            Score
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="center">Victory</TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={orderBy === 'createdAt'}
                                            direction={orderBy === 'createdAt' ? order : 'asc'}
                                            onClick={() => handleRequestSort('createdAt')}
                                        >
                                            Date
                                        </TableSortLabel>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedScores.map((entry, index) => {
                                    const isCurrentUser = entry.username === currentUsername;
                                    const isMedal = order === 'desc' && index < 3;
                                    
                                    // Set background color with proper precedence
                                    let bgColor = 'inherit';
                                    let userMedal = null;
                                    
                                    if (isMedal) {
                                        // For medal positions, use medal color (with opacity if current user)
                                        bgColor = isCurrentUser ? `${medalColors[index]}80` : medalColors[index];
                                        userMedal = index === 0 ? ' 🥇' : index === 1 ? ' 🥈' : ' 🥉';
                                    } else if (isCurrentUser) {
                                        // Non-medal current user gets blue highlight
                                        bgColor = 'rgba(33, 150, 243, 0.1)';
                                    }

                                    // Avatar color priority
                                    const avatarColor = isCurrentUser ? '#2196F3' : 
                                                       isMedal ? medalColors[index] : 
                                                       '#6A5ACD';

                                    return (
                                        <TableRow
                                            key={entry._id || index}
                                            ref={isCurrentUser ? currentUserRef : null}
                                            sx={{
                                                backgroundColor: bgColor,
                                                '&:hover': {
                                                    backgroundColor: isCurrentUser ? 'rgba(33, 150, 243, 0.2)' : 'rgba(106, 90, 205, 0.1)'
                                                }
                                            }}
                                        >
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar sx={{
                                                        bgcolor: avatarColor,
                                                        width: 32, height: 32, mr: 1
                                                    }}>
                                                        {entry.username?.[0]?.toUpperCase()}
                                                    </Avatar>
                                                    <Typography>
                                                        {entry.username}
                                                        {isCurrentUser && ' (You)'}
                                                        {userMedal}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">{entry.score}</TableCell>
                                            <TableCell align="center">
                                                {entry.isVictory ? '✅' : '❌'}
                                            </TableCell>
                                            <TableCell align="right">
                                                {new Date(entry.createdAt).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        </>
    );
};

export default TopScores;