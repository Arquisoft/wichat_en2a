import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');

        if (token && userId && username) {
            setUser({ token, userId, username });
        }
    }, []);

    const login = (userData) => {
        localStorage.setItem('token', userData.token);
        localStorage.setItem('userId', userData.userId);
        localStorage.setItem('username', userData.username);
        setUser(userData);
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
