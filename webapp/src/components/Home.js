import React from 'react';
import { Button, Container, Typography, Box } from '@mui/material';
import Navbar from './Navbar';
import {useNavigate} from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <>
    <Navbar />
    <Container component="main" maxWidth="md" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
      <Typography component="h3" variant="h3" sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
        Home page
      </Typography>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 4 }}>
          <Button variant="contained" color="secondary" sx={{ px: 6, py: 3, fontSize: '1.5rem' }} onClick={() => navigate('/scores')}>
            My Scores
          </Button>

          <Button variant="contained" color="primary" sx={{ px: 6, py: 3, fontSize: '1.5rem' }} onClick={() => navigate('/game')}>
            Play Game
          </Button>

          <Button variant="contained" color="success" sx={{ px: 6, py: 3, fontSize: '1.5rem' }} onClick={() => navigate('/leaderboard')}>
            Global Leaderboard
          </Button>
        </Box>
      </Box>

      <Box sx={{ position: 'absolute', bottom: 20, right: 20 }}>
        <Button variant="contained" color="error" sx={{ px: 2, py: 1, fontSize: '1rem' }} onClick={() => navigate('/login')}>
          Logout
        </Button>
      </Box>
    </Container>
    </>
  );
};

export default Home;