import React, { useEffect, useState, useRef } from "react";
import {
    Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, CircularProgress,
    Box, TableSortLabel, Avatar, Button, TablePagination
} from '@mui/material';
import Navbar from './Navbar';
import { WinRateBar, medalEmojis, medalColors, StickyPlayerHeader, calculatePointsToLevelUp } from './LeaderboardComponents';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

const Leaderboard = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('totalScore');
    const [currentUsername, setCurrentUsername] = useState(null);
    const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const currentUserRef = useRef(null);
    
    // Add a ref to get the Navbar height
    const navbarRef = useRef(null);
    const [navbarHeight, setNavbarHeight] = useState(64); // Default height

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        setCurrentUsername(storedUsername || 'Guest');

        // Get the actual navbar height after component mounts
        if (navbarRef.current) {
            const height = navbarRef.current.getBoundingClientRect().height;
            setNavbarHeight(height);
        }

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

    const currentUserIndex = sortedPlayers.findIndex(p => p.username === currentUsername);
    const currentUser = currentUserIndex >= 0 ? sortedPlayers[currentUserIndex] : null;
    const isCurrentUserTop5 = currentUserIndex >= 0 && currentUserIndex < 5;
    
    // Calculate points needed to level up
    const pointsToLevelUp = React.useMemo(() => 
        calculatePointsToLevelUp(sortedPlayers, currentUserIndex, currentUser),
    [sortedPlayers, currentUserIndex, currentUser]);

    // Calculate which page contains the current user to auto-scroll there in full leaderboard view
    const userPage = Math.floor(currentUserIndex / rowsPerPage);

    useEffect(() => {
        // Set the page to show the current user when switching to full leaderboard
        if (showFullLeaderboard && currentUserIndex >= 0) {
            setPage(userPage);
        }
    }, [currentUserIndex, userPage, showFullLeaderboard]);

    useEffect(() => {
        // Scroll to current user after rendering
        if (currentUserRef.current) {
            currentUserRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [page, showFullLeaderboard]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Toggle between compact and full leaderboard views
    const toggleLeaderboardView = () => {
        setShowFullLeaderboard(!showFullLeaderboard);
    };

    if (loading) return (
        <>
            <Navbar ref={navbarRef} />
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '50vh', mt: 8 }}>
                <CircularProgress size={60} thickness={4} sx={{ color: '#6A5ACD' }} />
                <Typography variant="h6" sx={{ mt: 2, color: '#6A5ACD' }}>Loading Leaderboard...</Typography>
            </Box>
        </>
    );

    if (error) return (
        <>
            <Navbar ref={navbarRef} />
            <Box sx={{ my: 4, textAlign: 'center', mt: 8 }}>
                <Typography variant="h6" color="error">{error}</Typography>
            </Box>
        </>
    );

    // Get the players to display based on the view
    const displayedPlayers = showFullLeaderboard 
        ? sortedPlayers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        : sortedPlayers.slice(0, 5);

    return (
        <>
            <Navbar ref={navbarRef} />
            {currentUser && (
                <StickyPlayerHeader 
                    player={currentUser} 
                    rank={currentUserIndex}
                    pointsToLevelUp={pointsToLevelUp}
                    navbarHeight={navbarHeight}
                />
            )}
            <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2, pt: 2 }}>
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
                            🏆 {showFullLeaderboard ? 'Full Leaderboard' : 'Leaderboard'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1" sx={{ mr: 2 }}>
                                {players.length} Player{players.length !== 1 ? 's' : ''}
                            </Typography>
                            {showFullLeaderboard && (
                                <Button 
                                    variant="outlined"
                                    size="small"
                                    onClick={toggleLeaderboardView}
                                    sx={{ 
                                        color: 'white', 
                                        borderColor: 'white',
                                        '&:hover': { 
                                            borderColor: '#e0e0e0',
                                            bgcolor: 'rgba(255, 255, 255, 0.1)'
                                        }
                                    }}
                                >
                                    Show Top 5
                                </Button>
                            )}
                        </Box>
                    </Box>

                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Rank</TableCell>
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
                                    {/* Adding Points To Level Up column only in full view */}
                                    {showFullLeaderboard && (
                                        <TableCell align="right">Points To Level Up</TableCell>
                                    )}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {/* Players list */}
                                {displayedPlayers.map((player, index) => {
                                    const playerRank = sortedPlayers.findIndex(p => p._id === player._id);
                                    const isCurrentUser = player.username === currentUsername;
                                    const isTop3 = playerRank < 3;
                                    
                                    // Calculate points needed for this player to level up
                                    let pointsNeeded = null;
                                    if (playerRank > 0) {
                                        const playerAbove = sortedPlayers[playerRank - 1];
                                        pointsNeeded = playerAbove.totalScore - player.totalScore + 1;
                                    }
                                    
                                    let bgColor = 'inherit';
                                    if (isCurrentUser) {
                                        bgColor = 'rgba(33, 150, 243, 0.1)';
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
                                                {isTop3 && order === 'desc' ? 
                                                    <Typography sx={{ fontSize: '1.2rem' }}>{medalEmojis[playerRank]}</Typography> : 
                                                    <Typography>{playerRank + 1}.</Typography>
                                                }
                                            </TableCell>
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
                                                    <Typography fontWeight={isCurrentUser ? 'bold' : 'normal'}>
                                                        {player.username}
                                                        {isCurrentUser && ' (You)'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">{player.totalScore}</TableCell>
                                            <TableCell align="right">{player.gamesPlayed}</TableCell>
                                            <TableCell align="right">{player.avgPointsPerGame?.toFixed(2)}</TableCell>
                                            <TableCell align="right"><WinRateBar winRate={player.winRate} /></TableCell>
                                            {showFullLeaderboard && (
                                                <TableCell align="right">
                                                    {playerRank === 0 ? (
                                                        <Typography sx={{ color: '#66bb6a', fontWeight: 'bold' }}>
                                                            🏆 Top Player!
                                                        </Typography>
                                                    ) : pointsNeeded !== null ? (
                                                        <Typography>
                                                            {pointsNeeded}
                                                        </Typography>
                                                    ) : '-'}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })}

                                {/* Show expansion dots in compact view */}
                                {!showFullLeaderboard && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 1, cursor: 'pointer' }} onClick={toggleLeaderboardView}>
                                            <Typography sx={{ color: '#6A5ACD' }}>•••</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {/* User context if not in top 5 (only in compact view) */}
                                {!showFullLeaderboard && !isCurrentUserTop5 && currentUser && (
                                    <>
                                        {/* Show player above if exists */}
                                        {currentUserIndex > 0 && (
                                            <TableRow
                                                key={`above-${currentUserIndex}`}
                                                sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                                            >
                                                <TableCell>
                                                    <Typography>{currentUserIndex}.</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Avatar sx={{
                                                            bgcolor: '#6A5ACD',
                                                            width: 32, height: 32, mr: 1, fontSize: '0.875rem'
                                                        }}>
                                                            {sortedPlayers[currentUserIndex - 1].username[0]?.toUpperCase()}
                                                        </Avatar>
                                                        <Typography>
                                                            {sortedPlayers[currentUserIndex - 1].username}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">{sortedPlayers[currentUserIndex - 1].totalScore}</TableCell>
                                                <TableCell align="right">{sortedPlayers[currentUserIndex - 1].gamesPlayed}</TableCell>
                                                <TableCell align="right">{sortedPlayers[currentUserIndex - 1].avgPointsPerGame?.toFixed(2)}</TableCell>
                                                <TableCell align="right"><WinRateBar winRate={sortedPlayers[currentUserIndex - 1].winRate} /></TableCell>
                                            </TableRow>
                                        )}

                                        {/* Current user */}
                                        <TableRow
                                            key={`current-${currentUserIndex}`}
                                            ref={currentUserRef}
                                            sx={{ backgroundColor: 'rgba(33, 150, 243, 0.1)' }}
                                        >
                                            <TableCell>
                                                <Typography>{currentUserIndex + 1}.</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar sx={{
                                                        bgcolor: '#2196F3',
                                                        width: 32, height: 32, mr: 1, fontSize: '0.875rem'
                                                    }}>
                                                        {currentUser.username[0]?.toUpperCase()}
                                                    </Avatar>
                                                    <Typography fontWeight="bold">
                                                        {currentUser.username} (You)
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">{currentUser.totalScore}</TableCell>
                                            <TableCell align="right">{currentUser.gamesPlayed}</TableCell>
                                            <TableCell align="right">{currentUser.avgPointsPerGame?.toFixed(2)}</TableCell>
                                            <TableCell align="right"><WinRateBar winRate={currentUser.winRate} /></TableCell>
                                        </TableRow>

                                        {/* Show player below if exists */}
                                        {currentUserIndex < sortedPlayers.length - 1 && (
                                            <TableRow
                                                key={`below-${currentUserIndex}`}
                                                sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                                            >
                                                <TableCell>
                                                    <Typography>{currentUserIndex + 2}.</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Avatar sx={{
                                                            bgcolor: '#6A5ACD',
                                                            width: 32, height: 32, mr: 1, fontSize: '0.875rem'
                                                        }}>
                                                            {sortedPlayers[currentUserIndex + 1].username[0]?.toUpperCase()}
                                                        </Avatar>
                                                        <Typography>
                                                            {sortedPlayers[currentUserIndex + 1].username}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">{sortedPlayers[currentUserIndex + 1].totalScore}</TableCell>
                                                <TableCell align="right">{sortedPlayers[currentUserIndex + 1].gamesPlayed}</TableCell>
                                                <TableCell align="right">{sortedPlayers[currentUserIndex + 1].avgPointsPerGame?.toFixed(2)}</TableCell>
                                                <TableCell align="right"><WinRateBar winRate={sortedPlayers[currentUserIndex + 1].winRate} /></TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination only for full leaderboard view */}
                    {showFullLeaderboard && (
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50]}
                            component="div"
                            count={sortedPlayers.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    )}
                </Paper>
                
                {/* Button to toggle leaderboard view */}
                {!showFullLeaderboard && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Button 
                            variant="contained" 
                            onClick={toggleLeaderboardView}
                            sx={{ 
                                bgcolor: '#3949AB',
                                '&:hover': { bgcolor: '#303F9F' }
                            }}
                        >
                            Show Full Leaderboard
                        </Button>
                    </Box>
                )}
            </Box>
        </>
    );
};

export default Leaderboard;