import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";

const Timer = ({ duration = 40, onTimeUp, answerSelected }) => {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        if (timeLeft === 0) {
            onTimeUp(); // Marca la respuesta correcta automáticamente
            return;
        }

        if (answerSelected) {
            return; // Si el usuario ya respondió, detenemos el timer
        }

        const timerInterval = setInterval(() => {
            setTimeLeft((prevTime) => prevTime - 1);
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [timeLeft, answerSelected, onTimeUp]);

    return (
        <Box sx={{ width: "100%", bgcolor: "#ddd", borderRadius: "5px", mt: 2 }}>
            <Box
                sx={{
                    width: `${(timeLeft / duration) * 100}%`,
                    bgcolor: timeLeft > 10 ? "green" : "red",
                    height: "10px",
                    transition: "width 1s linear",
                }}
            />
            <Typography variant="body2" align="center">
                {timeLeft} sec
            </Typography>
        </Box>
    );
};

export default Timer;
