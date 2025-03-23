import React, { useEffect, useState } from 'react';
import {Routes, Route, Link, useNavigate} from 'react-router-dom';
import Register from './components/Register';
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
    const navigate = useNavigate(); // Hook for routes
    const [error, setError] = useState(null); // state of error messages
    const [initializing, setInitializing] = useState(true); //state for tracking initialization

    //Load question from wikidata just when deploying the application
    useEffect(() => {
        const initializeQuestions = async () => {
            try {
                console.log("Checking and initializing question data...");
                await axios.post(`${apiEndpoint}/fetch-flag-data`);
                console.log('Database initialized successfully');
            } catch (error) {
                setError(error.response?.data?.error || 'Error initializing database');
                console.error('Error during initialization:', error);
            } finally {
                setInitializing(false); // Finaliza la inicialización
            }
        };

        initializeQuestions(); // Llama al inicializador
    }, []);

    //Load message when initializing
    if (initializing) {
        return (
            <Container component="main" maxWidth="xs">
                <CssBaseline />
                <Typography component="h1" variant="h5" align="center" sx={{ marginTop: 2 }}>
                    Initializing the game... Please wait
                </Typography>
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline/>
            <Typography component="h1" variant="h5" align="center" sx={{marginTop: 2}}>
                Welcome to our Quiz game!
            </Typography>

            {/* Muestra mensaje de error si existe */}
            {error && (
                <Typography color="error" sx={{textAlign: 'center', mt: 2}}>
                    {error}
                </Typography>
            )}

            {/* Rutas principales */}
            <Routes>
                <Route path="/" element={<Login onLoginSuccess={
                    () => navigate('/home')} />} />
                <Route path="/register" element={<Register onRegisterSuccess={
                    () => navigate('/home')} />} />
                <Route path="/home" element={<Home/>}/>
                <Route path="/game" element={<Game/>}/>
                <Route path="/leaderboard" element={<Leaderboard/>}/>
            </Routes>

            {/* Enlaces para navegación (solo visibles desde login/register) */}
            <Typography component="div" align="center" sx={{marginTop: 2}}>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <Link name="gotoregister" component="button" variant="body2"
                                  onClick={() => navigate('/register')}>
                                Don't have an account? Register here.
                            </Link>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <Link component="button" variant="body2" onClick={() => navigate('/')}>
                                Already have an account? Login here.
                            </Link>
                        }
                    />
                </Routes>
            </Typography>
        </Container>
    );
}


export default App;