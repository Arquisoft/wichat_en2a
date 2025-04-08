    import React from 'react';
    import axios from 'axios';
    import {useNavigate} from "react-router-dom";
    import AuthForm from "./AuthForm";

    const AddUser = () => {
        const navigate = useNavigate();
        const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

        const addUser = async (username, password) => {
            try{
                await axios.post(`${apiEndpoint}/adduser`, {username, password});
                navigate('/login');
            } catch(error){
                throw new Error (error.response?.data?.error || 'Login failed');
            }
        };

        return <AuthForm type="register" onSubmit={addUser}/>;
    };

    export default AddUser;