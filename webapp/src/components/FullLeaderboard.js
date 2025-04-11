import React, { useRef, useEffect } from "react";
import {
    Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, Box, TableSortLabel,
    Avatar, Button, TablePagination
} from '@mui/material';
import Navbar from './Navbar';

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

const FullLeaderboard = ({ players, currentUsername, order, orderBy, onRequestSort, onCollapseView }) => {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const currentUserRef = useRef(null);

    const currentUserIndex = players.findIndex(p => p.username === currentUsername);
    const currentUser = currentUserIndex >= 0 ? players[currentUserIndex] : null;

    // Calculate which page contains the current user to auto-scroll there
    const userPage = Math.floor(currentUserIndex / rowsPerPage);

    useEffect(() => {
        // Set the page to show the current user
        if (currentUserIndex >= 0) {
            setPage(userPage);
        }
    }, [currentUserIndex, userPage]);

    useEffect(() => {
        // Scroll to current user after rendering
        if (currentUserRef.current) {
            currentUserRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [page]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Get the current page's players
    const displayedPlayers = players.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>🏆 Full Leaderboard</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1" sx={{ mr: 2 }}>
                                {players.length} Player{players.length !== 1 ? 's' : ''}
                            </Typography>
                            <Button 
                                variant="outlined"
                                size="small"
                                onClick={onCollapseView}
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
                                                onClick={() => onRequestSort(key)}
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
                                {displayedPlayers.map((player, index) => {
                                    const playerRank = players.findIndex(p => p._id === player._id);
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
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div"
                        count={players.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
                
                {/* Always show the current user's stats at the bottom */}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                            <Box sx={{ width: '50px', textAlign: 'center' }}>
                                {currentUserIndex < 3 && order === 'desc' ? 
                                    <Typography sx={{ fontSize: '1.2rem' }}>{medalEmojis[currentUserIndex]}</Typography> : 
                                    <Typography>#{currentUserIndex + 1}</Typography>
                                }
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 2 }}>
                                <Avatar sx={{ bgcolor: '#2196F3', width: 32, height: 32, mr: 1 }}>
                                    {currentUser.username[0]?.toUpperCase()}
                                </Avatar>
                                <Typography fontWeight="bold">
                                    {currentUser.username} (You)
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1, textAlign: 'right' }}>{currentUser.totalScore}</Box>
                            <Box sx={{ flex: 1, textAlign: 'right' }}>{currentUser.gamesPlayed}</Box>
                            <Box sx={{ flex: 1, textAlign: 'right' }}>{currentUser.avgPointsPerGame?.toFixed(2)}</Box>
                            <Box sx={{ flex: 1.5, '& .MuiTypography-root': { color: 'white' } }}>
                                <WinRateBar winRate={currentUser.winRate} />
                            </Box>
                        </Box>
                    </Paper>
                )}
            </Box>
        </>
    );
};

export default FullLeaderboard;