import React, { useState } from 'react';
import axios from 'axios';
import { Container, Typography, TextField, Button, Snackbar, Link } from '@mui/material';
import { useNavigate } from "react-router-dom";

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

const AddUser = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();

  const addUser = async () => {
    if (!username || !password) {
      setError('Both username and password are required');
      return;
    }

    try {
      await axios.post(`${apiEndpoint}/adduser`, { username, password });
      setOpenSnackbar(true);
      setError('');
      navigate('/login'); // Redirects to the login page once a user is registered
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed');
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ marginTop: 4 }}>
      <Typography component="h1" variant="h5">
        Add User
      </Typography>
      <TextField
        name="username"
        margin="normal"
        fullWidth
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <TextField
        name="password"
        margin="normal"
        fullWidth
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={addUser}
        disabled={!username || !password}
        sx={{ mt: 2 }}
      >
        Add User
      </Button>
      <Typography align="center" sx={{ mt: 2 }}>
        <Link component="button" variant="body2" onClick={() => navigate('/login')}>
          Already have an account? Login here.
        </Link>
      </Typography>
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar} message="User added successfully" />
      {error && (
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}
                  message={`Error: ${error}`} />
      )}
    </Container>
  );
};

export default AddUser;
