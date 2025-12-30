import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
    BookOpen, User, ChevronLeft, Loader2,
    Plus, Search, Trash2, GraduationCap, Edit3, Save, X
} from 'lucide-react';

import { ObtenerDistributivo, AsignarDocenteMateria, EliminarAsignacion } from '../../../wailsjs/go/services/DistributivoService';
import { ListarDocentes } from '../../../wailsjs/go/services/TeacherService';

export default function DistributivoView({ course, onBack }) {
    const [allMaterias, setAllMaterias] = useState([]); // Todo el catálogo (asignadas y no asignadas)
    const [teachers, setTeachers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Estados para el Modal de Agregar
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMateria, setSelectedMateria] = useState(null); // Materia seleccionada en el modal
    const [selectedTeacherId, setSelectedTeacherId] = useState(""); // Docente seleccionado en el modal
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (course?.id) loadData();
    }, [course]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [distData, teachersData] = await Promise.all([
                ObtenerDistributivo(course.id),
                ListarDocentes(true)
            ]);
            setAllMaterias(distData || []);
            setTeachers(teachersData || []);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar datos");
        } finally {
            setIsLoading(false);
        }
    };

    // --- LÓGICA DE FILTRADO ---

    // 1. Materias que YA tiene el curso (para la tabla principal)
    const assignedMaterias = useMemo(() => {
        return allMaterias.filter(m => m.docente_id && m.docente_id !== 0);
    }, [allMaterias]);

    // 2. Materias DISPONIBLES para agregar (para el buscador del modal)
    const availableMaterias = useMemo(() => {
        return allMaterias.filter(m =>
            (!m.docente_id || m.docente_id === 0) && // Que no tenga docente
            m.materia_nombre.toLowerCase().includes(searchTerm.toLowerCase()) // Filtro de búsqueda
        );
    }, [allMaterias, searchTerm]);


    // --- ACCIONES ---

    const handleSaveAssignment = async () => {
        if (!selectedMateria || !selectedTeacherId) {
            toast.warning("Debes seleccionar una materia y un docente");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                curso_id: parseInt(course.id),
                materia_id: parseInt(selectedMateria.materia_id),
                docente_id: parseInt(selectedTeacherId)
            };

            await AsignarDocenteMateria(payload);

            // Actualizar estado local
            const teacherObj = teachers.find(t => t.id == selectedTeacherId);
            setAllMaterias(prev => prev.map(m => {
                if (m.materia_id === selectedMateria.materia_id) {
                    return {
                        ...m,
                        docente_id: parseInt(selectedTeacherId),
                        docente_nombre: teacherObj?.nombres_completos
                    };
                }
                return m;
            }));

            toast.success("Materia agregada al curso exitosamente");
            closeModal();

        } catch (error) {
            console.error(error);
            toast.error("Error al asignar materia");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveAssignment = async (materia) => {
        const result = await Swal.fire({
            title: `Quitar ${materia.materia_nombre}`,
            text: `¿Estás seguro de quitar ${materia.materia_nombre} del curso? Esta acción asignará la materia como "Sin Asignar".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, quitar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            // Llamada directa al método importado del backend
            await EliminarAsignacion(parseInt(course.id), parseInt(materia.materia_id));

            setAllMaterias(prev => prev.map(m => {
                if (m.materia_id === materia.materia_id) {
                    return { ...m, docente_id: 0, docente_nombre: "Sin Asignar" };
                }
                return m;
            }));

            toast.success("Materia removida del curso");
        } catch (error) {
            console.error(error);
            toast.error("Error al remover");
        }
    };

    const openModal = () => {
        setSearchTerm("");
        setSelectedMateria(null);
        setSelectedTeacherId("");
        setIsAddModalOpen(true);
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
        setSelectedMateria(null);
    };

    return (
        <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans animate-in fade-in slide-in-from-right-4 duration-300">

            <div className="w-full flex flex-col gap-6">

                {/* HEADER */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button
                            onClick={onBack}
                            className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-500 hover:text-purple-600 transition-all"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Planificación Académica</h1>
                            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 font-medium">
                                <GraduationCap className="w-4 h-4" />
                                <span>{course.nivel_nombre} "{course.paralelo}"</span>
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold border border-slate-200">
                                    {course.jornada}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={openModal}
                        className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold shadow-md shadow-purple-200 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Agregar Materia
                    </button>
                </div>

                {/* TABLA PRINCIPAL: SOLO MATERIAS ASIGNADAS */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-3" />
                            <p>Cargando materias del curso...</p>
                        </div>
                    ) : assignedMaterias.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                            <p className="font-medium text-lg">Este curso aún no tiene materias asignadas</p>
                            <p className="text-sm mt-1">Haz clic en "Agregar Materia" para configurar la carga horaria.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="px-6 py-4">Materia</th>
                                        <th className="px-6 py-4">Área</th>
                                        <th className="px-6 py-4">Docente Encargado</th>
                                        <th className="px-6 py-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {assignedMaterias.map((item) => (
                                        <tr key={item.materia_id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-700">
                                                {item.materia_nombre}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold border border-slate-200">
                                                    {item.area || 'General'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {item.docente_nombre}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {/* Aquí podrías poner un botón de Editar Docente si quisieras */}
                                                <button
                                                    onClick={() => handleRemoveAssignment(item)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Quitar materia del curso"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL PARA AGREGAR MATERIA --- */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Agregar Materia al Curso</h3>
                                <p className="text-xs text-slate-500">Selecciona una materia del catálogo y asigna un docente.</p>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 flex flex-col gap-6 overflow-hidden">

                            {/* PASO 1: Selección de Materia */}
                            <div className="flex flex-col gap-3 flex-1 min-h-0">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">1. Buscar Materia</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Escribe para buscar (ej. Matemáticas, Lengua...)"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        disabled={!!selectedMateria} // Deshabilitar si ya seleccionó
                                    />
                                    {selectedMateria && (
                                        <button
                                            onClick={() => { setSelectedMateria(null); setSearchTerm(""); }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded text-xs font-bold text-slate-500"
                                        >
                                            Cambiar
                                        </button>
                                    )}
                                </div>

                                {/* Lista de resultados (Catálogo) */}
                                {!selectedMateria && (
                                    <div className="border border-slate-200 rounded-xl overflow-y-auto h-48 bg-slate-50/30">
                                        {availableMaterias.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-slate-400">
                                                {searchTerm ? "No se encontraron materias" : "Escribe para buscar..."}
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100">
                                                {availableMaterias.map(m => (
                                                    <button
                                                        key={m.materia_id}
                                                        onClick={() => setSelectedMateria(m)}
                                                        className="w-full text-left px-4 py-3 hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center justify-between group"
                                                    >
                                                        <span className="font-medium text-sm text-slate-700 group-hover:text-purple-700">{m.materia_nombre}</span>
                                                        <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500 group-hover:border-purple-200">
                                                            {m.area || 'General'}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* PASO 2: Selección de Docente (Solo aparece si se eligió materia) */}
                            {selectedMateria && (
                                <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-2 fade-in">
                                    <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg flex items-center gap-3">
                                        <BookOpen className="w-5 h-5 text-purple-600" />
                                        <div>
                                            <p className="text-xs text-purple-600 font-bold uppercase">Materia Seleccionada</p>
                                            <p className="font-bold text-slate-800">{selectedMateria.materia_nombre}</p>
                                        </div>
                                    </div>

                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-2">2. Asignar Docente</label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                                        value={selectedTeacherId}
                                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                                    >
                                        <option value="">-- Selecciona un docente --</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.nombres_completos}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveAssignment}
                                disabled={!selectedMateria || !selectedTeacherId || isSaving}
                                className="px-6 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Guardar Asignación
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}