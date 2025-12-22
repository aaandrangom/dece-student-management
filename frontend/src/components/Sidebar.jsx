import React, { useState, useCallback, memo, useRef, useEffect } from 'react'; // Importar memo y useCallback
import { Link, useLocation } from 'react-router-dom';
import { 
  HeartHandshake, ChevronLeft, ChevronRight, LogOut,
  LayoutDashboard, GraduationCap, Users, UserPlus, Archive, 
  FolderOpen, FileWarning, Activity, Library, 
  School, Briefcase, BookOpen, CalendarDays, BellRing, 
  Presentation, Settings, History, ShieldCheck, Building2
} from 'lucide-react';
import { menuOptions } from '../constants/items';

const iconMap = {
  LayoutDashboard, GraduationCap, Users, UserPlus, Archive,
  HeartHandshake, FolderOpen, FileWarning, Activity, Library,
  School, Briefcase, BookOpen, CalendarDays, BellRing,
  Presentation, Settings, History, ShieldCheck, Building2
};

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // useCallback evita que esta función se re-cree en cada render
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  return (
    <aside 
      className={`
        relative h-screen flex flex-col shrink-0 bg-[#4a1d7c] border-r border-white/5 z-50
        transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isCollapsed ? 'w-20' : 'w-72'}
      `}
      style={{
        background: 'linear-gradient(180deg, #5b2c8a 0%, #3d1866 100%)',
        contain: 'layout style' // OPTIMIZACIÓN CSS CRÍTICA PARA WAILS
      }}
      onMouseLeave={() => setHoveredItem(null)}
    >
      {/* Header - Memoizado visualmente por simplicidad */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 h-20 overflow-hidden shrink-0">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-sm">
           <HeartHandshake className="w-6 h-6 text-white/90" />
        </div>
        
        <div className={`flex flex-col overflow-hidden transition-opacity duration-200 ${
          isCollapsed ? 'w-0 opacity-0' : 'w-40 opacity-100'
        }`}>
          <h1 className="text-lg font-bold text-white tracking-wide whitespace-nowrap pl-2">DECE</h1>
          <p className="text-xs text-white/60 whitespace-nowrap font-medium pl-2">Sistema Admin</p>
        </div>
      </div>

      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-24 bg-[#5b2c8a] text-white p-1.5 rounded-full shadow-md border border-white/10 hover:bg-[#6d35a6] transition-colors z-50"
      >
        <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
      </button>

      {/* Navigation */}
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

      {/* Footer */}
      <div className="p-4 border-t border-white/10 shrink-0">
        <Link
          to="/"
          className={`flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-200 group overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:text-red-300 transition-colors" />
          <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
            isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-1'
          }`}>
            Cerrar Sesión
          </span>
        </Link>
      </div>

      {/* Menú Flotante */}
      {isCollapsed && hoveredItem && hoveredItem.subOptions && (
        <div 
          className="fixed z-[9999] bg-[#3d1866] rounded-lg shadow-xl border border-white/10 w-52 py-2"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onMouseEnter={() => setHoveredItem(hoveredItem)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <div className="px-4 py-2 border-b border-white/10 mb-1">
             <span className="text-sm font-semibold text-white block truncate">{hoveredItem.title}</span>
          </div>
          {hoveredItem.subOptions.map((sub, idx) => {
             const SubIcon = iconMap[sub.icon];
             return (
               <Link key={idx} to={sub.path} className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                 <SubIcon className="w-4 h-4 shrink-0" />
                 <span className="truncate">{sub.title}</span>
               </Link>
             )
          })}
        </div>
      )}
    </aside>
  );
};

// --- COMPONENTE MEMOIZADO (CRUCIAL PARA RENDIMIENTO) ---
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
          flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200 group relative select-none
          ${isActive || (isChildActive && !isOpen && !isCollapsed)
            ? 'bg-white/10 text-white shadow-sm' 
            : 'text-white/70 hover:bg-white/5 hover:text-white'}
          ${isCollapsed ? 'justify-center' : ''}
        `}
      >
        <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive || isChildActive ? 'text-white' : ''}`} />
        
        <div className={`flex items-center overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100 ml-2'
        }`}>
          <span className="flex-1 text-sm font-medium truncate">{item.title}</span>
          {hasSubOptions && (
            <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}>
               <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
            </div>
          )}
        </div>
      </Link>

      {hasSubOptions && !isCollapsed && (
        <div 
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
          style={{ visibility: isOpen ? 'visible' : 'hidden' }}
        >
          <div className="ml-5 pl-4 border-l border-white/10 mt-1 space-y-1 pb-1">
            {item.subOptions.map((subItem, idx) => {
              const SubIcon = iconMap[subItem.icon];
              const isSubActive = location.pathname === subItem.path;
              return (
                <Link
                  key={idx}
                  to={subItem.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${isSubActive ? 'text-white bg-white/10 font-medium translate-x-1' : 'text-white/60 hover:text-white hover:bg-white/5 hover:translate-x-1'}`}
                >
                  <SubIcon className="w-3.5 h-3.5 opacity-70 shrink-0" />
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

// Envolver en memo() compara las props. Si no cambian, React no re-renderiza este componente.
const MemoizedSidebarItem = memo(SidebarItem);

export default Sidebar;