import React, { useState, useEffect } from 'react';
import { HeartHandshake, User, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useScreenLock } from '../context/ScreenLockContext';

const LoginScreen = () => {
  const { login } = useScreenLock();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const savedUser = localStorage.getItem('savedUserData');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUsername(userData.username || '');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userData = await login(username, password);
      localStorage.setItem('lastUsername', username);
      toast.success(`Bienvenido, ${userData.nombre_completo || username}`);
    } catch (err) {
      console.log('Login error:', err);
      const errorMessage = typeof err === 'string' ? err : 'Usuario o contraseña incorrectos';
      toast.error(errorMessage);
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full">
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{
          background: 'linear-gradient(180deg, #5b2c8a 0%, #2e1065 100%)'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <HeartHandshake className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">DECE</h1>
            <p className="text-sm text-indigo-200">Sistema de Administración</p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Bienvenido al<br />
            Sistema DECE
          </h2>
          <p className="text-lg text-indigo-200 max-w-md">
            Departamento de Consejería Estudiantil. <br /> Gestiona y administra de manera eficiente.
          </p>
        </div>

        <div className="text-sm text-indigo-300">
          © {currentYear} Sistema DECE · Versión 1.1.0
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">

          <div className="lg:hidden flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #5b2c8a 0%, #7c3aed 100%)' }}
            >
              <HeartHandshake className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">DECE</h1>
            <p className="text-sm text-gray-500 mt-1">Sistema de Administración</p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Iniciar Sesión</h2>
            <p className="text-gray-600">Ingresa tus credenciales para continuar</p>
          </div>

          <div className="space-y-5">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                  className="block w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-all duration-200"
                  placeholder="Tu usuario"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={"password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                  className="block w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-all duration-200"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoading || !username || !password}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-base font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-purple-500/30"
              style={{
                background: isLoading || !username || !password
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #5b2c8a 0%, #7c3aed 100%)'
              }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          <div className="lg:hidden mt-8 text-center text-sm text-gray-500">
            <p>© {currentYear} Sistema DECE · Versión 1.1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;