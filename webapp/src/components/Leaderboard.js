import React, { useEffect, useState, useRef } from "react";
import {
    Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, CircularProgress,
    Box, TableSortLabel, Avatar, TablePagination
} from '@mui/material';
import Navbar from './Navbar';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

//component for the win-rate bar showing % graphically
const WinRateBar = ({ winRate }) => {
    const rate = parseFloat(winRate) || 0;
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Box sx={{ width: '100%', mr: 1, position: 'relative' }}>
                <Box sx={{ width: '100%', height: 8, borderRadius: 5, backgroundColor: '#ef5350' }} />
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${rate}%`,
                    height: 8,
                    borderRadius: 5,
                    backgroundColor: '#66bb6a'
                }} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                    {`${rate.toFixed(2)}%`}
                </Typography>
            </Box>
        </Box>
    );
};

const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // gold, silver, bronze

const Leaderboard = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('totalScore');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentUsername, setCurrentUsername] = useState(null);
    const currentUserRef = useRef(null);

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        setCurrentUsername(storedUsername || 'Guest');

        async function fetchLeaderboard() {
            try {
                setLoading(true);
                const response = await fetch(`${apiEndpoint}/leaderboard`);
                if (!response.ok) throw new Error(`Error: ${response.status}`);
                const data = await response.json();
                setPlayers(data);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
                setError("Failed to load leaderboard data.");
            } finally {
                setLoading(false);
            }
        }

        fetchLeaderboard();
    }, []);

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedPlayers = React.useMemo(() => {
        const comparator = (a, b) => {
            const aVal = a[orderBy] ?? 0;
            const bVal = b[orderBy] ?? 0;
            return order === 'desc' ? bVal - aVal : aVal - bVal;
        };
        return [...players].sort(comparator);
    }, [players, order, orderBy]);

    const currentUser = sortedPlayers.find(p => p.username === currentUsername);
    const currentUserRank = sortedPlayers.findIndex(p => p.username === currentUsername);
    const isCurrentUserTop3 = currentUserRank >= 0 && currentUserRank < 3;
    
    const paginatedPlayers = sortedPlayers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    useEffect(() => {
        if (currentUserRef.current) {
            currentUserRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [loading]);

    if (loading) return (
        <>
            <Navbar />
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '50vh', mt: 8 }}>
                <CircularProgress size={60} thickness={4} sx={{ color: '#6A5ACD' }} />
                <Typography variant="h6" sx={{ mt: 2, color: '#6A5ACD' }}>Loading Leaderboard...</Typography>
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

    const renderUserMedal = () => {
        if (currentUserRank === 0) return ' 🥇';
        if (currentUserRank === 1) return ' 🥈';
        if (currentUserRank === 2) return ' 🥉';
        return ` #${currentUserRank + 1}`;
    };

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
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>🏆 Leaderboard</Typography>
                        <Typography variant="subtitle1">{players.length} Player{players.length !== 1 ? 's' : ''}</Typography>
                    </Box>

                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>User</TableCell>
                                    {['totalScore', 'gamesPlayed', 'avgPointsPerGame', 'winRate'].map((key) => (
                                        <TableCell key={key} align="right">
                                            <TableSortLabel
                                                active={orderBy === key}
                                                direction={orderBy === key ? order : 'asc'}
                                                onClick={() => handleRequestSort(key)}
                                            >
                                                {{
                                                    totalScore: 'Total Score',
                                                    gamesPlayed: 'Games',
                                                    avgPointsPerGame: 'Avg. Score',
                                                    winRate: 'Win-rate'
                                                }[key]}
                                            </TableSortLabel>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedPlayers.map((player, index) => {
                                    const globalIndex = page * rowsPerPage + index;
                                    const playerRank = sortedPlayers.findIndex(p => p._id === player._id);
                                    const isCurrentUser = player.username === currentUsername;
                                    const isTop3 = playerRank < 3;
                                    
                                    // Determine color logic based on rank
                                    let bgColor = 'inherit';
                                    
                                    // Current user highlight before
                                    if (isCurrentUser) {
                                        bgColor = 'rgba(33, 150, 243, 0.1)';
                                    }

                                    //if user logged is 1-3 takes the medal color
                                    if (isTop3 && order === 'desc') {
                                        bgColor = medalColors[playerRank];
                                    }
                                    

                                    return (
                                        <TableRow
                                            key={player._id || index}
                                            ref={isCurrentUser ? currentUserRef : null}
                                            sx={{
                                                backgroundColor: bgColor,
                                                '&:hover': { backgroundColor: isCurrentUser ? 'rgba(33, 150, 243, 0.2)' : 'rgba(106, 90, 205, 0.1)' }
                                            }}
                                        >
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar sx={{
                                                        bgcolor: isCurrentUser ? '#2196F3' : 
                                                                isTop3 && order === 'desc' ? medalColors[playerRank] : 
                                                                '#6A5ACD',
                                                        width: 32, height: 32, mr: 1, fontSize: '0.875rem'
                                                    }}>
                                                        {player.username[0]?.toUpperCase()}
                                                    </Avatar>
                                                    <Typography>
                                                        {player.username}
                                                        {order === 'desc' && playerRank === 0 && ' 🥇'}
                                                        {order === 'desc' && playerRank === 1 && ' 🥈'}
                                                        {order === 'desc' && playerRank === 2 && ' 🥉'}
                                                        {isCurrentUser && ' (You)'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">{player.totalScore}</TableCell>
                                            <TableCell align="right">{player.gamesPlayed}</TableCell>
                                            <TableCell align="right">{player.avgPointsPerGame?.toFixed(2)}</TableCell>
                                            <TableCell align="right"><WinRateBar winRate={player.winRate} /></TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[10]}
                        component="div"
                        count={players.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                    />
                </Paper>
                
                {currentUser && (
                    <Paper 
                        elevation={3}
                        sx={{
                            mt: 2,
                            mb: 2,
                            p: 1,
                            bgcolor: '#3949AB',
                            color: 'white',
                            borderRadius: 2
                        }}
                    >
                        <TableRow sx={{ display: 'flex', alignItems: 'center' }}>
                            <TableCell sx={{ flex: 2, border: 'none', padding: 1, color: 'white' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar sx={{ bgcolor: '#2196F3', width: 32, height: 32, mr: 1 }}>
                                        {currentUser.username[0]?.toUpperCase()}
                                    </Avatar>
                                    <Typography fontWeight="bold">
                                        {currentUser.username} (You)
                                        {isCurrentUserTop3 && order === 'desc' && renderUserMedal()}
                                        {(!isCurrentUserTop3 || order !== 'desc') && ` #${currentUserRank + 1}`}
                                    </Typography>
                                </Box>
                            </TableCell>
                            <TableCell sx={{ flex: 1, border: 'none', padding: 1, color: 'white', textAlign: 'right' }}>
                                {currentUser.totalScore}
                            </TableCell>
                            <TableCell sx={{ flex: 1, border: 'none', padding: 1, color: 'white', textAlign: 'right' }}>
                                {currentUser.gamesPlayed}
                            </TableCell>
                            <TableCell sx={{ flex: 1, border: 'none', padding: 1, color: 'white', textAlign: 'right' }}>
                                {currentUser.avgPointsPerGame?.toFixed(2)}
                            </TableCell>
                            <TableCell sx={{ flex: 2, border: 'none', padding: 1, color: 'white', textAlign: 'right' }}>
                                <Box sx={{ '& .MuiTypography-root': { color: 'white' } }}>
                                    <WinRateBar winRate={currentUser.winRate} />
                                </Box>
                            </TableCell>
                        </TableRow>
                    </Paper>
                )}
            </Box>
        </>
    );
};

export default Leaderboard;