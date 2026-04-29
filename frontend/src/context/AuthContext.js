import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_API_URL;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('uniconnect_token'));
    const [loading, setLoading] = useState(true);

    // Create an axios instance with auth header
    const authAxios = axios.create({
        baseURL: API_URL,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    // Update axios headers when token changes
    useEffect(() => {
        if (token) {
            authAxios.defaults.headers.Authorization = `Bearer ${token}`;
        } else {
            delete authAxios.defaults.headers.Authorization;
        }
    }, [token]);

    // Load user profile on mount if token exists
    const loadUser = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const response = await axios.get(`${API_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(response.data.user);
        } catch (error) {
            console.error('Failed to load user:', error);
            // Token is invalid/expired — clear it
            localStorage.removeItem('uniconnect_token');
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const login = async (email, password) => {
        const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
        const { token: newToken, user: userData } = response.data;
        localStorage.setItem('uniconnect_token', newToken);
        setToken(newToken);
        setUser(userData);
        return response.data;
    };

    const register = async (userData) => {
        const response = await axios.post(`${API_URL}/api/auth/register`, userData);
        const { token: newToken, user: newUser } = response.data;
        localStorage.setItem('uniconnect_token', newToken);
        setToken(newToken);
        setUser(newUser);
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('uniconnect_token');
        setToken(null);
        setUser(null);
    };

    const isAdmin = user?.role === 'admin';
    const isStudent = user?.role === 'student';

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            register,
            logout,
            isAdmin,
            isStudent,
            authAxios,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
