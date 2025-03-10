import React, { useState } from 'react';
import AddUser from './components/AddUser';
import Login from './components/Login';
import Home from './components/Home';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Leaderboard from './components/Leaderboard';

function App() {
  const [view, setView] = useState('login'); // Possible values: 'login', 'register', 'home'

  // Handle whether authentication (login/register) worked, and show the Home view if it did by default.
  // Otherwise go to the provided view
  const handleAuthSuccess = (nextView = 'home') => {
    setView(nextView);
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Typography component="h1" variant="h5" align="center" sx={{ marginTop: 2 }}>
        Welcome to our Quiz game!
      </Typography>

      {/* Show the correct view depending on the current view */}
      {view === 'login' && <Login onLoginSuccess={handleAuthSuccess} />}
      {view === 'register' && <AddUser onRegisterSuccess={handleAuthSuccess} />}
      {view === 'home' && <Home onNavigate={setView} />}
      {view === 'leaderboard' && <Leaderboard onNavigate={setView} />}
      
      {/*Links to navigate through views*/}
      <Typography component="div" align="center" sx={{ marginTop: 2 }}>
        {view === 'login' && (
          <Link name="gotoregister" component="button" variant="body2" onClick={() => setView('register')}>
            Don't have an account? Register here.
          </Link>
        )}
        {view === 'register' && (
          <Link component="button" variant="body2" onClick={() => setView('login')}>
            Already have an account? Login here.
          </Link>
        )}
      </Typography>
    </Container>
  );
}

export default App;