import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const { user } = useAuth();
    const [theme, setTheme] = useState('light');
    const [currency, setCurrency] = useState('USD');
    const [isLoaded, setIsLoaded] = useState(false);


    // Load settings on boot or user change
    useEffect(() => {
        if (user) {
            const storedSettings = localStorage.getItem(`settings_${user.id}`);
            if (storedSettings) {
                const parsed = JSON.parse(storedSettings);
                setTheme(parsed.theme || 'light');
                setCurrency(parsed.currency || 'USD');
            }
            setIsLoaded(true);
        }
    }, [user]);

    // Persist settings (Only if loaded)
    useEffect(() => {
        if (user && isLoaded) {
            localStorage.setItem(`settings_${user.id}`, JSON.stringify({ theme, currency }));
        }
    }, [theme, currency, user, isLoaded]);

    // Apply theme logic (Independent of user/storage)
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    return (
        <SettingsContext.Provider value={{ theme, setTheme, currency, setCurrency }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
