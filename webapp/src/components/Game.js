import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {Container, Typography, Button, Box, CircularProgress, TextField, Paper,Dialog, DialogTitle, DialogContent, DialogActions} from '@mui/material';
import Navbar from './Navbar';
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

    const [maxQuestions, setMaxQuestions] = useState(10);
    const [questionCount, setQuestionCount] = useState(0);
    const [questionText, setQuestionText] = useState('');
  
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loadingMessage, setLoadingMessage] = useState(false);
    const [score, setScore] = useState(0);

    const [questionTimer, setQuestionTimer] = useState(40);

    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

    //to show popup
    const [pendingPath, setPendingPath] = useState(null);

    const questions = [
        {type: "flag",
          question: "What country is represented by the flag shown?"
        },
        {type: "car",
          question: "Which is the car in the picture?"
        },
        {type: "famous-person",
          question: "Who's this famous person?"
        },
        {type: "dino",
          question: "Which dinosaur or prehistorical being is shown in the picture?"
        },
        {type: "place",
          question: "Which famous place is shown in the image?"
        }
    ];
    const COLORS = {
        primary: '#f5f5dc', // beige claro para botones no seleccionados
        success: '#4CAF50', // verde correcto
        error: '#F44336',   // rojo incorrecto
        hover: '#dcdcdc',   // gris clarito al pasar el mouse
        background: '#6A5ACD', // fondo azul claro
        textOnColor: '#FFFFFF',
        userBubble: '#F8BBD0', // rosa claro
        botBubble: '#FFD700'   // amarillo claro
    };

    const getGameMode = () => {
        const gameMode = localStorage.getItem('gameMode');
        if(!gameMode) return 'flag'; //default mode
        if (gameMode !== 'custom') return gameMode;
    
        const availableModes = questions.filter(q => {
            const count = parseInt(localStorage.getItem(`${q.type}Questions`) || '0');
            return count > 0;
        });
    
        if (availableModes.length === 0) return null;
    
        const shuffle = localStorage.getItem('shuffle') === 'true';
        const selectedMode = shuffle 
            ? availableModes[Math.floor(Math.random() * availableModes.length)]
            : availableModes[0];
    
        const newCount = parseInt(localStorage.getItem(`${selectedMode.type}Questions`)) - 1;
        localStorage.setItem(`${selectedMode.type}Questions`, newCount);
        
        return selectedMode.type;
    };

    const navigate = useNavigate();
    // Fetch question from the API
    const fetchQuestion = async () => {
        if (questionCount >= maxQuestions) { //Need to change the max questions as it is a param in custom
            return endGame();
        }

        try {
            console.log("Fetching question...");
            const gameMode = getGameMode();
            if (!gameMode)
                return endGame(); 
            console.log("Selected game mode: ", gameMode);
            const response = await axios.get(`${apiEndpoint}/question/${gameMode}`);
            setQuestion(response.data);
            const text = await getQuestionByType(response.data.type);
            setQuestionText(text);
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

    const skipNextQuestion = () => {
        // Espera 3 segundos antes de pasar a la siguiente pregunta
        setTimeout(() => {
            setChosenAnswer(null);  // Reseteamos la respuesta elegida
            setCorrectAnswer(null); // Reseteamos la respuesta correcta
            setIsCorrect(null);     // Reseteamos el estado de corrección
            setAnswerSelected(false);
            setMessages([]);
            setInput("");
            fetchQuestion();
        }, 3000);
    }

    const handleBackClick = () => {
        setOpenConfirmDialog(true);
    };

    const handleConfirmLeave = () => {
        setOpenConfirmDialog(false);
        navigate(pendingPath || '/gamemodes');
    };

    const handleCancelLeave = () => {
        setOpenConfirmDialog(false);
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
                question: questionText,
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

    const getQuestionByType = async (type) => {
        const match = questions.find(q => q.type === type);
        if (!match) {
          throw new Error(`No question found for type: ${type}`);
        }
        return match.question;
    }

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

            skipNextQuestion();

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

            skipNextQuestion();

        }
    };

    useEffect(() => {
        const stored = localStorage.getItem('totalQuestions');
        if (stored) {
            setMaxQuestions(parseInt(stored));
        }
        const storedLimit = parseInt(localStorage.getItem('timeLimit'));
        if (!isNaN(storedLimit) && storedLimit >= 10 && storedLimit <= 60) {
            setQuestionTimer(storedLimit);
        }
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
            <Navbar onNavigateRequest={(path) => {
                setPendingPath(path); // save where to go
                setOpenConfirmDialog(true); // show the popup
            }} />
            <Container component="main" maxWidth="xl"
                       sx={{
                           minHeight: '100vh',
                           display: 'flex',
                           flexDirection: 'column',
                           justifyContent: 'flex-start',
                           alignItems: 'stretch',
                           textAlign: 'center',
                           px: '1rem',
                           pt: '4rem',
                           backgroundColor: COLORS.background,
                           overflow: 'auto',
                       }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: '1rem' }}>
                    <Button
                        variant="outlined"
                        onClick={handleBackClick}
                        sx={{
                            color: COLORS.textOnColor,
                            borderColor: COLORS.textOnColor,
                            '&:hover': {
                                borderColor: COLORS.hover,
                                backgroundColor: COLORS.hover,
                                color: 'black'
                            }
                        }}
                    >
                        Exit
                    </Button>
                </Box>

                <Typography component="h1" variant="h4" sx={{mb: '1rem', color: COLORS.textOnColor}}>
                    Quiz Game!
                </Typography>
                <Typography variant="h6" sx={{color: COLORS.textOnColor}}>Score: {score} / {maxQuestions * 100}</Typography>

                {/* Timer */}
                <Timer key={timerKey} duration={questionTimer} onTimeUp={handleTimeUp} answerSelected={answerSelected} />

                <Box sx={{
                    display: 'flex',
                    width: '100%',
                    flexDirection: 'row',
                    gap: '1rem',
                    mt: '1rem',
                    justifyContent: 'space-between'
                }}>
                    {/* Main content - 2/3 width */}
                    <Box sx={{
                        flex: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <Typography variant="h6" sx={{mb: '0.5rem', color: COLORS.textOnColor}}>
                        {questionText}</Typography>

                        {/* Question image */}
                        <Box sx={{
                            width: '100%',
                            maxWidth: '500px',
                            border: '1px solid gray',
                            borderRadius: '0.5rem',
                            overflow: 'hidden'
                        }}>
                            {question?.imageUrl ? (
                                <img
                                    src={question.imageUrl}
                                    alt="Question related"
                                    style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                                />
                            ) : (
                                <Typography variant="h6">No image available</Typography>
                            )}
                        </Box>

                        {/* Answer buttons (2x2 grid) */}
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '1rem',
                            width: '100%',
                            maxWidth: '500px'
                        }}>
                            {question.options.map((option, index) => {
                                let bgColor = COLORS.primary;
                                let textColor = 'black';

                                // Solo cambiamos el color después de haber seleccionado una respuesta
                                if (answerSelected) {
                                    if (option === chosenAnswer) {
                                        bgColor = isCorrect ? COLORS.success : COLORS.error;
                                        textColor = COLORS.textOnColor;
                                    } else if (option === correctAnswer) {
                                        bgColor = COLORS.success;
                                        textColor = COLORS.textOnColor;
                                    }
                                }

                                return (
                                    <Button
                                        key={index}
                                        variant="contained"
                                        fullWidth
                                        sx={{
                                            py: '1rem',
                                            backgroundColor: bgColor,
                                            color: textColor,
                                            "&:hover": {
                                                backgroundColor: answerSelected ? undefined : COLORS.hover,
                                            },
                                            "&.Mui-disabled": {
                                                backgroundColor: bgColor,
                                                color: textColor,
                                                opacity: 1,
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
                    </Box>

                    {/* AI Chat - 1/3 width */}
                    <Box sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        p: '1.5rem',
                        border: '1px solid gray',
                        borderRadius: '0.5rem',
                        height: '100%',
                        minHeight: '60vh',
                        backgroundColor: COLORS.primary
                    }}>
                        <Typography variant="h6" sx={{ mb: '1rem', textAlign: 'center' }}>Get help from AI</Typography>
                        <Paper sx={{ maxHeight: '45vh', overflowY: 'auto', p: '1rem', mb: '1rem', bgColor: COLORS.primary}}>
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
                                            bgcolor: msg.sender === 'user' ? COLORS.userBubble : COLORS.botBubble
                                        }}>
                                        {msg.text}
                                    </Typography>
                                </Box>
                            ))}
                        </Paper>

                        <Box sx={{ display: 'flex', backgroundColor: COLORS.primary }}>
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
            </Container>

            <Dialog open={openConfirmDialog} onClose={handleCancelLeave}>
                <DialogTitle>Leave Game?</DialogTitle>
                <DialogContent>
                    <Typography>
                        If you leave now, your progress will be lost. Are you sure you want to exit the game?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelLeave} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmLeave} color="error">
                        Leave
                    </Button>
                </DialogActions>
            </Dialog>

        </>
    );
};

export default Game;