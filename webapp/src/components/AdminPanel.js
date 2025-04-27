import React, { useEffect, useState } from 'react';
import {
    Container, Typography, Box, Button, Table, TableHead, TableRow,
    TableCell, TableBody, Paper, TextField, Dialog, DialogTitle, DialogContent,
    DialogActions, Snackbar, Checkbox, FormControlLabel
} from '@mui/material';
import Navbar from './Navbar';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [editUser, setEditUser] = useState(null);
    const [editUsername, setEditUsername] = useState('');
    const [editIsAdmin, setEditIsAdmin] = useState(false);
    const [editPassword, setEditPassword] = useState('');
    const [snackbar, setSnackbar] = useState('');
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${apiEndpoint}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setUsers(data.map(u => ({ ...u, isAdmin: !!u.isAdmin })));
        } catch {
            setError('Failed to load users');
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            const res = await fetch(`${apiEndpoint}/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setSnackbar('User deleted');
                setUsers(users.filter(u => u._id !== userId));
            } else {
                const err = await res.json();
                setError(err.error || 'Delete failed');
            }
        } catch {
            setError('Delete failed');
        }
    };

    const openEdit = (user) => {
        setEditUser(user);
        setEditUsername(user.username);
        setEditIsAdmin(Boolean(user.isAdmin));
        setEditPassword('');
    };

    const handleEdit = async () => {
        try {
            const res = await fetch(`${apiEndpoint}/users/${editUser._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: editUsername,
                    isAdmin: editIsAdmin,
                    ...(editPassword && { password: editPassword })
                })
            });
            if (res.ok) {
                setSnackbar('User updated');
                setEditUser(null);
                fetchUsers();
            } else {
                const err = await res.json();
                setError(err.error || 'Update failed');
            }
        } catch {
            setError('Update failed');
        }
    };

    return (
        <>
            <Navbar />
            <Box sx={{
                minHeight: "100vh",
                width: "100vw",
                bgcolor: "#6A5ACD",
                py: 6,
                px: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
            }}>
                <Container maxWidth="md">
                    <Paper sx={{ p: 3, borderRadius: 3, bgcolor: "#F4F4F4" }}>
                        <Typography variant="h4" sx={{ mb: 2, fontWeight: "bold" }}>
                            Admin User Management
                        </Typography>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{fontWeight: "bold" }}>Username</TableCell>
                                    <TableCell sx={{fontWeight: "bold" }}>Admin</TableCell>
                                    <TableCell sx={{fontWeight: "bold" }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map(user => (
                                    <TableRow key={user._id} sx={{ backgroundColor: user.isAdmin ? '#FFFDE7' : 'white' }}>
                                        <TableCell>{user.username}</TableCell>
                                        <TableCell>
                                            {Boolean(user.isAdmin) ? (
                                                <span style={{ color: "#388e3c", fontWeight: "bold" }}>Yes</span>
                                            ) : (
                                                <span style={{ color: "#d32f2f", fontWeight: "bold" }}>No</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="outlined" color="primary" sx={{ mr: 1, borderColor: "#FFD700", color: "#6A5ACD" }} onClick={() => openEdit(user)}>
                                                Edit
                                            </Button>
                                            <Button variant="outlined" color="error" sx={{ borderColor: "#FFD700", color: "#d32f2f" }} onClick={() => handleDelete(user._id)}>
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                    <Dialog open={!!editUser} onClose={() => setEditUser(null)}>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogContent sx={{ minHeight: 120 }}>
                            <TextField
                                label="Username"
                                value={editUsername}
                                onChange={e => setEditUsername(e.target.value)}
                                fullWidth sx={{ mb: 2, mt: 1}}
                            />
                            <TextField
                                label="New Password"
                                type="password"
                                value={editPassword}
                                onChange={e => setEditPassword(e.target.value)}
                                fullWidth sx={{ mb: 2}}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={editIsAdmin}
                                        onChange={e => setEditIsAdmin(e.target.checked)}
                                        sx={{
                                            color: "#FFD700",
                                            '&.Mui-checked': { color: "#FFD700" },
                                            transform: "scale(0.9)"
                                        }}
                                    />
                                }
                                label={
                                    <span style={{ color: "#6A5ACD", fontWeight: "bold", fontSize: "0.95rem" }}>
                                        Is Admin?
                                    </span>
                                }
                                sx={{ mb: 1, ml: 1 }}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setEditUser(null)} sx={{ color: "#6A5ACD" }}>Cancel</Button>
                            <Button onClick={handleEdit} variant="contained" sx={{ backgroundColor: "#FFD700", color: "#6A5ACD", fontWeight: "bold" }}>Save</Button>
                        </DialogActions>
                    </Dialog>
                    <Snackbar
                        open={!!snackbar}
                        autoHideDuration={4000}
                        onClose={() => setSnackbar('')}
                        message={snackbar}
                    />
                    <Snackbar
                        open={!!error}
                        autoHideDuration={6000}
                        onClose={() => setError('')}
                        message={`Error: ${error}`}
                    />
                </Container>
            </Box>
        </>
    );
};

export default AdminPanel;