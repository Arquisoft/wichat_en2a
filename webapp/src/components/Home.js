import React from 'react';
import { Button, Container, Typography, Box } from '@mui/material';

const Home = ({ onNavigate }) => {
  return (
    <Container component="main" maxWidth="md" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
      <Typography variant="h3" sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
        Home
      </Typography>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 4 }}>
          <Button variant="contained" color="secondary" sx={{ px: 6, py: 3, fontSize: '1.5rem' }} onClick={() => onNavigate('scores')}>
            My Scores
          </Button>

          <Button variant="contained" color="primary" sx={{ px: 6, py: 3, fontSize: '1.5rem' }} onClick={() => onNavigate('game')}>
            Play Game
          </Button>

          <Button variant="contained" color="success" sx={{ px: 6, py: 3, fontSize: '1.5rem' }} onClick={() => onNavigate('leaderboard')}>
            Leaderboard
          </Button>
        </Box>
      </Box>

      <Box sx={{ position: 'absolute', bottom: 20, right: 20 }}>
        <Button variant="contained" color="error" sx={{ px: 2, py: 1, fontSize: '1rem' }} onClick={() => onNavigate('login')}>
          Logout
        </Button>
      </Box>
    </Container>
  );
};

export default Home;