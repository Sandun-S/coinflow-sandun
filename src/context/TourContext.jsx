import React, { createContext, useContext, useState, useEffect } from 'react';

const TourContext = createContext();

export const useTour = () => useContext(TourContext);

export const TourProvider = ({ children }) => {
    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [tourActive, setTourActive] = useState(false);

    const [tourType, setTourType] = useState('full'); // 'full', 'wallets', 'transactions', 'budgets', 'analytics'

    // Load state from localStorage on mount
    useEffect(() => {
        const hasSeenTour = localStorage.getItem('coinflow_tour_completed');
        if (!hasSeenTour) {
            // Auto-start for new users
            setTourType('full');
            setRun(true);
            setTourActive(true);
        }
    }, []);

    const startTour = () => {
        setTourType('full');
        setRun(true);
        setStepIndex(0);
        setTourActive(true);
    };

    const startSpecificTour = (type) => {
        setTourType(type);
        setRun(true);
        setStepIndex(0);
        setTourActive(true);
    };

    const stopTour = () => {
        setRun(false);
        setTourActive(false);
    };

    const completeTour = () => {
        stopTour();
        // Only mark 'full' tour as complete in local storage to avoid pestering again
        if (tourType === 'full') {
            localStorage.setItem('coinflow_tour_completed', 'true');
        }
    };

    const nextStep = () => {
        if (tourActive && run) {
            setStepIndex(prev => prev + 1);
        }
    };

    return (
        <TourContext.Provider value={{
            run,
            setRun,
            stepIndex,
            setStepIndex,
            tourActive,
            tourType,
            startTour,
            startSpecificTour,
            stopTour,
            completeTour,
            nextStep
        }}>
            {children}
        </TourContext.Provider>
    );
};
