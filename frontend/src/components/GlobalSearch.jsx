import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, User, LayoutDashboard, Users, BookOpen, GraduationCap, School, 
    ClipboardCheck, Bell, Building, Settings, UserPlus, FileText, BellPlus,
    ShieldAlert, AlertTriangle, ArrowRight
} from 'lucide-react';
import { BusquedaGlobal } from '../../wailsjs/go/search/SearchService';

const iconMap = {
    'User': User,
    'LayoutDashboard': LayoutDashboard,
    'Users': Users,
    'BookOpen': BookOpen,
    'GraduationCap': GraduationCap,
    'School': School,
    'ClipboardCheck': ClipboardCheck,
    'Bell': Bell,
    'Building': Building,
    'Settings': Settings,
    'UserPlus': UserPlus,
    'BellPlus': BellPlus,
    'FileText': FileText,
};

const defaultSuggestions = [
    { id: 'def-1', title: 'Panel Principal', description: 'Ir al inicio', icon: 'LayoutDashboard', type: 'navigation', route: '/panel-principal' },
    { id: 'def-2', title: 'Nueva estudiante', description: 'Inscribir estudiante', icon: 'UserPlus', type: 'navigation', route: '/estudiantes/nuevo' },
    { id: 'def-3', title: 'Planta Docente', description: 'Directorio de profesores', icon: 'GraduationCap', type: 'navigation', route: '/gestion-academica/docentes' },
    { id: 'def-4', title: 'Generar Reporte', description: 'Estadísticas generales', icon: 'FileText', type: 'navigation', route: '/reportes' },
];

const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Comando de teclado Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
                inputRef.current?.focus();
            }
            // Navegación con flechas
            const currentItems = query.length < 2 ? defaultSuggestions : results;

            if (isOpen && currentItems.length > 0) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev < currentItems.length - 1 ? prev + 1 : 0));
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : currentItems.length - 1));
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selectedIndex >= 0 && currentItems[selectedIndex]) {
                        handleSelect(currentItems[selectedIndex]);
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex, query]);

    // Búsqueda con debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length >= 2) {
                try {
                    const data = await BusquedaGlobal(query);
                    setResults(data || []);
                    setIsOpen(true);
                    setSelectedIndex(0); // Reiniciar selección
                } catch (error) {
                    console.error("Error en búsqueda global:", error);
                    setResults([]);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (item) => {
        setIsOpen(false);
        setQuery('');
        
        if (item.type === 'student') {
            navigate(`/estudiantes/editar/${item.id}`);
        } else if (item.type === 'navigation') {
            navigate(item.route);
        } else if (item.type === 'action') {
            if (item.route === 'action:new_student') {
                navigate('/estudiantes/nuevo');
            } else if (item.route === 'action:new_notification') {
                navigate('/notificaciones');
            }
        }
    };

    const itemsToShow = query.length < 2 ? defaultSuggestions : results;
    const showDropdown = isOpen && (itemsToShow.length > 0 || (query.length >= 2 && results.length === 0));

    return (
        <div ref={searchRef} className="relative w-full md:w-96 z-50">
            <div className={`flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 border-2 transition-all duration-200 ${isOpen ? 'border-purple-300 bg-white shadow-lg shadow-purple-100 ring-2 ring-purple-50' : 'border-transparent'}`}>
                <Search className={`w-4 h-4 transition-colors ${isOpen ? 'text-purple-600' : 'text-slate-400'}`} />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Buscar estudiante, menú o acción..."
                    className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
                />
                <kbd className="hidden lg:inline-flex px-2 py-1 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-xs font-mono">
                    ⌘K
                </kbd>
            </div>

            {showDropdown && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    
                    {query.length < 2 && (
                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Sugerencias Rápidas
                        </div>
                    )}

                    {itemsToShow.length > 0 ? (
                        <div className="max-h-[70vh] overflow-y-auto py-2">
                            {/* Agrupar por tipo si se desea, o lista plana */}
                            {itemsToShow.map((item, index) => {
                                const IconComponent = iconMap[item.icon] || User;
                                const isSelected = index === selectedIndex;

                                return (
                                    <div
                                        key={`${item.type}-${item.id || index}`}
                                        onClick={() => handleSelect(item)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-purple-50' : 'hover:bg-slate-50'}`}
                                    >
                                        <div className={`p-2 rounded-lg ${
                                            isSelected ? 'bg-white shadow-sm' : 
                                            item.type === 'student' ? 'bg-slate-100 text-slate-600' : 
                                            item.type === 'action' ? 'bg-green-50 text-green-600' : 
                                            item.type === 'navigation' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50'
                                        } transition-colors`}>
                                            <IconComponent className={`w-5 h-5 ${isSelected ? 'text-purple-600' : ''}`} />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className={`text-sm font-semibold truncate ${isSelected ? 'text-purple-900' : 'text-slate-800'}`}>
                                                    {item.title}
                                                </p>
                                                
                                                {/* Indicadores visuales CRÍTICOS para estudiantes */}
                                                {item.type === 'student' && (
                                                    <div className="flex items-center gap-1">
                                                        {item.tiene_caso_sensible && (
                                                            <span title="Caso Sensible Activo" className="inline-flex">
                                                                <ShieldAlert className="w-4 h-4 text-purple-600 animate-pulse" fill="currentColor" fillOpacity={0.2} />
                                                            </span>
                                                        )}
                                                        {item.tiene_disciplina && (
                                                            <span title="Antecedentes Disciplinarios" className="inline-flex">
                                                                <AlertTriangle className="w-4 h-4 text-red-500" fill="currentColor" fillOpacity={0.2} />
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <p className={`text-xs truncate ${isSelected ? 'text-purple-600' : 'text-slate-500'}`}>{item.description}</p>
                                        </div>

                                        {isSelected && <ArrowRight className="w-4 h-4 text-purple-400" />}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Search className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-sm text-slate-500 font-medium">No se encontraron resultados para "{query}"</p>
                        </div>
                    )}

                    <div className="bg-slate-50 px-4 py-2 text-xs text-slate-400 border-t border-slate-100 flex justify-between">
                        <span>Seleccionar <kbd className="font-sans px-1 bg-white rounded border border-slate-300">↵</kbd></span>
                        <span>Navegar <kbd className="font-sans px-1 bg-white rounded border border-slate-300">↑↓</kbd></span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
