import {AppBar, Toolbar, Button, Box, Container} from "@mui/material";
import {useNavigate} from "react-router-dom";
import { useAuth } from './AuthContext';
import PropTypes from "prop-types";
import { Avatar, IconButton } from "@mui/material";
import {useEffect, useState} from "react";
import axios from "axios"; // Añadimos Avatar e IconButton

const navButtonStyle = {
    backgroundColor: "#f5f5f5", // Blanco grisáceo
    color: "black",
    fontWeight: "bold",
    padding: "8px 20px",
    borderRadius: "10px",
    '&:hover': { backgroundColor: "#e0e0e0" } // Un tono más oscuro al pasar el mouse
};



const Navbar = ({ onNavigateRequest }) => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    // 1 forma
    const storedProfilePic = localStorage.getItem('profilePic');
    console.log(storedProfilePic);

    // 2 forma
    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

    const getUser = async (userId) => {
        try{
            await axios.post(`${apiEndpoint}/getUserById/${userId}`);
        } catch(error){
            throw new Error (error.response?.data?.error || 'Error getting user');
        }
    };

    // 3 forma
    const [username, setUsername] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);

    useEffect(() => {
        const storedUsername = localStorage.getItem('username') || 'Guest';
        const storedProfilePicture = localStorage.getItem('profilePicture');

        setUsername(storedUsername);
        setProfilePicture(storedProfilePicture); // Esto puede ser null si no hay foto
    }, []);

    const handleNavigation = (path) => {
        if (onNavigateRequest) {
            onNavigateRequest(path);
        } else {
            navigate(path);
        }
    };

    const handleLogout = () => {
        logout(); // Clear the user state and localStorage
        navigate('/login'); // Redirect to the login page after logout
    };

    return (
        <AppBar position="fixed" sx={{top: 0, left: 0, width: "100%", zIndex: 1100, backgroundColor: "#FFD700"}}>
            <Container maxWidth="xl">
                <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>

                    {/* Logo */}
                    <Box sx={{ display: "flex", alignItems: "center", mr: 2, cursor: "pointer" }} onClick={() => handleNavigation("/home")}>
                        <img src="/questionMark.webp" alt="App Logo" style={{ height: 40, marginRight: 8 }} />
                    </Box>

                    <Box sx={{display: "flex", gap: 2}}>
                        <Button sx={navButtonStyle} onClick={() => navigate("/home")}>Home</Button>
                        <Button sx={navButtonStyle} onClick={() => navigate("/gamemodes")}>Game</Button>
                        <Button sx={navButtonStyle} onClick={() => navigate("/scores")}>My Scores</Button>
                        <Button sx={navButtonStyle} onClick={() => navigate("/allScores")}>Top Scores</Button>
                        <Button sx={navButtonStyle} onClick={() => navigate("/leaderboard")}>Leaderboards</Button>
                    </Box>
                    <Box sx={{display: "flex", ml: "auto", alignItems: "center", gap: 2}}>
                        <IconButton onClick={() => handleNavigation("/editUser")}>
                            <Avatar
                                src={user?.profilePicture || "/avatars/default.jpg"}
                                alt="Profile Picture"
                                sx={{ bgcolor: '#FFD700', color: 'black' }}
                            >
                                {!profilePicture && username.charAt(0)}
                            </Avatar>
                        </IconButton>
                        <Button sx={navButtonStyle} onClick={() => handleLogout()}>Log Out</Button>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

Navbar.propTypes = {
    onNavigateRequest: PropTypes.func // no required as it has fallback with navigate()
};

export default Navbar;