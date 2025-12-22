import React from 'react';
import { useScreenLock } from '../context/ScreenLockContext';

const Header = () => {
  const { user, lockScreen } = useScreenLock();

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 h-16 flex justify-between items-center px-6 z-10">
      <h1 className="text-xl font-semibold text-gray-800">Panel Principal</h1>
      
      <div className="flex items-center space-x-4">
        <div className="flex flex-col items-end mr-2">
          <span className="text-sm font-medium text-gray-700">{user.name}</span>
          <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full">Admin</span>
        </div>
        
        <div className="h-8 w-px bg-gray-200 mx-2"></div>
        
        <button 
          onClick={lockScreen}
          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
          title="Bloquear pantalla"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
