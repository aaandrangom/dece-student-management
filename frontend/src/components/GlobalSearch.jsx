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
                inputRef.current?.focus();
            }
            // Navegación con flechas
            if (isOpen && results.length > 0) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selectedIndex >= 0 && results[selectedIndex]) {
                        handleSelect(results[selectedIndex]);
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex]);

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
            navigate('/estudiantes/listado-general', { state: { focusedStudentId: item.id } });
        } else if (item.type === 'navigation') {
            navigate(item.route);
        } else if (item.type === 'action') {
            if (item.route === 'action:new_student') {
                navigate('/estudiantes/listado-general', { state: { action: 'openNewStudentModal' } });
            } else if (item.route === 'action:new_notification') {
                navigate('/notificaciones');
            }
        }
    };

    return (
        <div ref={searchRef} className="relative w-full md:w-96 z-50">
            <div className={`flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 border-2 transition-all duration-200 ${isOpen ? 'border-purple-300 bg-white shadow-lg shadow-purple-100 ring-2 ring-purple-50' : 'border-transparent'}`}>
                <Search className={`w-4 h-4 transition-colors ${isOpen ? 'text-purple-600' : 'text-slate-400'}`} />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if (query.length >= 2) setIsOpen(true); }}
                    placeholder="Buscar estudiante, menú o acción..."
                    className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
                />
                <kbd className="hidden lg:inline-flex px-2 py-1 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-xs font-mono">
                    ⌘K
                </kbd>
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="max-h-[70vh] overflow-y-auto py-2">
                        {/* Agrupar por tipo si se desea, o lista plana */}
                        {results.map((item, index) => {
                            const IconComponent = iconMap[item.icon] || User;
                            const isSelected = index === selectedIndex;

                            return (
                                <div
                                    key={`${item.type}-${item.id || index}`}
                                    onClick={() => handleSelect(item)}
                                    // onMouseEnter={() => setSelectedIndex(index)} // Opcional: hover cambia selección
                                    className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-purple-50' : 'hover:bg-slate-50'}`}
                                >
                                    <div className={`p-2 rounded-lg ${
                                        item.type === 'student' ? 'bg-slate-100 text-slate-600' : 
                                        item.type === 'action' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                        <IconComponent className="w-5 h-5" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-slate-800 truncate">
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
                                        <p className="text-xs text-slate-500 truncate">{item.description}</p>
                                    </div>

                                    {isSelected && <ArrowRight className="w-4 h-4 text-purple-400" />}
                                </div>
                            );
                        })}
                    </div>
                    <div className="bg-slate-50 px-4 py-2 text-xs text-slate-400 border-t border-slate-100 flex justify-between">
                        <span>Seleccionar <kbd className="font-sans px-1 bg-white rounded border border-slate-300">↵</kbd></span>
                        <span>Navegar <kbd className="font-sans px-1 bg-white rounded border border-slate-300">↑↓</kbd></span>
                    </div>
                </div>
            )}
            
            {isOpen && results.length === 0 && query.length >= 2 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 p-8 text-center animate-in fade-in zoom-in-95 duration-100">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">No se encontraron resultados para "{query}"</p>
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
