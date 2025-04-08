import React from 'react';
import axios from 'axios';
import {useNavigate} from "react-router-dom";
import AuthForm from './AuthForm';

const Login = () => {
    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';
    const navigate = useNavigate();

    const loginUser = async (username, password) => {
        try{
            const response = await axios.post(`${apiEndpoint}/login`, {username, password});
            // Store user info in localStorage
            localStorage.setItem('userId', response.data.userId || '');
            localStorage.setItem('username', response.data.username || '');
            localStorage.setItem('token', response.data.token || '');
            navigate('/home');
        }
        catch(error){
            throw new Error (error.response?.data?.error || 'Login failed');
        }

    };

    return <AuthForm type="login" onSubmit={loginUser}/>;
};

export default Login;
