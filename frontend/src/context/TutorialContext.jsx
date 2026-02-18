import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { startTutorial } from '../tutorials/index';

const TutorialContext = createContext();

export const useTutorial = () => {
    const context = useContext(TutorialContext);
    if (!context) {
        throw new Error('useTutorial debe ser usado dentro de un TutorialProvider');
    }
    return context;
};

export const TutorialProvider = ({ children }) => {
    const [isTutorialActive, setIsTutorialActive] = useState(false);
    const navigate = useNavigate();

    const runTutorial = useCallback((tutorialId) => {
        setIsTutorialActive(true);
        startTutorial(tutorialId, navigate, () => {
            setIsTutorialActive(false);
        });
    }, [navigate]);

    return (
        <TutorialContext.Provider value={{ runTutorial, isTutorialActive }}>
            {children}
        </TutorialContext.Provider>
    );
};
