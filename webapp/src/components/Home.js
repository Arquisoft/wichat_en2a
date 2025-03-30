import React from 'react';
import {Button, Container, Typography, Box} from '@mui/material';
import Navbar from './Navbar';
import {useNavigate} from "react-router-dom";

//Used to delete scroll bar
const globalStyles = document.createElement("style");
globalStyles.innerHTML = `
  body, html {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden;
  }
`;
document.head.appendChild(globalStyles);

const Home = () => {
    const navigate = useNavigate();

    return (
        <>
            <Navbar/>
            <Box sx={{
                minHeight: '100vh',
                backgroundColor: '#6A5ACD', // Purple background
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 5%',
            }}>
                {/* Left container */}
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                    <Typography component="h1" variant="h1" sx={{color: 'white', fontWeight: 'bold'}}>
                        Welcome back user_name!
                    </Typography>
                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: '#FFD700',
                            color: 'black',
                            fontWeight: 'bold',
                            padding: '15px 40px',
                            fontSize: '1.5rem',
                            borderRadius: '30px',
                            '&:hover': {backgroundColor: '#FFC107'}
                        }}
                        onClick={() => navigate('/game')}>
                        Play Game
                    </Button>
                </Box>
                {/* Imagen a la derecha */}
                <Box>
                    <img src="/questionMark.webp" alt="Trivia Logo" />
                </Box>
            </Box>
        </>
    );
};

export default Home;