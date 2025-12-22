import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ScreenLockProvider, useScreenLock } from './context/ScreenLockContext';
import SecurityWrapper from './components/SecurityWrapper';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import GenericPage from './pages/GenericPage';
import { menuOptions } from './constants/items';

// Helper function to generate routes recursively
const generateRoutes = (items) => {
  let routes = [];
  items.forEach((item) => {
    if (item.subOptions && item.subOptions.length > 0) {
      routes = [...routes, ...generateRoutes(item.subOptions)];
    } else {
      // Skip the dashboard path as it is handled manually
      if (item.path !== '/panel-principal') {
        routes.push(
          <Route 
            key={item.path} 
            path={item.path} 
            element={<GenericPage title={item.title} />} 
          />
        );
      }
    }
  });
  return routes;
};

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
          <Routes>
            <Route path="/" element={<Navigate to="/panel-principal" replace />} />
            <Route path="/panel-principal" element={<Dashboard />} />
            {generateRoutes(menuOptions)}
            {/* Fallback for unknown routes */}
            <Route path="*" element={<GenericPage title="Página no encontrada" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <ScreenLockProvider>
      <Router>
        <MainLayout />
      </Router>
    </ScreenLockProvider>
  );
}

export default App;
