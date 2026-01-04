import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HeartHandshake, ChevronLeft, ChevronRight, LogOut,
  LayoutDashboard, GraduationCap, Users, UserPlus, Archive,
  FolderOpen, FileWarning, Activity, Library,
  School, Briefcase, BookOpen, CalendarDays, BellRing,
  Presentation, Settings, History, ShieldCheck, Building2, Layers, Split, ShieldAlert,
  Building, Sliders, UserCog, Calendar
} from 'lucide-react';
import { menuOptions } from '../constants/items';

const iconMap = {
  LayoutDashboard, GraduationCap, Users, UserPlus, Archive,
  HeartHandshake, FolderOpen, FileWarning, Activity, Library,
  School, Briefcase, BookOpen, CalendarDays, BellRing,
  Presentation, Settings, History, ShieldCheck, Building2, Layers, Split, ShieldAlert,
  Building, Sliders, UserCog, Calendar
};

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  return (
    <aside
      className={`
        relative h-screen flex flex-col shrink-0 bg-[#4a1d7c] border-r border-white/10 z-50
        transition-[width] duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-72'}
      `}
      style={{
        background: 'linear-gradient(180deg, #5b2c8a 0%, #2e1065 100%)',
        contain: 'layout style'
      }}
      onMouseLeave={() => setHoveredItem(null)}
    >
      <div className="flex items-center gap-3 p-4 border-b border-white/10 h-20 overflow-hidden shrink-0">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-md ring-1 ring-white/10">
          <HeartHandshake className="w-6 h-6 text-white" />
        </div>

        <div className={`flex flex-col overflow-hidden transition-opacity duration-200 ${isCollapsed ? 'w-0 opacity-0' : 'w-40 opacity-100'
          }`}>
          <h1 className="text-lg font-bold text-white tracking-wide whitespace-nowrap pl-2 drop-shadow-sm">DECE</h1>
          <p className="text-xs text-indigo-200 whitespace-nowrap font-medium pl-2">Administración</p>
        </div>
      </div>

      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-24 bg-[#5b2c8a] text-white p-1.5 rounded-full shadow-lg border border-white/20 hover:bg-[#7c3aed] transition-colors z-50 flex items-center justify-center"
      >
        <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
      </button>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-1 custom-scrollbar">
        {menuOptions.map((item, index) => (
          <MemoizedSidebarItem
            key={index}
            item={item}
            isCollapsed={isCollapsed}
            setHoveredItem={setHoveredItem}
            setMenuPosition={setMenuPosition}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 shrink-0">
        <Link
          to="/"
          className={`flex items-center gap-3 px-3 py-3 rounded-xl text-indigo-100 hover:bg-white/10 hover:text-white transition-colors duration-200 group overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 shrink-0 text-red-300 group-hover:text-red-200 transition-colors" />
          <span className={`text-sm font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-1'
            }`}>
            Cerrar Sesión
          </span>
        </Link>
      </div>

      {isCollapsed && hoveredItem && hoveredItem.subOptions && (
        <div
          className="fixed z-9999 bg-[#3d1866] rounded-xl shadow-2xl border border-white/20 w-56 py-2 backdrop-blur-xl bg-opacity-95"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onMouseEnter={() => setHoveredItem(hoveredItem)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <div className="px-4 py-3 border-b border-white/10 mb-1">
            <span className="text-sm font-bold text-white block truncate">{hoveredItem.title}</span>
          </div>
          {hoveredItem.subOptions.map((sub, idx) => {
            const SubIcon = iconMap[sub.icon];
            return (
              <Link key={idx} to={sub.path} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/10 hover:text-white transition-colors">
                {SubIcon && <SubIcon className="w-4 h-4 shrink-0 opacity-80" />}
                <span className="truncate font-medium">{sub.title}</span>
              </Link>
            )
          })}
        </div>
      )}
    </aside>
  );
};

const SidebarItem = ({ item, isCollapsed, setHoveredItem, setMenuPosition }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const itemRef = useRef(null);
  const hasSubOptions = item.subOptions && item.subOptions.length > 0;
  const Icon = iconMap[item.icon] || LayoutDashboard;

  const isActive = location.pathname === item.path;
  const isChildActive = hasSubOptions && item.subOptions.some(sub => location.pathname === sub.path);

  useEffect(() => {
    if (isChildActive) setIsOpen(true);
  }, [isChildActive]);

  useEffect(() => {
    if (isCollapsed) setIsOpen(false);
  }, [isCollapsed]);

  const handleClick = (e) => {
    if (hasSubOptions) {
      e.preventDefault();
      if (!isCollapsed) setIsOpen(!isOpen);
    }
  };

  const handleMouseEnter = useCallback(() => {
    if (isCollapsed && hasSubOptions && itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.top, left: rect.right + 12 });
      setHoveredItem(item);
    }
  }, [isCollapsed, hasSubOptions, item, setHoveredItem, setMenuPosition]);

  return (
    <div className="mb-1" ref={itemRef} onMouseEnter={handleMouseEnter}>
      <Link
        to={hasSubOptions ? '#' : item.path}
        onClick={handleClick}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative select-none
          ${isActive || (isChildActive && !isOpen && !isCollapsed)
            ? 'bg-white/20 text-white shadow-md ring-1 ring-white/10 font-semibold'
            : 'text-indigo-100 hover:bg-white/10 hover:text-white font-medium'}
          ${isCollapsed ? 'justify-center' : ''}
        `}
      >
        <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive || isChildActive ? 'text-white' : 'text-indigo-200 group-hover:text-white'}`} />

        <div className={`flex items-center overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100 ml-2'
          }`}>
          <span className="flex-1 text-sm truncate">{item.title}</span>
          {hasSubOptions && (
            <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90 text-white' : 'text-indigo-300'}`}>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </div>
          )}
        </div>
      </Link>

      {hasSubOptions && !isCollapsed && (
        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${isOpen ? 'max-h-125 opacity-100' : 'max-h-0 opacity-0'}`}
          style={{ visibility: isOpen ? 'visible' : 'hidden' }}
        >
          <div className="ml-5 pl-4 border-l-2 border-white/10 mt-1 space-y-1 pb-1">
            {item.subOptions.map((subItem, idx) => {
              const SubIcon = iconMap[subItem.icon];
              const isSubActive = location.pathname === subItem.path;
              return (
                <Link
                  key={idx}
                  to={subItem.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 
                    ${isSubActive
                      ? 'text-white bg-white/15 font-semibold translate-x-1 shadow-sm'
                      : 'text-indigo-200 hover:text-white hover:bg-white/5 hover:translate-x-1 font-medium'}`}
                >
                  {SubIcon && <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-white' : 'opacity-70'}`} />}
                  <span className="truncate">{subItem.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const MemoizedSidebarItem = memo(SidebarItem);

export default Sidebar;