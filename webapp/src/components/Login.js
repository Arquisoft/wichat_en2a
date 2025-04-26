import React from 'react';
import axios from 'axios';
import {useNavigate} from "react-router-dom";
import { useAuth } from './AuthContext';
import AuthForm from './AuthForm';

const Login = () => {
    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';
    const navigate = useNavigate();
    const { login } = useAuth();

    const loginUser = async (username, password) => {
        try{
            const response = await axios.post(`${apiEndpoint}/login`, {username, password});
            login({
                userId: response.data.userId || '',
                username: response.data.username || '',
                token: response.data.token || '',
                isAdmin: response.data.isAdmin || false
            });
            // Redirect based on admin status
            if (response.data.isAdmin) {
                navigate('/admin');
            } else {
                navigate('/home');
            }
        }
        catch(error){
            throw new Error (error.response?.data?.error || 'Login failed');
        }
    };

    return <AuthForm type="login" onSubmit={loginUser}/>;
};

export default Login;
