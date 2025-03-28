import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";

const Timer = ({ duration = 40, onTimeUp, answerSelected }) => {
    const [timeLeft, setTimeLeft] = useState(duration);

    // 🔹 Reiniciar el temporizador cuando `duration` cambie
    useEffect(() => {
        setTimeLeft(duration);
    }, [duration]);

    useEffect(() => {
        if (answerSelected || timeLeft === 0) {
            if (timeLeft === 0) onTimeUp(); // Llamar a la función cuando el tiempo llega a 0
            return;
        }

        const timerInterval = setInterval(() => {
            setTimeLeft((prevTime) => prevTime - 1);
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [duration, answerSelected]); // 🔹 Se ejecuta solo cuando cambia `duration` o `answerSelected`

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
