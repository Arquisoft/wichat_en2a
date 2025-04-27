import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Button, TextField } from '@mui/material';
import Navbar from './Navbar';
import axios from 'axios';
import { useAuth } from './AuthContext';

const EditUser = () => {
    const { user } = useAuth();
    const [username, setUsername] = useState('');
    const [profilePicture, setProfilePicture] = useState("/avatars/default.jpg");
    const [newPassword, setNewPassword] = useState('');
    const [avatarSelectorOpen, setAvatarSelectorOpen] = useState(false);

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

    useEffect(() => {
        const storedUsername = localStorage.getItem('username') || '';
        const storedProfilePicture = localStorage.getItem('profilePicture') || null;

        setUsername(storedUsername);
        setProfilePicture(storedProfilePicture);
    }, []);

    const handleAvatarClick = () => {
        setAvatarSelectorOpen(!avatarSelectorOpen);
    };

    const handleAvatarSelect = (avatarPath) => {
        setProfilePicture(avatarPath);
        setAvatarSelectorOpen(false);
    };

    const handleSaveChanges = async () => {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                console.error('User ID not found');
                return;
            }

            const updateData = {
                username: username,
                profilePicture: profilePicture,
            };

            if (newPassword) {
                updateData.password = newPassword;
            }
            const response = await axios.put(`${apiEndpoint}/users/${userId}`, updateData);

            console.log('User updated:', response.data);
            alert('Changes saved successfully!');

            if (updateData.username) {
                localStorage.setItem('username', updateData.username);
            }
            if (updateData.profilePicture) {
                localStorage.setItem('profilePicture', updateData.profilePicture);
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Failed to save changes.');
        }
    };


    return (
        <>
            <Navbar />
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    height: '100vh',
                    backgroundColor: '#6A5ACD',
                    paddingTop: '80px', // Para dejar espacio para la navbar
                    gap: 4,
                }}
            >
                {/* Avatar Section */}
                <Box onClick={handleAvatarClick} sx={{ cursor: 'pointer', marginBottom: 4 }}>
                    <Avatar
                        src={profilePicture || "/avatars/default.jpg"}
                        sx={{ width: 150, height: 150, border: '3px solid white' }}
                    />
                </Box>

                {/* Avatar Selection */}
                {avatarSelectorOpen && (
                    <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: 2,
                        marginBottom: 4
                    }}>
                        {[...Array(12)].map((_, index) => (
                            <Avatar
                                key={index}
                                src={`/avatars/avatar${index + 1}.jpg`}
                                onClick={() => handleAvatarSelect(`/avatars/avatar${index + 1}.jpg`)}
                                sx={{
                                    width: 60,
                                    height: 60,
                                    cursor: 'pointer',
                                    border: profilePicture === `/avatars/avatar${index + 1}.jpg` ? '2px solid gold' : '2px solid transparent'
                                }}
                            />
                        ))}
                    </Box>
                )}

                {/* TextFields */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '300px' }}>
                    <TextField
                        label="Username"
                        variant="filled"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        fullWidth
                        InputProps={{ sx: { backgroundColor: 'white', borderRadius: 1 } }}
                    />

                    <TextField
                        label="New Password"
                        variant="filled"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        fullWidth
                        InputProps={{ sx: { backgroundColor: 'white', borderRadius: 1 } }}
                    />
                </Box>

                {/* Save Changes Button */}
                <Button
                    variant="contained"
                    sx={{
                        backgroundColor: '#FFD700',
                        color: 'black',
                        fontWeight: 'bold',
                        borderRadius: '20px',
                        paddingX: 5,
                        '&:hover': { backgroundColor: '#FFC107' }
                    }}
                    onClick={handleSaveChanges}
                >
                    Save Changes
                </Button>
            </Box>
        </>
    );
};

export default EditUser;
