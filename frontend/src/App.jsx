import React from 'react';
import { ScreenLockProvider, useScreenLock } from './context/ScreenLockContext';
import SecurityWrapper from './components/SecurityWrapper';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Componente interno que consume el contexto
const MainLayout = () => {
  const { isLocked } = useScreenLock();

  if (isLocked) {
    return <SecurityWrapper />;
  }

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Header />
        
        {/* Content Area */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-gray-500 font-medium text-sm uppercase tracking-wider">Estudiantes</h2>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-800">0</p>
              <p className="text-xs text-gray-400 mt-2">Registrados en el sistema</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-gray-500 font-medium text-sm uppercase tracking-wider">Casos Activos</h2>
                <span className="p-2 bg-red-50 text-red-600 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-800">0</p>
              <p className="text-xs text-gray-400 mt-2">Requieren atención</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-gray-500 font-medium text-sm uppercase tracking-wider">Citas Pendientes</h2>
                <span className="p-2 bg-green-50 text-green-600 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-800">0</p>
              <p className="text-xs text-gray-400 mt-2">Para esta semana</p>
            </div>
          </div>

          <div className="mt-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Bienvenido al Sistema DECE</h2>
            <p className="text-gray-600 leading-relaxed">
              El sistema está configurado y listo para comenzar el desarrollo.
              La base de datos se ha inicializado correctamente.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <ScreenLockProvider>
      <MainLayout />
    </ScreenLockProvider>
  );
}

export default App;
