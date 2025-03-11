import { AppBar, Toolbar, Button, Box, Container } from "@mui/material";

const Navbar = ({ onNavigate }) => {
  return (
    <AppBar position="fixed" color="primary" sx={{ top: 0, left: 0, width: "100%", zIndex: 1100 }}>
      <Container maxWidth="xl">
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button color="inherit" onClick={() => onNavigate("home")}>Home</Button>
            <Button color="inherit" onClick={() => onNavigate("game")}>Game</Button>
            <Button color="inherit" onClick={() => onNavigate("scores")}>User Scores</Button>
            <Button color="inherit" onClick={() => onNavigate("leaderboard")}>Leaderboards</Button>
          </Box>
          <Box sx={{ display: "flex", ml: "auto" }}>
            <Button color="inherit" onClick={() => onNavigate("login")}>Log Out</Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;