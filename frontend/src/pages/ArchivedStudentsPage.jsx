import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, 
    Filter, 
    ChevronLeft, 
    ChevronRight, 
    Eye, 
    FileDown,
    Archive,
    CalendarOff,
    Loader2,
    Calendar
} from 'lucide-react';
import { GetWithdrawnStudents } from '../../wailsjs/go/student/StudentService';
import { GetActiveSchoolYear } from '../../wailsjs/go/academic/YearService';

const ArchivedStudentsPage = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [activeYear, setActiveYear] = useState(null);
    const pageSize = 10;

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadStudents();
    }, [page, search, activeYear]);

    const loadInitialData = async () => {
        try {
            const year = await GetActiveSchoolYear();
            setActiveYear(year);
        } catch (error) {
            console.error("Error loading active year:", error);
        }
    };

    const loadStudents = async () => {
        setLoading(true);
        try {
            const yearId = activeYear ? activeYear.id : 0;
            const response = await GetWithdrawnStudents(yearId, search, page, pageSize);
            setStudents(response.data || []);
            setTotalPages(Math.ceil(response.total / pageSize));
        } catch (error) {
            console.error("Error loading withdrawn students:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    return (
        <div className="min-h-full w-full bg-slate-50/50 font-sans">
            <div className="w-full flex flex-col gap-6">
                
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 shadow-sm">
                            <Archive className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Historial de Bajas</h1>
                            <p className="text-sm text-slate-500 font-medium">Estudiantes retirados de la institución</p>
                        </div>
                    </div>
                    
                    <button 
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-sm font-semibold shadow-sm hover:shadow-md"
                    >
                        <FileDown className="w-4 h-4" />
                        Exportar Reporte
                    </button>
                </div>

                {/* Filtros */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        {/* Buscador */}
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Buscar Estudiante</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Cédula, Nombres o Apellidos..." 
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all placeholder:text-slate-400"
                                    value={search}
                                    onChange={handleSearch}
                                />
                            </div>
                        </div>

                        {/* Año Lectivo (Read-only filter info) */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Periodo Activo</label>
                            <div className="relative">
                                <div className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 flex items-center gap-2 cursor-not-allowed opacity-80">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="truncate">{activeYear ? activeYear.nombre : 'Cargando...'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estudiante</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Curso al Retiro</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Retiro</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Motivo</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                                                <span className="text-sm font-medium">Cargando registros...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : students.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="p-4 bg-slate-50 rounded-full mb-2 border border-slate-100">
                                                    <CalendarOff className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="font-medium text-slate-600">No se encontraron estudiantes retirados</p>
                                                <p className="text-xs text-slate-400">Intenta ajustar los filtros de búsqueda</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((student) => (
                                        <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold overflow-hidden shadow-sm text-xs">
                                                        {student.foto_perfil ? (
                                                            <img src={student.foto_perfil} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            student.apellidos.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-700 text-sm">{student.apellidos} {student.nombres}</div>
                                                        <div className="text-xs text-slate-400 font-mono mt-0.5">{student.cedula}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                    {student.curso} "{student.paralelo}"
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-slate-600">
                                                    {new Date(student.fecha_retiro).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-slate-500 max-w-[200px] truncate" title={student.motivo_retiro}>
                                                    {student.motivo_retiro || 'Sin motivo especificado'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => navigate(`/students/profile/${student.id}`)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 shadow-sm"
                                                    title="Ver Expediente"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">
                                Página <span className="font-bold text-slate-700">{page}</span> de <span className="font-bold text-slate-700">{totalPages}</span>
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-slate-500"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button 
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-slate-500"
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

export default ArchivedStudentsPage;