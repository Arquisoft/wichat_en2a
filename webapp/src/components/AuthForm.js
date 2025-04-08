import React, {useState} from 'react';
import {
    Typography,
    TextField,
    Button,
    Snackbar,
    Link,
    Paper,
    Box
} from '@mui/material';
import {useNavigate} from 'react-router-dom';

const AuthForm = ({type, onSubmit}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const navigate = useNavigate();

    const isLogin = type === 'login';
    const title = isLogin ? 'Login 🧠' : 'Register 📝';
    const submitText = isLogin ? 'Login' : 'Register';
    const linkText = isLogin
        ? "Don't have an account? Register here."
        : 'Already have an account? Login here.';
    const linkRoute = isLogin ? '/register' : '/login';

    const handleSubmit = async () => {
        try {
            await onSubmit(username, password);
            setOpenSnackbar(true);
            setError('');
        } catch (err) {
            setError(error.response?.data?.error || `${submitText} failed`);
        }
    };

    return (
        <Box
            sx={{
                backgroundColor: "#6A5ACD",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 2,
                position: "relative",
                overflow: "hidden",
            }}
        >
            <Box
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                    gap: 8
                }}
            >
                <Typography variant="h3" sx={{color: "white", fontWeight: "bold", mb: 4}}>
                    Challenge your knowledge!
                </Typography>

                <Paper
                    elevation={24}
                    sx={{
                        borderRadius: "30px",
                        padding: 4,
                        width: "300px",
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "#F4F4F4"
                    }}
                >
                    <Typography variant="h5" sx={{fontWeight: "bold", textAlign: "left", mb: 2}}>
                        {title}
                    </Typography>

                    <TextField
                        name="username"
                        margin="normal"
                        fullWidth
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        sx={{
                            mb: 2,
                            backgroundColor: "#FFD700",
                            borderRadius: "8px",
                            input: {textAlign: "center", fontWeight: "bold"}
                        }}
                    />

                    <TextField
                        name="password"
                        margin="normal"
                        fullWidth
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{
                            mb: 2,
                            backgroundColor: "#FFD700",
                            borderRadius: "8px",
                            input: {textAlign: "center", fontWeight: "bold"}
                        }}
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        disabled={!username || !password}
                        sx={{
                            mt: 1,
                            backgroundColor: "#FFD700",
                            color: "black",
                            fontWeight: "bold",
                            borderRadius: "20px",
                            '&:hover': {
                                backgroundColor: "#FFC107"
                            },
                            alignSelf: 'center'
                        }}
                    >
                        {submitText}
                    </Button>

                    <Typography align="center" sx={{mt: 2}}>
                        <Link
                            component="button"
                            variant="body2"
                            onClick={() => navigate(linkRoute)}
                        >
                            {linkText}
                        </Link>
                    </Typography>
                </Paper>

                <Box
                    component="img"
                    src="/questionMark.webp"
                    alt="Question Mark"
                    sx={{
                        width: "30%",
                        animation: 'spin 6s linear infinite',
                        zIndex: 1,
                        alignSelf: 'center'
                    }}
                />
            </Box>

            <Typography sx={{fontSize: "1rem", color: "white", mt: 3, mb: 2}}>
                HappySW-RTVE
            </Typography>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={() => setOpenSnackbar(false)}
                message={`${submitText} successful`}
            />

            {error && (
                <Snackbar
                    open={!!error}
                    autoHideDuration={6000}
                    onClose={() => setError('')}
                    message={`Error: ${error}`}
                />
            )}

            <style>
                {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
            </style>
        </Box>
    );
};

export default AuthForm;
