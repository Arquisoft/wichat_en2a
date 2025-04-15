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
import GameOver from "./components/GameOver";
import GameModes from './components/GameModes';
import CustomGameMode from './components/CustomGameMode';

function App() {
    const navigate = useNavigate(); // Hook for routes
    const [error] = useState(null); // state of error messages

    useEffect(() => {
        navigate('/login');
        // This function is safe to be used as this, we can ignore the warning
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
                <Route path="/gamemodes" element={<GameModes />} />
                <Route path="/gamemodes/custom" element={<CustomGameMode/>}/>

            </Routes>
        </Box>
    );
}


export default App;