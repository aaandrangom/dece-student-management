import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Login, Logout, ObtenerUsuarioSesion } from '../../wailsjs/go/services/AuthService';

const ScreenLockContext = createContext();

export const useScreenLock = () => useContext(ScreenLockContext);

export const ScreenLockProvider = ({ children }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const timeoutRef = useRef(null);

  const INACTIVITY_TIME = 5 * 60 * 1000;

  const lockScreen = useCallback(() => {
    if (hasSession) {
      setIsLocked(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [hasSession]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!isLocked && hasSession) {
      timeoutRef.current = setTimeout(() => {
        lockScreen();
      }, INACTIVITY_TIME);
    }
  }, [isLocked, lockScreen, hasSession]);

  const unlockScreen = () => {
    setIsLocked(false);
    resetTimer();
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const userData = await ObtenerUsuarioSesion();
        console.log('Sesión activa para el usuario:', userData);

        setUser(userData);
        setHasSession(true);
        setIsLocked(false);
      } catch (error) {
        console.log('No hay sesión activa.');
        setHasSession(false);
      } finally {
        setIsInitializing(false);
      }
    };

    checkSession();
  }, []);

  const performLogin = async (username, password) => {
    try {
      const userData = await Login(username, password);
      console.log('Login successful for user:', userData);
      setUser(userData);
      setHasSession(true);
      setIsLocked(false);

      localStorage.setItem('savedUserData', JSON.stringify(userData));
      return userData;
    } catch (error) {
      throw error || 'Error al iniciar sesión. Por favor, inténtelo de nuevo más tarde.';
    }
  };

  const performLogout = async () => {
    try {
      await Logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }

    setUser(null);
    setHasSession(false);
    setIsLocked(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    localStorage.removeItem('savedUserData');
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    const handleActivity = () => resetTimer();

    if (!isLocked && hasSession) {
      events.forEach(event => window.addEventListener(event, handleActivity));
      resetTimer();
    }
    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLocked, hasSession, resetTimer]);


  useEffect(() => {
    const handleLockShortcut = (e) => {
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        lockScreen();
      }
    };

    if (!isLocked && user) {
      window.addEventListener('keydown', handleLockShortcut);
    }

    return () => {
      window.removeEventListener('keydown', handleLockShortcut);
    };
  }, [isLocked, user, lockScreen]);

  return (
    <ScreenLockContext.Provider value={{
      isLocked,
      hasSession,
      isInitializing,
      user,
      lockScreen,
      unlockScreen,
      login: performLogin,
      logout: performLogout
    }}>
      {children}
    </ScreenLockContext.Provider>
  );
};