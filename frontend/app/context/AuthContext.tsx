'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface User {
    id: number;
    username: string;
    email: string;
    profile_picture_url?: string | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    setToken: (token: string) => void; // For OAuth callback
    login: (email: string, password: string) => Promise<void>;
    signup: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setTokenState] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const setToken = (newToken: string) => {
        setTokenState(newToken);
        localStorage.setItem('arc_token', newToken);
        fetchCurrentUser(newToken);
    };

    useEffect(() => {
        // Check for stored token on mount
        const storedToken = localStorage.getItem('arc_token');
        if (storedToken) {
            setTokenState(storedToken);
            fetchCurrentUser(storedToken);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchCurrentUser = async (authToken: string) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.data.user);
            } else {
                // DO NOT clear token on 401 - it might be a valid new token that just needs time
                console.warn('Failed to fetch user, but keeping token:', response.status);
                // Token stays in localStorage for OAuth users to complete setup
            }
        } catch (error) {
            console.error('Fetch user error:', error);
            // DO NOT clear token on error - OAuth users need it to complete setup
        } finally {
            setLoading(false);
        }
    };

    const signup = async (username: string, email: string, password: string) => {
        const response = await fetch(`${API_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
        }

        const newToken = data.data.token;
        setTokenState(newToken);
        setUser(data.data.user);
        localStorage.setItem('arc_token', newToken);
    };

    const login = async (email: string, password: string) => {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        const newToken = data.data.token;
        setTokenState(newToken);
        setUser(data.data.user);
        localStorage.setItem('arc_token', newToken);
    };

    const logout = () => {
        setTokenState(null);
        setUser(null);
        localStorage.removeItem('arc_token');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                setToken,
                login,
                signup,
                logout,
                isAuthenticated: !!user,
                loading
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
