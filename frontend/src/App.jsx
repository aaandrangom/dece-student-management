import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ScreenLockProvider, useScreenLock } from './context/ScreenLockContext';
import SecurityWrapper from './components/SecurityWrapper';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

import InstitutionSettings from './pages/Institution/InstitutionSettings';
import UserSystem from './pages/Institution/UserSystem';

import AcademicYearsPage from './pages/academic/AcademicYears';
import LevelsPage from './pages/academic/Level';
import SubjectsPage from './pages/academic/Subjects';

import TeachersPage from './pages/faculty/Teachers';
import CoursesPage from './pages/faculty/Courses';

import StudentsPage from './pages/student/Student';

import EnrollmentManager from './pages/Enrollment/EnrollmentManager';
/*import Dashboard from './pages/Dashboard';
//import GenericPage from './pages/GenericPage';
import AcademicYearsPage from './pages/AcademicYearsPage';
import CoursesPage from './pages/CoursesPage';
import ParallelsPage from './pages/ParallelsPage';
import SubjectsPage from './pages/SubjectsPage';
import TeachersPage from './pages/TeachersPage';
import ClassroomsPage from './pages/ClassroomsPage';
import StudentsPage from './pages/StudentsPage';
import StudentEnrollmentPage from './pages/StudentEnrollmentPage';
import StudentProfilePage from './pages/StudentProfilePage';
import ArchivedStudentsPage from './pages/ArchivedStudentsPage';
import VulnerabilityPage from './pages/VulnerabilityPage';
import DisciplinePage from './pages/DisciplinePage';
import ViolencePage from './pages/ViolencePage';
import AgendaPage from './pages/AgendaPage';
import TrainingsPage from './pages/TrainingsPage';
import InstitutionPage from './pages/InstitutionPage';
import { menuOptions } from './constants/items';


const generateRoutes = (items) => {
  let routes = [];
  items.forEach((item) => {
    if (item.subOptions && item.subOptions.length > 0) {
      routes = [...routes, ...generateRoutes(item.subOptions)];
    } else {
      if (item.path !== '/panel-principal' && item.path !== '/settings/school-years' && item.path !== '/settings/courses' && item.path !== '/settings/parallels' && item.path !== '/academic/subjects' && item.path !== '/academic/teachers' && item.path !== '/academic/classrooms' && item.path !== '/students/list' && item.path !== '/students/enrollment' && item.path !== '/students/archived' && item.path !== '/dece/vulnerability' && item.path !== '/dece/discipline' && item.path !== '/dece/violence' && item.path !== '/agenda/appointments' && item.path !== '/agenda/trainings' && item.path !== '/settings/institution') {
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
*/
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
            <Route path="/institucion/configuracion-general" element={<InstitutionSettings />} />
            <Route path="/institucion/usuarios-sistema" element={<UserSystem />} />

            <Route path="/gestion-academica/periodos-lectivos" element={<AcademicYearsPage />} />
            <Route path="/gestion-academica/niveles" element={<LevelsPage />} />
            <Route path="/gestion-academica/materias" element={<SubjectsPage />} />

            <Route path="/gestion-academica/docentes" element={<TeachersPage />} />
            <Route path="/gestion-academica/cursos-distributivo" element={<CoursesPage />} />

            <Route path="/estudiantes/listado-general" element={<StudentsPage />} />
            <Route path="/estudiantes/ficha-dece" element={<EnrollmentManager />} />
            {/* 
           
            <Route path="/panel-principal" element={<Dashboard />} />
            <Route path="/settings/school-years" element={<AcademicYearsPage />} />
            <Route path="/settings/courses" element={<CoursesPage />} />
            <Route path="/settings/parallels" element={<ParallelsPage />} />
            <Route path="/academic/subjects" element={<SubjectsPage />} />
            <Route path="/academic/teachers" element={<TeachersPage />} />
            <Route path="/academic/classrooms" element={<ClassroomsPage />} />
            <Route path="/students/list" element={<StudentsPage />} />
            <Route path="/students/enrollment" element={<StudentEnrollmentPage />} />
            <Route path="/students/archived" element={<ArchivedStudentsPage />} />
            <Route path="/students/profile/:id" element={<StudentProfilePage />} />
            <Route path="/dece/vulnerability" element={<VulnerabilityPage />} />
            <Route path="/dece/discipline" element={<DisciplinePage />} />
            <Route path="/dece/violence" element={<ViolencePage />} />
            <Route path="/agenda/appointments" element={<AgendaPage />} />
            <Route path="/agenda/trainings" element={<TrainingsPage />} />
            <Route path="/settings/institution" element={<InstitutionPage />} />
           
             {generateRoutes(menuOptions)}
              <Route path="*" element={<GenericPage title="Página no encontrada" />} />
           */}


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
      <Router>
        <MainLayout />
      </Router>
    </ScreenLockProvider>
  );
}

export default App;
