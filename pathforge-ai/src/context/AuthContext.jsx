import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, signIn, signUp, signOut as apiSignOut } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const data = await getMe();
                    setUser(data);
                } catch (err) {
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (credentials) => {
        const data = await signIn(credentials);
        setUser(data.user);
        return data.user;
    };

    const signup = async (userData) => {
        const data = await signUp(userData);
        setUser(data.user);
        return data.user;
    };

    const logout = () => {
        apiSignOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
