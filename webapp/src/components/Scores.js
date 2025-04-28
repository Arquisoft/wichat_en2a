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
    Box,
    TableSortLabel,
    TablePagination
} from '@mui/material';
import Navbar from './Navbar';

const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze

const Scores = () => {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('score');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        async function fetchScores() {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                if (!token) throw new Error('No token found. Please log in.');

                const response = await fetch("http://localhost:8000/scores", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error(`Error: ${response.status}`);

                const data = await response.json();
                setScores(data);
                setError(null);
            } catch (error) {
                console.error("Error fetching scores:", error);
                setError(error.message || "Failed to load scores. Try again later.");
            } finally {
                setLoading(false);
            }
        }

        fetchScores();
    }, []);

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangePage = (_, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const sortedScores = React.useMemo(() => {
        const comparator = (a, b) => {
            let aValue = a[orderBy];
            let bValue = b[orderBy];

            if (orderBy === 'createdAt') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            } else if (orderBy === 'isVictory') {
                aValue = aValue ? 1 : 0;
                bValue = bValue ? 1 : 0;
            }

            if (order === 'asc') return aValue > bValue ? 1 : -1;
            return aValue < bValue ? 1 : -1;
        };

        return [...scores].sort(comparator);
    }, [scores, order, orderBy]);

    const paginatedScores = sortedScores.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    if (loading) {
        return (
            <>
                <Navbar />
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '50vh',
                    mt: 8
                }}>
                    <CircularProgress size={60} thickness={4} sx={{ color: '#6A5ACD' }} />
                    <Typography variant="h6" sx={{ mt: 2, color: '#6A5ACD' }}>
                        Loading Scores...
                    </Typography>
                </Box>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <Box sx={{ my: 4, textAlign: 'center', mt: 8 }}>
                    <Typography variant="h6" color="error">
                        {error}
                    </Typography>
                </Box>
            </>
        );
    }

    // Filter only victories for medals when in desc order
    const getVictoriesForMedals = () => {
        if (order === 'desc' && orderBy === 'score') {
            return sortedScores.filter(score => score.isVictory);
        }
        return [];
    };

    const victoriesForMedals = getVictoriesForMedals();

    return (
        <>
            <Navbar />
            <Box sx={{
                maxWidth: 1000,
                mx: 'auto',
                p: 2,
                pt: 10,
                mt: 2
            }}>
                <Paper
                    elevation={3}
                    sx={{
                        width: '100%',
                        overflow: 'hidden',
                        borderRadius: 2,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}
                >
                    <Box sx={{
                        p: 2,
                        bgcolor: '#6A5ACD',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            📊 Your Game History
                        </Typography>
                        <Typography variant="subtitle1">
                            {scores.length} Game{scores.length !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                    <TableContainer sx={{ maxHeight: 500 }}>
                        <Table stickyHeader aria-label="scores table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'score'}
                                            direction={orderBy === 'score' ? order : 'asc'}
                                            onClick={() => handleRequestSort('score')}
                                        >
                                            Score
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={orderBy === 'createdAt'}
                                            direction={orderBy === 'createdAt' ? order : 'asc'}
                                            onClick={() => handleRequestSort('createdAt')}
                                        >
                                            Date
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={orderBy === 'isVictory'}
                                            direction={orderBy === 'isVictory' ? order : 'asc'}
                                            onClick={() => handleRequestSort('isVictory')}
                                        >
                                            Victory
                                        </TableSortLabel>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedScores.length > 0 ? (
                                    paginatedScores.map((score, index) => {
                                        // Determine if this should have a medal (only for victories in desc order)
                                        const victoryIndex = victoriesForMedals.findIndex(v => v === score);
                                        const isTop3Victory = victoryIndex >= 0 && victoryIndex < 3;
                                        
                                        // Set background color based on victory/defeat and medal status
                                        let bgColor = 'inherit';
                                        
                                        if (!score.isVictory) {
                                            bgColor = 'rgba(244, 67, 54, 0.1)'; // Light red for defeats
                                        } else if (isTop3Victory) {
                                            bgColor = medalColors[victoryIndex]; // Medal color for top 3 victories
                                        }
                                        
                                        const fontWeight = isTop3Victory ? 'bold' : 'normal';

                                        return (
                                            <TableRow
                                                key={index}
                                                sx={{
                                                    backgroundColor: bgColor,
                                                    '&:hover': { 
                                                        backgroundColor: isTop3Victory ? bgColor : 
                                                                      !score.isVictory ? 'rgba(244, 67, 54, 0.2)' : 
                                                                      'rgba(106, 90, 205, 0.1)'
                                                    }
                                                }}
                                            >
                                                <TableCell 
                                                    sx={{ 
                                                        color: !score.isVictory ? 'error.main' : 'inherit',
                                                        fontWeight
                                                    }}
                                                >
                                                    {score.score}
                                                    {isTop3Victory && victoryIndex === 0 && ' 🥇'}
                                                    {isTop3Victory && victoryIndex === 1 && ' 🥈'}
                                                    {isTop3Victory && victoryIndex === 2 && ' 🥉'}
                                                </TableCell>
                                                <TableCell 
                                                    align="right"
                                                    sx={{ color: !score.isVictory ? 'error.main' : 'inherit' }}
                                                >
                                                    {new Date(score.createdAt).toLocaleString()}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography color={score.isVictory ? 'success.main' : 'error.main'}>
                                                        {score.isVictory ? '✅' : '❌'}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center">
                                            <Typography sx={{ py: 3, color: 'text.secondary' }}>
                                                No scores available
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={sortedScores.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
            </Box>
        </>
    );
};

export default Scores;