import React from "react";
import { Box, Typography, Avatar } from '@mui/material';

// Component for the win-rate bar showing % graphically
export const WinRateBar = ({ winRate }) => {
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

export const medalEmojis = ['🥇', '🥈', '🥉'];
export const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // gold, silver, bronze

// Modified component for the sticky player stats header
export const StickyPlayerHeader = ({ player, rank, pointsToLevelUp, navbarHeight = 64 }) => {
    const isTop3 = rank < 3;
    const bgColor = isTop3 ? medalColors[rank] : '#6A5ACD';
    
    return (
        <Box 
            sx={{
                position: 'sticky',
                top: `${navbarHeight}px`, // Usa la altura de la barra de navegación
                zIndex: 200, // 
                width: '100%',
                mb: 8, // Margen inferior para evitar que tape el contenido
                //con 6 queda pegaco, con 8 pequeño margen 
            }}
        >
            <Box 
                sx={{
                    bgcolor: bgColor,
                    color: 'white',
                    borderRadius: '0 0 8px 8px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    p: 2, 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
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
        </Box>
    );
};

// Calculate points needed to level up
export const calculatePointsToLevelUp = (players, currentUserIndex, currentUser) => {
    if (!currentUser || currentUserIndex === 0) return null;
    
    const playerAbove = players[currentUserIndex - 1];
    return playerAbove.totalScore - currentUser.totalScore + 1;
};