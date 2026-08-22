import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const { data } = await api.get('/user');
            setUser(data.user);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const login = async (email, password, remember) => {
        const { data } = await api.post('/login', { email, password, remember });
        setUser(data.user);
        return data; // Return full data object to allow caller to check flags like .restored
    };

    const logout = async () => {
        await api.post('/logout');
        setUser(null);
    };

    const can = (permission) => user?.permissions?.includes(permission);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refresh, can }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
