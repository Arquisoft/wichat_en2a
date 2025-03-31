import React, {useState} from 'react';
import axios from 'axios';
import {Container, Typography, TextField, Button, Snackbar, Link} from '@mui/material';
import {useNavigate} from "react-router-dom";

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';
    const navigate = useNavigate();

    const loginUser = async () => {
        try {
            await axios.post(`${apiEndpoint}/login`, {username, password});
            setOpenSnackbar(true);
            navigate('/home');
        } catch (error) {
            setError(error.response?.data?.error || 'Login failed');
        }
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    return (
        <Container component="main" maxWidth="xs" sx={{marginTop: 4}}>
            <div>
                <Typography component="h1" variant="h5">
                    Login
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
                    onClick={loginUser}
                    sx={{mt: 2}}
                >
                    Login
                </Button>
                <Typography align="center" sx={{mt: 2}}>
                    <Link
                        component="button" variant="body2"
                        onClick={() => navigate('/register')}>
                        Don't have an account? Register here.
                    </Link>
                </Typography>
                <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}
                          message="Login successful"/>
                {error && (
                    <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}
                              message={`Error: ${error}`}/>
                )}
            </div>
        </Container>
    );
};

export default Login;
