import React, { useEffect, useState } from 'react';
import {Routes, Route, useNavigate} from 'react-router-dom';
import AddUser from './components/AddUser';
import Login from './components/Login';
import Home from './components/Home';
import Game from './components/Game';
import Scores from './components/Scores';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Leaderboard from './components/Leaderboard';
import axios from 'axios';
import GameOver from "./components/GameOver";

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

function App() {
    const navigate = useNavigate(); // Hook for routes
    const [error, setError] = useState(null); // state of error messages

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
            }
        };
        navigate('/login');

        initializeQuestions(); // Llama al inicializador

        /// This is only executed once, so it is not necessary to add it to the dependencies array (otherwise CI fails)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Box sx={{ width: "100vw", height: "100vh", overflowX: "hidden" }}>
            <CssBaseline/>
            {/* Muestra mensaje de error si existe */}
            {error && (
                <Typography color="error" sx={{textAlign: 'center', mt: 2}}>
                    {error}
                </Typography>
            )}

            {/* Rutas principales */}
            <Routes>
                <Route path="/login" element={<Login onLoginSuccess={
                    () => navigate('/home')} />} />
                <Route path="/register" element={<AddUser onRegisterSuccess={
                    () => navigate('/login')} />} />
                <Route path="/home" element={<Home/>}/>
                <Route path="/game" element={<Game/>}/>
                <Route path="/leaderboard" element={<Leaderboard/>}/>
                <Route path="/scores" element={<Scores/>}/>
                <Route path="/game-over" element={<GameOver/>} />
            </Routes>
        </Box>
    );
}


export default App;