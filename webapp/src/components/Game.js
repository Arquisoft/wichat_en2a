import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {Container, Typography, Button, Box, CircularProgress, TextField, Paper} from '@mui/material';
import Navbar from './Navbar';
import './game-styles.css';
import {useNavigate} from 'react-router-dom';
import Timer from './Timer';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

const Game = () => {
    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [answerSelected, setAnswerSelected] = useState(false);

    const [correctAnswer, setCorrectAnswer] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [chosenAnswer, setChosenAnswer] = useState(null);

    const [timerKey, setTimerKey] = useState(0);

    const MAX_QUESTIONS = 10;
    const [questionCount, setQuestionCount] = useState(0);
  
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loadingMessage, setLoadingMessage] = useState(false);
    const [score, setScore] = useState(0);

    const COLORS = {
        primary: '#6A5ACD',
        success: '#4CAF50',
        error: '#F44336',
        hover: '#1565c0',
        textOnColor: 'white'
    };

    const navigate = useNavigate();
    // Fetch question from the API
    const fetchQuestion = async () => {
        if (questionCount >= MAX_QUESTIONS) {
            return endGame();
        }

        try {
            console.log("Fetching question...");
            let response = await axios.get(`${apiEndpoint}/question`);
            //if for some reason a problem occurred and the questions collection is empty, fetch
            if (!response.data || response.data.length === 0) {
                console.log("No questions found, initializing database...");
                await axios.post(`${apiEndpoint}/fetch-flag-data`);
                console.log("Database initialized. Fetching question again...");
                response = await axios.get(`${apiEndpoint}/question`);
            }
            setQuestion(response.data);
            setTimerKey((prevKey) => prevKey + 1); //to reload timer
            setQuestionCount((prevCount) => prevCount + 1);
        } catch (error) {
            console.error('Error fetching question:', error);
            setError('Failed to load question');
        } finally {
            setLoading(false);
            setAnswerSelected(false);
        }
    };

    const saveScore = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found');
            await axios.post(`${apiEndpoint}/saveActiveUserScore`, { score }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            setError('Failed to save your score');
        }
    };

    const endGame = async () => {
        setLoading(true);
        await saveScore();
        navigate('/game-over');
        setLoading(false);
    };

    const retrieveHint = async () => {
        if (!input.trim()) return;
        const newMessages = [...messages, { text: input, sender: 'user' }];
        setMessages(newMessages);
        const inputOld = input;
        setInput('');
        setLoadingMessage(true);

        try {
            const response = await axios.post(`${apiEndpoint}/askllm`, {
                question: "Which country is this flag from?", //hardcoded for now until we get more question types
                userMessage: inputOld,
                model: "gemini",
                correctAnswer: question.correctAnswer
            });
            setMessages([...newMessages, { text: response.data.answer, sender: 'bot' }]);
        } catch (error) {
            setMessages([...newMessages, { text: 'An error occurred, please try again.', sender: 'bot' }]);
        } finally {
            setLoadingMessage(false);
        }
    };

    const checkAnswer = async (answer) => {
        try {
            setChosenAnswer(answer);
            const response = await axios.post(`${apiEndpoint}/check-answer`, {
                questionId: question._id,
                selectedAnswer: answer,
            });

            setIsCorrect(response.data.isCorrect);

            if (response.data.isCorrect) setScore(prevScore => prevScore + 100);

            if (!response.data.isCorrect) {
                setCorrectAnswer(question.correctAnswer);
                // Aunque el usuario haya fallado, guardo la correcta
            }
        } catch (error) {
            console.error('Error checking answer:', error);
            setError('Failed to check answer');
        }
    };

    // Función que se ejecuta cuando el tiempo se agota
    const handleTimeUp = () => {
        if (!answerSelected) {
            setChosenAnswer(question.correctAnswer); // Marca la respuesta correcta
            setIsCorrect(false); // No fue seleccionada por el usuario, así que es incorrecta
            setCorrectAnswer(question.correctAnswer); // Muestra la respuesta correcta en verde
            setAnswerSelected(true); // Evita más respuestas
        }
    };

    useEffect(() => {
        fetchQuestion();
        // This function is safe to be used as this, we can ignore the warning
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return (
            <Container component="main" maxWidth="xl"
                       sx={{textAlign: 'center', mt: '2rem', minHeight: '85vh', width: '100%', px: '1rem'}}>
                <Typography component="h1" variant="h4" sx={{mb: '2rem'}}>
                    Quiz Game!
                </Typography>
                <CircularProgress/>
            </Container>
        );
    }

    if (error) {
        return (
            <Container component="main" maxWidth="xl"
                       sx={{textAlign: 'center', mt: '2rem', minHeight: '85vh', width: '100%', px: '1rem'}}>
                <Typography component="h1" variant="h4" sx={{mb: '2rem', color: 'red'}}>
                    {error}
                </Typography>
            </Container>
        );
    }

    return (
        <>
            <Navbar />
            <Container component="main" maxWidth="xl"
                       sx={{textAlign: 'center', mt: '0.5rem', minHeight: '85vh', width: '100%', px: '1rem'}}>
                <Typography component="h1" variant="h4" sx={{mb: '1rem'}}>
                    Quiz Game!
                </Typography>
                <Typography variant="h6">Score: {score} / {MAX_QUESTIONS * 100}</Typography>

                {/* Timer */}
                <Timer key={timerKey} duration={40} onTimeUp={handleTimeUp} answerSelected={answerSelected} />

                <Box sx={{
                    display: 'flex',
                    width: '100%',
                    minHeight: '40vh',
                    maxHeight: '60vh',
                    gap: '1rem',
                    flexDirection: 'row',
                    overflow: 'auto'
                }}>
                    {/* Left side - 1/3 (antes era 2/3) */}
                    <Box sx={{flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%'}}>
                        {/* Upper part - Question and answers */}
                        <Box sx={{
                            flex: 1,
                            p: '1rem',
                            border: '1px solid gray',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%'
                        }}>
                            <Typography variant="h6" sx={{mb: '1rem'}}>Which country is this flag from?</Typography>
                            {question.options.map((option, index) => {
                                let bgColor = COLORS.primary;

                                // Solo cambiamos el color después de haber seleccionado una respuesta
                                if (answerSelected) {
                                    if (option === chosenAnswer) {
                                        bgColor = isCorrect ? COLORS.success : COLORS.error;
                                    } else if (option === correctAnswer) {
                                        bgColor = COLORS.success;
                                    }
                                }

                                return (
                                    <Button
                                        key={index}
                                        variant="contained"
                                        fullWidth
                                        sx={{
                                            mb: '0.5rem',
                                            py: '1rem',
                                            backgroundColor: bgColor,
                                            "&:hover": {
                                                backgroundColor: answerSelected ? undefined : COLORS.hover,
                                            },
                                            "&.Mui-disabled": {
                                                backgroundColor: bgColor,
                                                color: "white", // Asegura que el texto siga siendo visible si es necesario
                                                opacity: 1, // Elimina la opacidad que Material-UI pone en los botones deshabilitados
                                            }
                                        }}
                                        disabled={!!answerSelected}
                                        onClick={() => {
                                            if (!answerSelected) {
                                                setAnswerSelected(true);
                                                checkAnswer(option);
                                            }
                                        }}
                                    >
                                        {option}
                                    </Button>
                                );
                            })}
                        </Box>

                        {/* Lower part - Hint box */}
                        <Box sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            p: '1.5rem',
                            border: '1px solid gray',
                            borderRadius: '0.5rem',
                            width: '100%',
                            overflow: 'hidden'
                        }}>
                            <Paper sx={{ maxHeight: '30vh', overflowY: 'auto', p: '1rem', border: '1px solid gray' }}>
                                {messages.map((msg, index) => (
                                    <Box key={index} sx={{ 
                                        textAlign: msg.sender === 'user' ? 'right' : 'left', 
                                        mb: '0.5rem'
                                    }}>
                                        <Typography 
                                            variant="body1" 
                                            sx={{ 
                                                display: 'inline-block',
                                                p: '0.5rem',
                                                borderRadius: '0.5rem',
                                                bgcolor: msg.sender === 'user' ? 'primary.light' : 'secondary.light'
                                            }}>
                                            {msg.text}
                                        </Typography>
                                    </Box>
                                ))}
                            </Paper>

                            <Box sx={{ display: 'flex', mt: '1rem' }}>
                                <TextField 
                                    fullWidth 
                                    variant="outlined" 
                                    placeholder="Type a message..."
                                    value={input} 
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <Button 
                                    variant="contained" 
                                    sx={{ ml: '1rem' }}
                                    onClick={retrieveHint} 
                                    disabled={loadingMessage}
                                >
                                    Send
                                </Button>
                            </Box>
                        </Box>
                    </Box>

                    {/* Right side - 2/3 (antes era 1/3) */}
                    <Box sx={{
                        flex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid gray',
                        borderRadius: '0.5rem',
                        width: '100%',
                        height: 'auto',
                        minHeight: '40vh',
                        maxHeight: '60vh',
                        overflow: 'hidden'
                    }}>
                        {question?.imageUrl ? (
                            <img src={question.imageUrl} alt="Question related"
                                 style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit'}}/>
                        ) : (
                            <Typography variant="h6">No image available</Typography>
                        )}
                    </Box>
                </Box>

                {/* Back and Next Question buttons */}
                <Box sx={{mt: '0.5rem', display: 'flex', justifyContent: 'flex-start', width: '100%'}}>
                    <Button variant="contained" color="error" onClick={() => navigate('/gamemodes')}>
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        color = 'primary'
                        disabled={!answerSelected} // Solo habilitado si se ha seleccionado una respuesta
                        onClick={() => {
                            setChosenAnswer(null);  // Reseteamos la respuesta elegida
                            setCorrectAnswer(null); // Reseteamos la respuesta correcta
                            setIsCorrect(null);     // Reseteamos el estado de corrección
                            setAnswerSelected(false);
                            setMessages([]);
                            setInput("");
                            setTimeout(() => fetchQuestion(), 100); // Cargamos nueva pregunta
                        }}
                        sx={{ ml: '1rem' }}
                    >
                        Next Question
                    </Button>

                </Box>
            </Container>
        </>
    );
};

export default Game;