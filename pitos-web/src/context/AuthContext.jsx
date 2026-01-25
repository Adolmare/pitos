import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const isTokenExpired = (token) => {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
        } catch (e) {
            return true;
        }
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedRole = localStorage.getItem('role');
        const storedId = localStorage.getItem('id');
        const storedUsername = localStorage.getItem('username');

        if (storedToken && !isTokenExpired(storedToken)) {
            setUser({ 
                token: storedToken, 
                role: storedRole,
                id: storedId ? parseInt(storedId) : null,
                username: storedUsername
            });
        } else if (storedToken) {
             // Token expired, clear it
             logout();
        }
        setLoading(false);
    }, []);

    const login = (token, role, id, username) => {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        if (id) localStorage.setItem('id', id);
        if (username) localStorage.setItem('username', username);
        
        setUser({ token, role, id, username });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('id');
        localStorage.removeItem('username');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
