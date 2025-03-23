import React, {useState} from 'react';
import axios from 'axios';
import {Container, Typography, TextField, Button, Snackbar} from '@mui/material';
import {Typewriter} from "react-simple-typewriter";
import {useNavigate} from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [createdAt, setCreatedAt] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';
    const navigate = useNavigate();

    const loginUser = async () => {
        try {
            const response = await axios.post(`${apiEndpoint}/login`, {username, password});

            //const question = "Please, generate a greeting message for a student called " + username + " that is a student of the Software Architecture course in the University of Oviedo. Be nice and polite. Two to three sentences max.";
            const question = "Please, generate a clue that is related to Spain but without saying nothing that includes words like spain or spanish";
            const model = "empathy"
            const messageResponse = await axios.post(`${apiEndpoint}/askllm`, {question, model});
            setMessage(messageResponse.data.answer);

            // Extract data from the response
            const {createdAt: userCreatedAt} = response.data;

            setCreatedAt(userCreatedAt);
            setLoginSuccess(true);
            setOpenSnackbar(true);

            // Redirect to /home after successful login
            setTimeout(() => {
                navigate('/home');
            }, 2000);

        } catch (error) {
            setError(error.response?.data?.error || 'Login failed');
        }
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    return (
        <Container
            component="main" maxWidth="xs" sx={{marginTop: 4}}>
            {loginSuccess ? (
                <div>
                    <Typewriter
                        words={[message]} // Pass your message as an array of strings
                        cursor
                        cursorStyle="|"
                        typeSpeed={50} // Typing speed in ms
                    />
                    <Typography component="p" variant="body1" sx={{textAlign: 'center', marginTop: 2}}>
                        Your account was created on {new Date(createdAt).toLocaleDateString()}.
                    </Typography>
                </div>
            ) : (
                <div>
                    <Typography component="h1" variant="h5">
                        Login
                    </Typography>
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        variant="contained" color="primary"
                        onClick={loginUser}
                    >
                        Login
                    </Button>
                    <Snackbar
                        open={openSnackbar} autoHideDuration={6000}
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
                </div>
            )}
        </Container>
    );
};

export default Login;
