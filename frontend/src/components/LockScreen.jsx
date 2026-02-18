import React, { useState, useRef, useEffect } from 'react';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useScreenLock } from '../context/ScreenLockContext';
import { Login } from '../../wailsjs/go/services/AuthService';
import { toast } from 'sonner';

const LockScreen = ({ onUnlockRequest }) => {
  const { user } = useScreenLock();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus automático al montar
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Mantener el foco
    const handleClick = () => {
      if (inputRef.current) inputRef.current.focus();
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    setError(false);

    try {
      if (user && user.nombre_usuario) {
        await Login(user.nombre_usuario, password);
        onUnlockRequest();
        toast.success("Sesión restaurada");
      } else {
        toast.error("Error de estado de usuario. Reinicie la aplicación.");
      }
    } catch (err) {
      setError(true);
      toast.error("Contraseña incorrecta");
      setPassword('');
      setTimeout(() => inputRef.current?.focus(), 100);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>

      <div className="z-10 flex flex-col items-center justify-center text-center w-full max-w-sm px-6">
        <div className="mb-8 relative">
          <div className="w-24 h-24 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shadow-2xl animate-pulse">
            <Lock className="w-10 h-10 text-purple-300" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
          {user?.nombre_completo || 'Usuario'}
        </h1>

        <p className="text-purple-300/70 text-sm mb-8">
          Sesión bloqueada por inactividad
        </p>

        <form onSubmit={handleUnlock} className="w-full relative group">
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            className={`w-full bg-white/10 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-xl py-3.5 pl-4 pr-12 text-white placeholder-purple-200/30 focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500/50' : 'focus:ring-purple-500/50'} backdrop-blur-sm transition-all text-center tracking-widest shadow-lg`}
            placeholder="Ingresa tu contraseña"
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading || !password}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white transition-all duration-200 ${password ? 'bg-purple-600 hover:bg-purple-500 opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}`}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 text-center space-y-2">
          <p className="text-slate-500 text-xs">Ingrese su contraseña para continuar</p>
        </div>
      </div>

      <div className="absolute bottom-8 text-center text-white/10 text-xs">
        Sistema de Gestión Estudiantil DECE
      </div>
    </div>
  );
};

export default LockScreen;