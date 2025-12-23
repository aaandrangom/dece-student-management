import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';

const ScreenLockContext = createContext();

export const useScreenLock = () => useContext(ScreenLockContext);

export const ScreenLockProvider = ({ children }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [user, setUser] = useState({ username: 'admin', name: 'Administrador' });
  const timeoutRef = useRef(null);
  
  const INACTIVITY_TIME = 5 * 60 * 1000; 

  const lockScreen = useCallback(() => {
    setIsLocked(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (!isLocked) {
      timeoutRef.current = setTimeout(() => {
        lockScreen();
      }, INACTIVITY_TIME);
    }
  }, [isLocked, lockScreen]);

  const unlockScreen = () => {
    setIsLocked(false);
  };

  const login = (userData) => {
    if (userData) {
      setUser(userData);
    }
    setHasSession(true);
    unlockScreen();
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    
    const handleActivity = () => {
      resetTimer();
    };

    if (!isLocked) {
      events.forEach(event => {
        window.addEventListener(event, handleActivity);
      });
      resetTimer();
    }

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLocked, resetTimer]);

  return (
    <ScreenLockContext.Provider value={{ isLocked, hasSession, lockScreen, unlockScreen, login, user }}>
      {children}
    </ScreenLockContext.Provider>
  );
};
