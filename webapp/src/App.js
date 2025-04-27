import React, { useEffect, useState } from 'react';
import {Routes, Route, useNavigate, useLocation} from 'react-router-dom';
import AddUser from './components/AddUser';
import Login from './components/Login';
import Home from './components/Home';
import Game from './components/Game';
import Scores from './components/Scores';
import TopScores from './components/TopScores';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Leaderboard from './components/Leaderboard';
import GameOver from "./components/GameOver";
import GameModes from './components/GameModes';
import CustomGameMode from './components/CustomGameMode';
import AdminPanel from './components/AdminPanel';
import EditUser from './components/EditUser';
import {useAuth} from "./components/AuthContext";


function App() {
    const navigate = useNavigate(); // Hook for routes
    const location = useLocation();
    const [error] = useState(null); // state of error messages
    const user = useAuth();

    // Protected route for admin
    const ProtectedAdminRoute = ({ children }) => {
        if (!user.user || !user.user.isAdmin) {
            // Show an error message if the user is not admin
            return <Typography color="error" sx={{textAlign: 'center', mt: 4}}>Access denied: Admins only</Typography>;
        }
        return children;
    };

    useEffect(() => {
        if (!user.user && location.pathname !== '/register') {
            navigate('/login');
        }
        else {
            if(location.pathname === '/') {
                navigate('/home')
            }
            else{
                navigate(location.pathname);
            }
        }
    }, [user, navigate, location.pathname]);
    
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
                <Route path="/allScores" element={<TopScores/>}/>
                <Route path="/game-over" element={<GameOver/>} />
                <Route path="/gamemodes" element={<GameModes />} />
                <Route path="/gamemodes/custom" element={<CustomGameMode/>}/>
                <Route path="/admin" element={
                    <ProtectedAdminRoute>
                        <AdminPanel/>
                    </ProtectedAdminRoute>
                } />
                <Route path="/editUser" element={<EditUser/>}/>
            </Routes>
        </Box>
    );
}

export default App;