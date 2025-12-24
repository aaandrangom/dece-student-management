import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { 
    Users, 
    Search, 
    Filter, 
    Download, 
    AlertTriangle, 
    AlertCircle, 
    Repeat,
    ChevronLeft,
    ChevronRight,
    School,
    GraduationCap,
    Loader2,
    Eye
} from 'lucide-react';

// Importar servicios
import { GetAniosLectivos } from '../../wailsjs/go/academic/YearService';
import { GetCursos } from '../../wailsjs/go/academic/CourseService';
import { GetParalelos } from '../../wailsjs/go/academic/ParallelService';
import { GetStudents, ExportStudentsToExcel } from '../../wailsjs/go/student/StudentService';

const StudentsPage = () => {
    const navigate = useNavigate();
    // Filtros
    const [anios, setAnios] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [paralelos, setParalelos] = useState([]);
    
    const [filters, setFilters] = useState({
        anio_id: '',
        curso_id: '',
        paralelo_id: '',
        query: ''
    });

    // Datos
    const [students, setStudents] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [loading, setLoading] = useState(false);

    // Carga Inicial
    useEffect(() => {
        loadCatalogos();
    }, []);

    // Recargar cuando cambian filtros o página
    useEffect(() => {
        // Solo cargar si tenemos al menos un año seleccionado o es búsqueda global
        if (filters.anio_id || filters.query) {
            loadStudents();
        }
    }, [filters, page]);

    const loadCatalogos = async () => {
        try {
            const [a, c, p] = await Promise.all([
                GetAniosLectivos(),
                GetCursos(),
                GetParalelos()
            ]);
            setAnios(a);
            setCursos(c);
            setParalelos(p);

            // Seleccionar año activo por defecto
            const activo = a.find(y => y.Activo);
            if (activo) {
                setFilters(prev => ({ ...prev, anio_id: activo.ID }));
            } else if (a.length > 0) {
                setFilters(prev => ({ ...prev, anio_id: a[0].ID }));
            }
        } catch (error) {
            toast.error("Error cargando catálogos");
        }
    };

    const loadStudents = async () => {
        setLoading(true);
        try {
            const anioId = filters.anio_id ? parseInt(filters.anio_id) : 0;
            const cursoId = filters.curso_id ? parseInt(filters.curso_id) : 0;
            const paraleloId = filters.paralelo_id ? parseInt(filters.paralelo_id) : 0;

            const response = await GetStudents(
                anioId, 
                cursoId, 
                paraleloId, 
                filters.query, 
                page, 
                pageSize
            );
            
            if (response) {
                setStudents(response.data || []);
                setTotal(response.total);
            }
        } catch (error) {
            toast.error("Error al cargar estudiantes: " + error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            setPage(1); // Resetear a página 1
            loadStudents();
        }
    };

    const handleExport = async () => {
        try {
            const anioId = filters.anio_id ? parseInt(filters.anio_id) : 0;
            const cursoId = filters.curso_id ? parseInt(filters.curso_id) : 0;
            const paraleloId = filters.paralelo_id ? parseInt(filters.paralelo_id) : 0;

            const base64 = await ExportStudentsToExcel(anioId, cursoId, paraleloId);
            
            // Descargar archivo
            const link = document.createElement('a');
            link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
            link.download = `Estudiantes_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success("Exportación completada");
        } catch (error) {
            toast.error("Error al exportar: " + error);
        }
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="min-h-full w-full bg-slate-50/50 font-sans">
            <Toaster position="top-right" richColors />

            <div className="w-full flex flex-col gap-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 shadow-sm">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Gestión de Estudiantes</h1>
                            <p className="text-sm text-slate-500 font-medium">Matrículas, listados y seguimiento</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleExport}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-semibold shadow-md hover:shadow-emerald-200"
                    >
                        <Download className="w-4 h-4" />
                        Exportar Excel
                    </button>
                </div>

                {/* Filtros y Búsqueda */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        {/* Buscador Global */}
                        <div className="md:col-span-4 lg:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Búsqueda Global</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Cédula o Apellidos..." 
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400"
                                    value={filters.query}
                                    onChange={(e) => setFilters({...filters, query: e.target.value})}
                                    onKeyDown={handleSearch}
                                />
                            </div>
                        </div>

                        {/* Filtros Dropdown */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Año Lectivo</label>
                            <div className="relative">
                                <select 
                                    className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 appearance-none cursor-pointer hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    value={filters.anio_id}
                                    onChange={(e) => {
                                        setFilters({...filters, anio_id: e.target.value, query: ''});
                                        setPage(1);
                                    }}
                                    disabled={!!filters.query}
                                >
                                    {anios.map(a => (
                                        <option key={a.ID} value={a.ID}>{a.Nombre} {a.Activo ? '(Activo)' : ''}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <School className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Curso</label>
                            <div className="relative">
                                <select 
                                    className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 appearance-none cursor-pointer hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    value={filters.curso_id}
                                    onChange={(e) => {
                                        setFilters({...filters, curso_id: e.target.value, query: ''});
                                        setPage(1);
                                    }}
                                    disabled={!!filters.query}
                                >
                                    <option value="">Todos los cursos</option>
                                    {cursos.map(c => (
                                        <option key={c.ID} value={c.ID}>{c.Nombre}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <GraduationCap className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Paralelo</label>
                            <div className="relative">
                                <select 
                                    className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 appearance-none cursor-pointer hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    value={filters.paralelo_id}
                                    onChange={(e) => {
                                        setFilters({...filters, paralelo_id: e.target.value, query: ''});
                                        setPage(1);
                                    }}
                                    disabled={!!filters.query}
                                >
                                    <option value="">Todos</option>
                                    {paralelos.map(p => (
                                        <option key={p.ID} value={p.ID}>{p.Nombre}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <Filter className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {filters.query && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 w-fit">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span className="font-medium">La búsqueda global ignora los filtros de año, curso y paralelo.</span>
                        </div>
                    )}
                </div>

                {/* Tabla de Resultados */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estudiante</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cédula</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Indicadores</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                                <span className="text-sm font-medium">Cargando estudiantes...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : students.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <Users className="w-10 h-10 text-slate-300" />
                                                <p className="font-medium">No se encontraron estudiantes registrados</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((st) => (
                                        <tr key={st.id} className="hover:bg-purple-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold overflow-hidden shadow-sm">
                                                        {st.foto_perfil ? (
                                                            <img src={st.foto_perfil} alt="Perfil" className="w-full h-full object-cover" />
                                                        ) : (
                                                            st.apellidos.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-sm">{st.apellidos} {st.nombres}</div>
                                                        {filters.query && <div className="text-xs text-slate-500 mt-0.5">Año: {st.anio_lectivo || 'Sin matrícula'}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-mono bg-slate-50/50 w-fit rounded-lg px-2">
                                                {st.cedula}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {st.curso ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                        {st.curso} "{st.paralelo}"
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic text-xs">No asignado</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {st.tiene_discapacidad && (
                                                        <div className="group relative">
                                                            <span className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center cursor-help transition-transform hover:scale-110">
                                                                <Users size={14} />
                                                            </span>
                                                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-bold text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                                Discapacidad
                                                            </span>
                                                        </div>
                                                    )}
                                                    {st.tiene_caso_dece && (
                                                        <div className="group relative">
                                                            <span className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center cursor-help transition-transform hover:scale-110">
                                                                <AlertTriangle size={14} />
                                                            </span>
                                                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-bold text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                                Caso DECE Abierto
                                                            </span>
                                                        </div>
                                                    )}
                                                    {st.es_repetidor && (
                                                        <div className="group relative">
                                                            <span className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 text-red-600 flex items-center justify-center cursor-help transition-transform hover:scale-110">
                                                                <Repeat size={14} />
                                                            </span>
                                                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-bold text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                                Repetidor
                                                            </span>
                                                        </div>
                                                    )}
                                                    {!st.tiene_discapacidad && !st.tiene_caso_dece && !st.es_repetidor && (
                                                        <span className="text-slate-300 text-xs">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => navigate(`/students/profile/${st.id}`)}
                                                    className="flex items-center justify-end gap-1 text-blue-600 hover:text-blue-800 hover:underline font-bold text-xs transition-colors ml-auto"
                                                >
                                                    <Eye size={14} />
                                                    Ver Ficha
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {total > 0 && (
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">
                                Mostrando <span className="font-bold text-slate-700">{((page - 1) * pageSize) + 1}</span> a <span className="font-bold text-slate-700">{Math.min(page * pageSize, total)}</span> de <span className="font-bold text-purple-700">{total}</span> resultados
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-slate-500"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button 
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-slate-500"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentsPage;