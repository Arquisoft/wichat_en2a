import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Grid, Button, CircularProgress, Box } from '@mui/material';
import Navbar from './Navbar';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

const gameModes = [
  { type: "flag", label: "Flags", color: "#1976d2", icon: "/flag.png" },
  { type: "car", label: "Cars", color: "#FF8C00", icon: "/car.png" },
  { type: "famous-person", label: "Famous People", color: "#6A5ACD", icon: "/star.png" },
  { type: "painting", label: "Paintings", color: "#e53935", icon: "/painting.png" },
  { type: "place", label: "Places", color: "#00897b", icon: "/place.png" },
  { type: "custom", label: "Custom Game", color: "#2e7d32", icon: "/questionMark.png" }
];

const GameModes = () => {
  const [loadingType, setLoadingType] = useState(null);
  const navigate = useNavigate();

  const handleGameModeClick = async (type) => {
    if (type === 'custom'){
      navigate('/gamemodes/custom');
      return;
    }
    setLoadingType(type);

    try {
      await fetch(`${apiEndpoint}/clear-questions`, { method: 'POST' });
      await fetch(`${apiEndpoint}/fetch-question-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionType: type, numberOfQuestions: 10 }),
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
      <Box
        sx={{
          backgroundImage: 'url(/questionMark.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: "#6A5ACD",
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          opacity: 0.25,
          zIndex: -1,
        }}
      />

      <Container maxWidth="md" sx={{ textAlign: 'center', mt: 12 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Choose your Game Mode
        </Typography>

        <Grid container spacing={3} justifyContent="center" sx={{ mt: 4 }}>
          {gameModes.map((mode, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Button
                fullWidth
                variant="contained"
                sx={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url(${mode.icon})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundBlendMode: 'overlay',
                  backgroundColor: mode.color,
                  color: 'white',
                  fontWeight: 'bold',
                  py: 3,
                  borderRadius: 2,
                  height: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  boxShadow: 4,
                  '&:hover': {
                    backgroundColor: mode.color,
                    opacity: 0.95,
                  },
                }}
                onClick={() => handleGameModeClick(mode.type)}
                disabled={!!loadingType}
              >
                {loadingType === mode.type ? (
                  <CircularProgress size={24} sx={{ color: '#ff69b4' }} />
                ) : (
                  <>
                    <img
                      src={mode.icon}
                      alt={`${mode.label} icon`}
                      width={32}
                      height={32}
                      style={{ marginBottom: 4, filter: "brightness(0) invert(1)" }}
                    />
                    {mode.label}
                  </>
                )}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
};

export default GameModes;
