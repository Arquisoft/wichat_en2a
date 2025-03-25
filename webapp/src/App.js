import React, { useState } from 'react';
import AddUser from './components/AddUser';
import Login from './components/Login';
import Home from './components/Home';
import Game from './components/Game';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Leaderboard from './components/Leaderboard';
import axios from 'axios';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

function App() {
  const [view, setView] = useState('login'); // Possible values: 'login', 'register', 'home', 'game'
  const [error, setError] = useState(null);

  // Handle whether authentication (login/register) worked, and show the Home view if it did by default.
  // Otherwise, go to the provided view
  const handleAuthSuccess = async (nextView = 'home') => {
    if (nextView =='home'){
      try {
        // Fetch flag data to load questions in the database
        await axios.post(`${apiEndpoint}/fetch-flag-data`);
        console.log('Flag data loaded successfully');
      } catch (error) {
        setError(error.response?.data?.error || 'Fetching flags failed');
        console.error('Error fetching flag data:', error);
      }
    }

    setView(nextView);
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Typography component="h1" variant="h5" align="center" sx={{ marginTop: 2 }}>
        Welcome to our Quiz game!
      </Typography>

      {/* Show error message if exists */}
      {error && (
        <Typography color="error" sx={{ textAlign: 'center', mt: 2 }}>
          {error}
        </Typography>
      )}

      {/* Show the correct view depending on the current view */}
      {view === 'login' && <Login onLoginSuccess={handleAuthSuccess} />}
      {view === 'register' && <AddUser onRegisterSuccess={handleAuthSuccess} />}
      {view === 'home' && <Home onNavigate={setView} />}
      {view === 'leaderboard' && <Leaderboard onNavigate={setView} />}
      {view === 'game' && <Game onNavigate={setView} />}
    </Container>
  );
}

export default App;
