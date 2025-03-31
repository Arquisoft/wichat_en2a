import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { Typography, CircularProgress, Box } from '@mui/material';

const Scores = () => {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchUserInfo() {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No token found. Please log in.');
                }
                
                const response = await fetch("http://localhost:8000/me", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }
                
                const data = await response.json();
                setMessage(`Hola, ${data.username || data.userId}`);
                setError(null);
            } catch (error) {
                console.error("Error fetching user info:", error);
                setError(error.message || "Failed to load user info.");
            } finally {
                setLoading(false);
            }
        }
        
        fetchUserInfo();
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

    return (
        <>
            <Navbar />
            <Box sx={{ my: 2, textAlign: 'center' }}>
                {error ? (
                    <Typography color="error">{error}</Typography>
                ) : (
                    <Typography variant="h5">{message}</Typography>
                )}
            </Box>
        </>
    );
};

export default Scores;
