import React, {useState} from 'react';
import axios from 'axios';
import {Typography, TextField, Button, Snackbar, Link, Paper} from '@mui/material';
import {useNavigate} from "react-router-dom";
import Box from "@mui/material/Box";

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';
    const navigate = useNavigate();

    const loginUser = async () => {
        try {
            const response = await axios.post(`${apiEndpoint}/login`, {username, password});
            // Store user info in localStorage
            localStorage.setItem('userId', response.data.userId || '');
            localStorage.setItem('username', response.data.username || '');
            localStorage.setItem('token', response.data.token || '');

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
        <Box
            sx={{
                backgroundColor: "#6A5ACD",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 2,
                position: "relative",
                overflow: "hidden",
            }}
        >

            {/* Login */}
            <Box
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                    gap: 8
                }}
            >
                <Typography
                    variant="h3"
                    sx={{
                        color: "white",
                        fontWeight: "bold",
                        mb: 4,
                    }}
                >
                    Challenge your knowledge!
                </Typography>
                <Paper
                    elevation={24}
                    sx={{
                        borderRadius: "30px",
                        padding: 4,
                        width: "300px",
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "#F4F4F4"
                    }}
                >
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: "bold",
                            textAlign: "left",
                            mb: 2,
                        }}
                    >
                        Login 🧠
                    </Typography>
                    <TextField
                        name="username"
                        margin="normal"
                        fullWidth
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        sx={{
                            mb: 2,
                            backgroundColor: "#FFD700",
                            borderRadius: "8px",
                            input: { textAlign: "center", fontWeight: "bold" }
                        }}
                    />
                    <TextField
                        name="password"
                        margin="normal"
                        fullWidth
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{
                            mb: 2,
                            backgroundColor: "#FFD700",
                            borderRadius: "8px",
                            input: { textAlign: "center", fontWeight: "bold" }
                        }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={loginUser}
                        sx={{
                            mt: 1,
                            backgroundColor: "#FFD700",
                            color: "black",
                            fontWeight: "bold",
                            borderRadius: "20px",
                            '&:hover': {
                                backgroundColor: "#FFC107"
                            },
                            alignSelf: 'center'
                        }}
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
                </Paper>
                {/* Rotating question mark */}
                <Box
                    component="img"
                    label="Image"
                    src="/questionMark.webp"
                    alt="Question Mark"
                    sx={{
                        width: "30%" ,
                        animation: 'spin 6s linear infinite',
                        zIndex: 1,
                        alignSelf: 'center'
                    }}
                />
            </Box>
            {/* Footer */}
            <Typography
                sx={{
                    fontSize: "1rem",
                    color: "white",
                    mt: 3,
                    mb: 2
                }}
            >
                HappySW-RTVE
            </Typography>

            {/* Snackbars */}
            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                message="Login successful"
            />
            {error && (
                <Snackbar
                    open={!!error}
                    autoHideDuration={6000}
                    onClose={() => setError('')}
                    message={`Error: ${error}`}
                />
            )}

            {/* Keyframe animation */}
            <style>
                {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                `}
            </style>
        </Box>
    );
};

export default Login;
