import React, { useEffect } from 'react';
import { Lock } from 'lucide-react';

const LockScreen = ({ onUnlockRequest }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        onUnlockRequest();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUnlockRequest]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>

      <div className="z-10 flex flex-col items-center justify-center text-center">
        <div className="mb-8">
          <Lock className="w-24 h-24 text-purple-400" strokeWidth={1.5} />
        </div>

        <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
          DECE
        </h1>

        <p className="text-purple-300 text-lg">
          Departamento de Consejería Estudiantil
        </p>
      </div>

      <div className="absolute bottom-8 text-center">
        <p className="text-slate-500 text-xs">Solo personal autorizado</p>
      </div>
    </div>
  );
};

export default LockScreen;