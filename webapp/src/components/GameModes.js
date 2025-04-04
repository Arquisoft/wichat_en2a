import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Grid, Button, CircularProgress } from '@mui/material';
import Navbar from './Navbar';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

const gameModes = [
  {type: "flag", label: "Flags", color: "#1976d2"},
  {type: "videogame", label: "Videogames", color: "#FFD700"},
  {type: "famous-person", label: "Famous People", color: "#6A5ACD"},
  {type: "car", label: "Logo", color: "#e53935"},
  {type: "building", label: "Buildings", color: "#00897b"},
  {type: "custom", label: "Custom Game", color: "#2e7d32"}
];

const GameModes = () => {
  const [loadingType, setLoadingType] = useState(null);
  const navigate = useNavigate();

  const handleGameModeClick = async (type) => {
    if (type === 'custom') {
      // Personalized Game Mode in the future
      return;
    }

    setLoadingType(type);

    try {
      await fetch(`${apiEndpoint}/clear-questions`, {method: 'POST'});
      await fetch(`${apiEndpoint}/fetch-question-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({questionType: type, numberOfQuestions: 10}),
      });

      navigate('/game');
    } catch (error) {
      console.error('Error loading questions:', error);
      setLoadingType(null);
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ textAlign: 'center', mt: 12 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Choose your Game Mode
        </Typography>
        <Grid container spacing={3} justifyContent="center" sx={{ mt: 4 }}>
          {gameModes.map((mode, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Button
                fullWidth
                variant="contained"
                sx={{
                  backgroundColor: mode.color,
                  color: 'white',
                  fontWeight: 'bold',
                  py: 2,
                  '&:hover': {
                    backgroundColor: mode.color,
                    opacity: 0.9,
                  },
                }}
                onClick={() => handleGameModeClick(mode.type)}
                disabled={!!loadingType}
              >
                {loadingType === mode.type ? <CircularProgress size={24} color="inherit" /> : mode.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
};

export default GameModes;
