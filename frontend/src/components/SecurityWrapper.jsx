import React from 'react';
import LockScreen from './LockScreen';
import LoginScreen from './LoginScreen';
import { useScreenLock } from '../context/ScreenLockContext';

const SecurityWrapper = ({ children }) => {
    const { isLocked, hasSession, isInitializing, unlockScreen } = useScreenLock();

    if (isInitializing) {
        return <div className="h-screen w-full flex items-center justify-center bg-gray-100">Cargando sistema...</div>;
    }

    if (!hasSession) {
        return <LoginScreen />;
    }

    if (isLocked) {
        return <LockScreen onUnlockRequest={unlockScreen} />;
    }

    return <>{children}</>;
};

export default SecurityWrapper;