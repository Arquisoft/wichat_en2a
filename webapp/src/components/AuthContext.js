import { createContext, useContext, useState, useMemo } from 'react';
import PropTypes from "prop-types";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    //Every time the application is refreshed, this is executed, so we can keep the user
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        const isAdmin = localStorage.getItem('isAdmin') === 'true';

        if (token && userId && username) {
            return { token, userId, username, isAdmin };
        }

        return null;
    })

    const login = (userData) => {
        localStorage.setItem('token', userData.token);
        localStorage.setItem('userId', userData.userId);
        localStorage.setItem('username', userData.username);
        localStorage.setItem('isAdmin', userData.isAdmin ? 'true' : 'false');
        localStorage.setItem('profilePic', userData.profilePicture);

        setUser(userData);
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    //For optimization, if the user is already created, it won't be created again
    const contextValue = useMemo(() => ({
        user,
        login,
        logout,
    }), [user])

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export const useAuth = () => useContext(AuthContext);
