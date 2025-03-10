import React from 'react';
import axios from 'axios';
import { Container, Typography, Button, Box } from '@mui/material';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

const Game = ({ onNavigate }) => {
    
    return (
        <Container component="main" maxWidth="xl" sx={{ textAlign: 'center', mt: '2rem', minHeight: '85vh', width: '100%', px: '1rem' }}>
            <Typography component="h1" variant="h4" sx={{ mb: '2rem' }}>
                Quiz Game!
            </Typography>

            {/* Main container */}
            <Box sx={{ display: 'flex', width: '100%', minHeight: '70vh', gap: '1rem', flexDirection: 'row'}}>

                {/* Left side - Two thirds */}
                <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    
                    {/* Upper part of left side - 1 half */}
                    <Box sx={{ flex: 1, p: '1rem', border: '1px solid gray', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Typography variant="h6" sx={{ mb: '1rem' }}>Question text goes here</Typography>
                        <Button variant="contained" fullWidth sx={{ mb: '0.5rem', py: '1rem' }}>Option 1</Button>
                        <Button variant="contained" fullWidth sx={{ mb: '0.5rem', py: '1rem' }}>Option 2</Button>
                        <Button variant="contained" fullWidth sx={{ mb: '0.5rem', py: '1rem' }}>Option 3</Button>
                        <Button variant="contained" fullWidth sx={{ py: '1rem' }}>Option 4</Button>
                    </Box>

                    {/* Lower part of left side - 1 half  */}
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid gray', borderRadius: '0.5rem', width: '100%' }}>
                        <img src="https://via.placeholder.com/300" alt="Question related" style={{ width: '100%', height: 'auto', maxHeight: '100%' }} />
                    </Box>
                </Box>

                {/* Right side - 1 third */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: '1.5rem', border: '1px solid gray', borderRadius: '0.5rem', width: '100%' }}>
                    {/* LLM text space - 4/5 */}
                    <Typography variant="h6" sx={{ flex: 4 }}>Information text here</Typography>

                    {/* ? button - 1/5 */}
                    <Button variant="contained" sx={{ alignSelf: 'center', py: '1.5rem', fontSize: '1.5rem' }}>?</Button>
                </Box>
            </Box>

            {/* Back btn below */}
            <Box sx={{ mt: '2rem', display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                <Button variant="contained" color="error" onClick={() => onNavigate('home')}>
                    Back
                </Button>
            </Box>
        </Container>
    );
};

export default Game;
