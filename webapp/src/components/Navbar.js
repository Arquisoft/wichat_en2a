import {AppBar, Toolbar, Button, Box, Container} from "@mui/material";
import {useNavigate} from "react-router-dom";
import { useAuth } from './AuthContext';
import PropTypes from "prop-types";

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
    const { logout } = useAuth();

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
                <Toolbar sx={{display: "flex", justifyContent: "space-between"}}>
                    <Box sx={{display: "flex", gap: 2}}>
                        <Button sx={navButtonStyle} onClick={() => handleNavigation("/home")}>Home</Button>
                        <Button sx={navButtonStyle} onClick={() => handleNavigation("/gamemodes")}>Game</Button>
                        <Button sx={navButtonStyle} onClick={() => handleNavigation("/scores")}>User Scores</Button>
                        <Button sx={navButtonStyle} onClick={() => handleNavigation("/leaderboard")}>Leaderboards</Button>
                    </Box>
                    <Box sx={{display: "flex", ml: "auto"}}>
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