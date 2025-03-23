import { AppBar, Toolbar, Button, Box, Container } from "@mui/material";
import {useNavigate} from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  return (
      <AppBar
          position="fixed"
          color="primary"
          sx={{
            top: 0,
            left: 0,
            width: "100%",
            zIndex: 1100
          }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button color="inherit" onClick={() => navigate("/home")}>Home</Button>
              <Button color="inherit" onClick={() => navigate("/game")}>Game</Button>
              <Button color="inherit" onClick={() => navigate("/scores")}>User Scores</Button>
              <Button color="inherit" onClick={() => navigate("/leaderboard")}>Leaderboards</Button>
            </Box>
            <Box sx={{ display: "flex", ml: "auto" }}>
              <Button color="inherit" onClick={() => navigate("/")}>Log Out</Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
  );
};

export default Navbar;