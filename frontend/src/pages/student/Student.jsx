import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Search, Plus, User, Edit3, Users,
    ChevronLeft, ChevronRight, Upload
} from 'lucide-react';
import { EventsOn } from '../../../wailsjs/runtime/runtime';

import { BuscarEstudiantes, ObtenerFotoBase64, ImportarEstudiantes } from '../../../wailsjs/go/services/StudentService';

export default function StudentsPage() {
    const navigate = useNavigate();

    const handleCreate = () => {
        navigate('/estudiantes/nuevo');
    };

    const handleEdit = (id) => {
        navigate(`/estudiantes/editar/${id}`);
    };

    return (
        <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans">
            <StudentList onCreate={handleCreate} onEdit={handleEdit} />
        </div>
    );
}

function StudentList({ onCreate, onEdit }) {
    const [students, setStudents] = useState([]);
    const [query, setQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [imageCache, setImageCache] = useState({});
    const [importProgress, setImportProgress] = useState(null);

    useEffect(() => {
        const cancel = EventsOn("student:import_progress", (data) => {
            setImportProgress(data);
        });
        return () => {
            if (cancel) cancel();
        };
    }, []);

    const isLocalPath = (rf) => {
        if (!rf) return false;
        try {
            if (rf.startsWith('file:')) return true;
            if (/^[A-Za-z]:/.test(rf)) return true;
            if (rf.startsWith('\\')) return true;
            if (rf.startsWith('/')) return true;
        } catch (e) {
            return false;
        }
        return false;
    };

    const search = async (q) => {
        try {
            const data = await BuscarEstudiantes(q);
            console.log('BuscarEstudiantes', { q, data });
            setStudents(data || []);
            setCurrentPage(1);
            try {
                if (data && Array.isArray(data)) {
                    data.forEach((s) => {
                        if (s.ruta_foto && isLocalPath(s.ruta_foto)) {
                            if (!imageCache[s.id]) {
                                ObtenerFotoBase64(s.id).then((b64) => {
                                    if (b64) setImageCache(prev => ({ ...prev, [s.id]: b64 }));
                                }).catch(() => { });
                            }
                        }
                    });
                }
            } catch (e) {
            }
        } catch (err) {
            toast.error("Error al buscar estudiantes");
        }
    };

    useEffect(() => { search(''); }, []);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        search(val);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = students.slice(indexOfFirstItem, indexOfLastItem);
    console.log({ students, currentItems });
    const totalPages = Math.ceil(students.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleImport = async () => {
        setImportProgress({ current: 0, total: 100, success: 0 });
        try {
            const count = await ImportarEstudiantes();
            if (count > 0) {
                toast.success(`Se importaron ${count} estudiantes.`);
                search(query);
            } else {
                toast.info("Proceso finalizado (0 importados o cancelado).");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error al importar estudiantes");
        } finally {
            setImportProgress(null);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 shadow-sm">
                        <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Gestión de Estudiantes</h1>
                        <p className="text-slate-500 text-sm font-medium">Directorio general de alumnos</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleImport}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-bold shadow-md hover:shadow-green-200 active:scale-95"
                    >
                        <Upload size={18} /> Importar
                    </button>
                    <button
                        onClick={onCreate}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-bold shadow-md hover:shadow-purple-200 active:scale-95"
                    >
                        <Plus size={18} /> Nuevo
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por cédula o nombres..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        value={query}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="font-medium text-slate-500 mr-2">Total: {students.length}</span>
                    <span>Mostrar</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 focus:outline-none focus:border-purple-500 font-semibold text-slate-700"
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                    <span>filas</span>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Estudiante</th>
                                <th className="px-6 py-4">Identificación</th>
                                <th className="px-6 py-4">Apellidos</th>
                                <th className="px-6 py-4">Nombres</th>
                                <th className="px-6 py-4">Correo</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center text-slate-400">
                                        No se encontraron resultados
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((st) => (
                                    <tr key={st.id} className="hover:bg-purple-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-200 shadow-sm">
                                                {(() => {
                                                    const cached = imageCache[st.id];
                                                    const safeSrc = cached || (st.ruta_foto && !isLocalPath(st.ruta_foto) ? st.ruta_foto : null);
                                                    if (safeSrc) {
                                                        return <img src={safeSrc} alt="Avatar" className="w-full h-full object-cover" />;
                                                    }
                                                    return (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                                                            <User size={20} />
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-mono text-sm font-medium">
                                            {st.info_nacionalidad?.es_extranjero
                                                ? (st.info_nacionalidad.pasaporte_odni || 'S/N')
                                                : (st.cedula || 'S/N')
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-slate-800 font-bold text-sm uppercase">{st.apellidos}</td>
                                        <td className="px-6 py-4 text-slate-700 font-medium text-sm uppercase">{st.nombres}</td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">{st.correo_electronico || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => onEdit(st.id)}
                                                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {students.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                        <span className="text-sm text-slate-500">
                            Página <span className="font-bold text-slate-700">{currentPage}</span> de {totalPages}
                        </span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-400 disabled:opacity-30">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-400 disabled:opacity-30">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {importProgress && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-100">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                <Upload className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="font-bold text-xl text-slate-800">Importando Estudiantes</h3>
                            <p className="text-slate-500 text-sm mt-1">Por favor espere, no cierre la aplicación...</p>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden border border-slate-200">
                            <div
                                className="bg-blue-600 h-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                                style={{ width: `${Math.round((importProgress.current / importProgress.total) * 100)}%` }}
                            ></div>
                        </div>

                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-slate-600">{importProgress.current} de {importProgress.total} procesados</span>
                            <span className="text-blue-600">{Math.round((importProgress.current / importProgress.total) * 100)}%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}