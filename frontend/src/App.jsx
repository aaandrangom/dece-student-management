import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ScreenLockProvider, useScreenLock } from './context/ScreenLockContext';
import { NotificationsProvider } from './context/NotificationsContext';
import SecurityWrapper from './components/SecurityWrapper';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

import Dashboard from './pages/Common/Dashboard';
import NotificationsPage from './pages/Common/NotificationsPage';
import SystemSettings from './pages/Common/SystemSettings';

import InstitutionSettings from './pages/Institution/InstitutionSettings';
import UserSystem from './pages/Institution/UserSystem';

import AcademicYearsPage from './pages/academic/AcademicYears';
import LevelsPage from './pages/Academic/Level';
import SubjectsPage from './pages/Academic/Subjects';

import TeachersPage from './pages/faculty/Teachers';
import CoursesPage from './pages/faculty/Courses';

import StudentsPage from './pages/student/Student';
import StudentFormPage from './pages/student/StudentFormPage';
import StudentModifications from './pages/student/StudentModifications';

import EnrollmentManager from './pages/Enrollment/EnrollmentManager';

import DisciplineManagerPage from './pages/Tracking/DisciplineManagerPage';

import MeetingManager from './pages/Management/MeetingManager';
import TrainingManager from './pages/Management/TrainingManager';
import FichaEstudiantilReport from './pages/Reports/FichaEstudiantilReport';
import ReporteEstadistico from './pages/Reports/ReporteEstadistico';
import ReporteNominaVulnerabilidad from './pages/Reports/ReporteNominaVulnerabilidad';
import ReporteBitacoraGestion from './pages/Reports/ReporteBitacoraGestion';
import ReporteDerivaciones from './pages/Reports/ReporteDerivaciones';


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

        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/panel-principal" replace />} />

            <Route path="/panel-principal" element={<Dashboard />} />
            <Route path="/notificaciones" element={<NotificationsPage />} />
            <Route path="/configuraciones" element={<SystemSettings />} />
            <Route path="/institucion/configuracion-general" element={<InstitutionSettings />} />
            <Route path="/institucion/usuarios-sistema" element={<UserSystem />} />

            <Route path="/gestion-academica/periodos-lectivos" element={<AcademicYearsPage />} />
            <Route path="/gestion-academica/niveles" element={<LevelsPage />} />
            <Route path="/gestion-academica/materias" element={<SubjectsPage />} />

            <Route path="/gestion-academica/docentes" element={<TeachersPage />} />
            <Route path="/gestion-academica/cursos-distributivo" element={<CoursesPage />} />

            <Route path="/estudiantes/listado-general" element={<StudentsPage />} />
            <Route path="/estudiantes/nuevo" element={<StudentFormPage />} />
            <Route path="/estudiantes/editar/:id" element={<StudentFormPage />} />
            <Route path="/estudiantes/ficha-dece" element={<EnrollmentManager />} />
            <Route path="/estudiantes/modificaciones" element={<StudentModifications />} />

            <Route path="/dece" element={<DisciplineManagerPage />} />

            <Route path="/agenda/convocatorias" element={<MeetingManager />} />
            <Route path="/agenda/capacitaciones" element={<TrainingManager />} />

            <Route path="/reportes/ficha-acumulativa" element={<FichaEstudiantilReport />} />
            <Route path="/reportes/estadistico" element={<ReporteEstadistico />} />
            <Route path="/reportes/nomina-vulnerabilidad" element={<ReporteNominaVulnerabilidad />} />
            <Route path="/reportes/bitacora-gestion" element={<ReporteBitacoraGestion />} />
            <Route path="/reportes/derivaciones" element={<ReporteDerivaciones />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <ScreenLockProvider>
      <Toaster position="bottom-right" richColors closeButton />
      <NotificationsProvider>
        <Router>
          <MainLayout />
        </Router>
      </NotificationsProvider>
    </ScreenLockProvider>
  );
}

export default App;
