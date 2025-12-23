import React, { createContext, useContext, useState, useEffect } from 'react';

const TourContext = createContext();

export const useTour = () => useContext(TourContext);

export const TourProvider = ({ children }) => {
    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [tourActive, setTourActive] = useState(false);

    // Load state from localStorage on mount
    useEffect(() => {
        const hasSeenTour = localStorage.getItem('coinflow_tour_completed');
        if (!hasSeenTour) {
            // Auto-start for new users
            setRun(true);
            setTourActive(true);
        }
    }, []);

    const startTour = () => {
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
        localStorage.setItem('coinflow_tour_completed', 'true');
    };

    return (
        <TourContext.Provider value={{
            run,
            setRun,
            stepIndex,
            setStepIndex,
            tourActive,
            startTour,
            stopTour,
            completeTour
        }}>
            {children}
        </TourContext.Provider>
    );
};
