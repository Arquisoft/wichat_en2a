import React, { useEffect, useState, useRef } from "react";
import {
    Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, CircularProgress,
    Box, TableSortLabel, Avatar, Button
} from '@mui/material';
import Navbar from './Navbar';
import FullLeaderboard from './FullLeaderboard';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

// Component for the win-rate bar showing % graphically
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

const medalEmojis = ['🥇', '🥈', '🥉'];
const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // gold, silver, bronze

// New component for the sticky player stats header
const StickyPlayerHeader = ({ player, rank, pointsToLevelUp }) => {
    const isTop3 = rank < 3;
    const bgColor = isTop3 ? medalColors[rank] : '#6A5ACD';
    
    return (
        <Paper 
            elevation={4}
            sx={{
                position: 'sticky',
                top: 0,
                zIndex: 1100,
                width: '100%',
                bgcolor: bgColor,
                color: 'white',
                borderRadius: '0 0 8px 8px',
                mb: 2,
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}
        >
            <Box sx={{ 
                p: 2, 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                        sx={{
                            bgcolor: '#fff',
                            color: bgColor,
                            width: 40, 
                            height: 40, 
                            mr: 2,
                            fontWeight: 'bold',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}
                    >
                        {player.username[0]?.toUpperCase()}
                    </Avatar>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ mr: 1 }}>
                                {player.username}
                            </Typography>
                            <Typography variant="subtitle1">
                                {isTop3 ? medalEmojis[rank] : `#${rank + 1}`}
                            </Typography>
                        </Box>
                        <Typography variant="body2">
                            Score: {player.totalScore} • Games: {player.gamesPlayed} • Avg: {player.avgPointsPerGame?.toFixed(2)}
                        </Typography>
                    </Box>
                </Box>
                
                {pointsToLevelUp !== null && (
                    <Box sx={{ 
                        bgcolor: 'rgba(0,0,0,0.2)', 
                        p: 1, 
                        borderRadius: 2,
                        minWidth: 180,
                        textAlign: 'center'
                    }}>
                        <Typography variant="body2">
                            {rank === 0 ? (
                                <span>🏆 Top Player!</span>
                            ) : (
                                <span>Points to level up: <strong>{pointsToLevelUp}</strong></span>
                            )}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Paper>
    );
};

const Leaderboard = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('totalScore');
    const [currentUsername, setCurrentUsername] = useState(null);
    const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
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

    const currentUserIndex = sortedPlayers.findIndex(p => p.username === currentUsername);
    const currentUser = currentUserIndex >= 0 ? sortedPlayers[currentUserIndex] : null;
    const isCurrentUserTop5 = currentUserIndex >= 0 && currentUserIndex < 5;
    
    // Calculate points needed to level up
    const pointsToLevelUp = React.useMemo(() => {
        if (!currentUser || currentUserIndex === 0) return null;
        
        const playerAbove = sortedPlayers[currentUserIndex - 1];
        return playerAbove.totalScore - currentUser.totalScore + 1;
    }, [sortedPlayers, currentUserIndex, currentUser]);

    // For the condensed view, show top 5 and user context if needed
    const displayPlayers = React.useMemo(() => {
        // Top 5 players
        const topPlayers = sortedPlayers.slice(0, 5);
        
        // If user is in top 5, no need for additional context
        if (isCurrentUserTop5) {
            return topPlayers;
        }
        
        // User context - show one player above and one below
        const userContext = [];
        if (currentUserIndex > 0) {
            userContext.push(sortedPlayers[currentUserIndex - 1]);
        }
        if (currentUser) {
            userContext.push(currentUser);
        }
        if (currentUserIndex < sortedPlayers.length - 1) {
            userContext.push(sortedPlayers[currentUserIndex + 1]);
        }
        
        return topPlayers.concat(userContext);
    }, [sortedPlayers, currentUser, currentUserIndex, isCurrentUserTop5]);

    // Show full leaderboard component instead if expanded
    if (showFullLeaderboard) {
        return (
            <>
                {currentUser && (
                    <StickyPlayerHeader 
                        player={currentUser} 
                        rank={currentUserIndex}
                        pointsToLevelUp={pointsToLevelUp}
                    />
                )}
                <FullLeaderboard 
                    players={sortedPlayers} 
                    currentUsername={currentUsername}
                    order={order}
                    orderBy={orderBy}
                    onRequestSort={handleRequestSort}
                    onCollapseView={() => setShowFullLeaderboard(false)}
                />
            </>
        );
    }

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

    return (
        <>
            <Navbar />
            {currentUser && (
                <StickyPlayerHeader 
                    player={currentUser} 
                    rank={currentUserIndex}
                    pointsToLevelUp={pointsToLevelUp}
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
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>🏆 Leaderboard</Typography>
                        <Typography variant="subtitle1">{players.length} Player{players.length !== 1 ? 's' : ''}</Typography>
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
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {/* Top 5 players */}
                                {sortedPlayers.slice(0, 5).map((player, index) => {
                                    const playerRank = sortedPlayers.findIndex(p => p._id === player._id);
                                    const isCurrentUser = player.username === currentUsername;
                                    const isTop3 = playerRank < 3;
                                    
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
                                        </TableRow>
                                    );
                                })}

                                {/* Three dots to expand */}
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 1, cursor: 'pointer' }} onClick={() => setShowFullLeaderboard(true)}>
                                        <Typography sx={{ color: '#6A5ACD' }}>•••</Typography>
                                    </TableCell>
                                </TableRow>

                                {/* User context if not in top 5 */}
                                {!isCurrentUserTop5 && currentUser && (
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
                </Paper>
                
                {/* Button to show full leaderboard */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button 
                        variant="contained" 
                        onClick={() => setShowFullLeaderboard(true)}
                        sx={{ 
                            bgcolor: '#3949AB',
                            '&:hover': { bgcolor: '#303F9F' }
                        }}
                    >
                        Show Full Leaderboard
                    </Button>
                </Box>
            </Box>
        </>
    );
};

export default Leaderboard;