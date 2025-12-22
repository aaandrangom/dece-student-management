import React, { useState, useEffect } from 'react';
import LockScreen from './LockScreen';
import LoginScreen from './LoginScreen';
import { useScreenLock } from '../context/ScreenLockContext';

const SecurityWrapper = () => {
    const [showLogin, setShowLogin] = useState(false);
    const { isLocked } = useScreenLock();

    useEffect(() => {
        if (isLocked) {
            setShowLogin(false);
        }
    }, [isLocked]);

    if (showLogin) {
        return <LoginScreen />;
    }

    return <LockScreen onUnlockRequest={() => setShowLogin(true)} />;
};

export default SecurityWrapper;
