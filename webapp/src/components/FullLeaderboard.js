import React, { useRef, useEffect } from "react";
import {
    Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, Box, TableSortLabel,
    Avatar, Button, TablePagination
} from '@mui/material';
import { WinRateBar, medalEmojis, medalColors, StickyPlayerHeader, calculatePointsToLevelUp } from './LeaderboardComponents';

const FullLeaderboard = ({ players, currentUsername, order, orderBy, onRequestSort, onCollapseView, navbarHeight = 64 }) => {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const currentUserRef = useRef(null);

    const currentUserIndex = players.findIndex(p => p.username === currentUsername);
    const currentUser = currentUserIndex >= 0 ? players[currentUserIndex] : null;

    // Calculate which page contains the current user to auto-scroll there
    const userPage = Math.floor(currentUserIndex / rowsPerPage);

    // Calculate points needed to level up for the current user
    const pointsToLevelUp = React.useMemo(() => 
        calculatePointsToLevelUp(players, currentUserIndex, currentUser),
    [players, currentUserIndex, currentUser]);

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
        <Box sx={{ 
            maxWidth: 1200, 
            mx: 'auto', 
            p: 2, 
            pt: 2,
            // Add padding-top to account for sticky header
            mt: 2
        }}>
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
                                {/* Adding a new column for Points To Level Up */}
                                <TableCell align="right">Points To Level Up</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {displayedPlayers.map((player, index) => {
                                const playerRank = players.findIndex(p => p._id === player._id);
                                const isCurrentUser = player.username === currentUsername;
                                const isTop3 = playerRank < 3;
                                
                                // Calculate points needed for this player to level up
                                let pointsNeeded = null;
                                if (playerRank > 0) {
                                    const playerAbove = players[playerRank - 1];
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
        </Box>
    );
};

export default FullLeaderboard;