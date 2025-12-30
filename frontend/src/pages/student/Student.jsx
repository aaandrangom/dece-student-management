import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Search, Plus, User, Edit3, Users,
    ChevronLeft, ChevronRight
} from 'lucide-react';

import { BuscarEstudiantes, ObtenerFotoBase64 } from '../../../wailsjs/go/services/StudentService';
import StudentFormPage from './StudentFormPage';

export default function StudentsPage() {
    const [view, setView] = useState('list');
    const [selectedId, setSelectedId] = useState(0);

    const handleCreate = () => {
        setSelectedId(0);
        setView('form');
    };

    const handleEdit = (id) => {
        setSelectedId(id);
        setView('form');
    };

    const handleBack = () => {
        setView('list');
        setSelectedId(0);
    };

    if (view === 'form') {
        return <StudentFormPage studentId={selectedId} onBack={handleBack} />;
    }

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
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [imageCache, setImageCache] = useState({});

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
    const totalPages = Math.ceil(students.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const getImageSrc = () => {
        if (tempPhotoPath) return tempPhotoPath;
        const rf = formData.ruta_foto || '';
        if (!rf) return null;
        if (/^[a-zA-Z]:\\\\|^[a-zA-Z]:\\|^[a-zA-Z]:\/|^file:|^\\\\|^\//.test(rf)) {
            return null;
        }
        return rf;
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
                <button
                    onClick={onCreate}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-bold shadow-md hover:shadow-purple-200 active:scale-95"
                >
                    <Plus size={18} /> Nuevo Estudiante
                </button>
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
                    <span>Mostrar</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 focus:outline-none focus:border-purple-500 font-semibold text-slate-700"
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
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
                                <th className="px-6 py-4">Cédula</th>
                                <th className="px-6 py-4">Apellidos</th>
                                <th className="px-6 py-4">Nombres</th>
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
                                        <td className="px-6 py-4 text-slate-600 font-mono text-sm font-medium">{st.cedula}</td>
                                        <td className="px-6 py-4 text-slate-800 font-bold text-sm uppercase">{st.apellidos}</td>
                                        <td className="px-6 py-4 text-slate-700 font-medium text-sm uppercase">{st.nombres}</td>
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
        </div>
    );
}