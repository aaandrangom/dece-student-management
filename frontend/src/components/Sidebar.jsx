import React from 'react';
import { Home, Users, FolderOpen, BarChart3 } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-purple-100 text-slate-700 flex flex-col shadow-xl z-10 border-r border-purple-200">
      <div className="p-6 flex items-center space-x-3 border-b border-purple-200">
        <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
          D
        </div>
        <span className="text-xl font-bold tracking-wide text-slate-800">DECE App</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        <SidebarItem icon={<Home className="w-5 h-5" />} label="Inicio" active />
        <SidebarItem icon={<Users className="w-5 h-5" />} label="Estudiantes" />
        <SidebarItem icon={<FolderOpen className="w-5 h-5" />} label="Casos" />
        <SidebarItem icon={<BarChart3 className="w-5 h-5" />} label="Reportes" />
      </nav>
    </aside>
  );
};

const SidebarItem = ({ icon, label, active }) => (
  <a 
    href="#" 
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
      active 
        ? 'bg-linear-to-r from-purple-500 to-purple-600 text-white shadow-lg' 
        : 'text-slate-600 hover:bg-purple-200 hover:text-purple-700 hover:shadow-md'
    }`}
  >
    <span className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-purple-600'} transition-colors`}>
      {icon}
    </span>
    <span className="font-medium text-sm">{label}</span>
  </a>
);

export default Sidebar;