import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
    School, Plus, Search, User, BookOpen,
    X, Save, Loader2, GraduationCap, Calendar,
    Trash2,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit3
} from 'lucide-react';

import { ListarCursos, CrearCurso, ActualizarCurso, EliminarCurso } from '../../../wailsjs/go/services/CourseService';
import { ListarNiveles } from '../../../wailsjs/go/academic/LevelService';
import { ListarDocentes } from '../../../wailsjs/go/services/TeacherService';
import { ObtenerPeriodoActivo } from '../../../wailsjs/go/academic/YearService';
import DistributivoView from './TeachingLoad';

export default function CoursesPage() {
    const [courses, setCourses] = useState([]);
    const [levels, setLevels] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [activePeriod, setActivePeriod] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        nivel_id: '',
        paralelo: '',
        jornada: 'Matutina',
        tutor_id: ''
    });

    const [viewMode, setViewMode] = useState('list');
    const [selectedCourse, setSelectedCourse] = useState(null);

    const jornadas = ['Matutina', 'Vespertina', 'Nocturna'];
    const paralelos = ['A', 'B', 'C', 'D'];

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            const periodo = await ObtenerPeriodoActivo();
            if (!periodo) {
                toast.error("No hay un periodo lectivo activo. Configure uno primero.");
                setIsLoading(false);
                return;
            }
            setActivePeriod(periodo);

            const [nivelesData, docentesData] = await Promise.all([
                ListarNiveles(),
                ListarDocentes(true)
            ]);

            setLevels(nivelesData || []);
            setTeachers(docentesData || []);

            await loadCourses(periodo.id);

        } catch (error) {
            console.error(error);
            toast.error("Error al cargar datos iniciales");
        } finally {
            setIsLoading(false);
        }
    };

    const loadCourses = async (periodoID) => {
        try {
            const data = await ListarCursos(periodoID);
            setCourses(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar los cursos");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingId(null);
        setFormData({
            nivel_id: '',
            paralelo: '',
            jornada: 'Matutina',
            tutor_id: ''
        });
        setIsCreateModalOpen(true);
    };

    const openEditModal = (course) => {
        setIsEditMode(true);
        setEditingId(course.id);
        setFormData({
            nivel_id: course.nivel_id,
            paralelo: course.paralelo,
            jornada: course.jornada,
            tutor_id: course.tutor_id || ''
        });
        setIsCreateModalOpen(true);
    };

    const handleDelete = async (course, e) => {
        if (e) e.stopPropagation();

        const result = await Swal.fire({
            title: `Eliminar curso ${course.nombre_completo}`,
            text: `¿Estás seguro de eliminar el curso ${course.nombre_completo}? Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            await EliminarCurso(course.id);
            toast.success('Curso eliminado correctamente');
            if (activePeriod) await loadCourses(activePeriod.id);
        } catch (err) {
            console.error(err);
            toast.error('Error al eliminar curso: ' + String(err));
        }
    };

    const closeModal = () => {
        setIsCreateModalOpen(false);
        setFormData({ nivel_id: '', paralelo: '', jornada: 'Matutina', tutor_id: '' });
        setIsEditMode(false);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nivel_id || !formData.paralelo || !formData.jornada) {
            toast.warning("Nivel, Paralelo y Jornada son obligatorios");
            return;
        }

        if (formData.tutor_id) {
            const tutorIdInt = parseInt(formData.tutor_id);

            const cursoConTutor = courses.find(c =>
                c.tutor_id === tutorIdInt &&
                (!isEditMode || c.id !== editingId)
            );

            if (cursoConTutor) {
                toast.warning(`El docente seleccionado ya es tutor del curso ${cursoConTutor.nivel_nombre} "${cursoConTutor.paralelo}"`);
                return;
            }
        }

        try {
            const payload = {
                periodo_id: activePeriod.id,
                nivel_id: parseInt(formData.nivel_id),
                paralelo: formData.paralelo.toUpperCase(),
                jornada: formData.jornada,
                tutor_id: formData.tutor_id ? parseInt(formData.tutor_id) : null
            };

            if (isEditMode && editingId) {
                await ActualizarCurso({ id: editingId, ...payload });
                toast.success("Curso actualizado exitosamente");
            } else {
                await CrearCurso(payload);
                toast.success("Curso creado exitosamente");
            }

            closeModal();
            loadCourses(activePeriod.id);
        } catch (error) {
            toast.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} curso: ` + error);
        }
    };

    const filteredCourses = courses.filter(c =>
        c.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tutor_nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleOpenDistributivo = (course) => {
        setSelectedCourse(course);
        setViewMode('distributivo');
    };

    if (viewMode === 'distributivo' && selectedCourse) {
        return (
            <DistributivoView
                course={selectedCourse}
                onBack={() => {
                    setViewMode('list');
                    setSelectedCourse(null);
                }}
            />
        );
    }

    return (
        <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans">

            <div className="w-full flex flex-col gap-6">

                <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 shadow-sm">
                            <School className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Gestión de Cursos</h1>
                            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 font-medium">
                                <span>Periodo Lectivo:</span>
                                {activePeriod ? (
                                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 font-bold flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {activePeriod.nombre}
                                    </span>
                                ) : (
                                    <span className="text-red-500 font-bold">Inactivo</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={openCreateModal}
                        disabled={!activePeriod}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-bold shadow-md hover:shadow-purple-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Curso
                    </button>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por curso, paralelo o tutor..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span>Mostrar</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 focus:outline-none focus:border-purple-500 font-semibold"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                        <span>filas</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-3" />
                            <p className="font-medium">Cargando cursos...</p>
                        </div>
                    ) : filteredCourses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <School className="w-12 h-12 mb-2 opacity-20" />
                            <p className="font-medium">No se encontraron cursos</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="px-6 py-4">Nivel / Curso</th>
                                        <th className="px-6 py-4">Paralelo</th>
                                        <th className="px-6 py-4">Jornada</th>
                                        <th className="px-6 py-4">Tutor Asignado</th>
                                        <th className="px-6 py-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {currentItems.map((course) => (
                                        <tr key={course.id} className="hover:bg-purple-50/30 transition-colors">
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                                                {course.nivel_nombre}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                                    {course.paralelo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${course.jornada === 'Matutina' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    course.jornada === 'Vespertina' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                        'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${course.jornada === 'Matutina' ? 'bg-amber-500' :
                                                        course.jornada === 'Vespertina' ? 'bg-indigo-500' :
                                                            'bg-slate-500'
                                                        }`}></span>
                                                    {course.jornada}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`text-sm font-medium ${course.tutor_nombre ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                                                            {course.tutor_nombre || 'Sin asignar'}
                                                        </span>
                                                        {course.tutor_nombre && (
                                                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wide">Dirigente</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(course)}
                                                        className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                                        title="Editar Curso"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={(e) => handleDelete(course, e)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Eliminar Curso"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleOpenDistributivo(course)}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all ml-1"
                                                        title="Gestionar Carga Horaria"
                                                    >
                                                        <BookOpen className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!isLoading && filteredCourses.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                            <span className="text-sm text-slate-500">
                                Mostrando <span className="font-bold text-slate-700">{indexOfFirstItem + 1}</span> a <span className="font-bold text-slate-700">{Math.min(indexOfLastItem, filteredCourses.length)}</span> de <span className="font-bold text-slate-700">{filteredCourses.length}</span> resultados
                            </span>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => paginate(1)}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
                                >
                                    <ChevronsLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                <div className="flex items-center gap-1 mx-2">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum = i + 1;
                                        if (totalPages > 5 && currentPage > 3) {
                                            pageNum = currentPage - 2 + i;
                                            if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => paginate(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum
                                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-600'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => paginate(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
                                >
                                    <ChevronsRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 scale-100 transform transition-all">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-purple-600" />
                                {isEditMode ? 'Editar Curso' : 'Nuevo Curso'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nivel Educativo</label>
                                <select
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                                    value={formData.nivel_id}
                                    onChange={(e) => handleInputChange({ target: { name: 'nivel_id', value: e.target.value } })}
                                >
                                    <option value="">Seleccione un nivel...</option>
                                    {levels.map(level => (
                                        <option key={level.id} value={level.id}>{level.nombre} - {level.nombre_completo}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Paralelo</label>
                                    <select
                                        required
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                                        value={formData.paralelo}
                                        onChange={(e) => handleInputChange({ target: { name: 'paralelo', value: e.target.value } })}
                                    >
                                        <option value="">Seleccione</option>
                                        {paralelos.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Jornada</label>
                                    <select
                                        required
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                                        value={formData.jornada}
                                        onChange={(e) => handleInputChange({ target: { name: 'jornada', value: e.target.value } })}
                                    >
                                        {jornadas.map(j => (
                                            <option key={j} value={j}>{j}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                    <User className="w-3 h-3" /> Tutor / Dirigente
                                </label>
                                <select
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                                    value={formData.tutor_id}
                                    onChange={(e) => handleInputChange({ target: { name: 'tutor_id', value: e.target.value } })}
                                >
                                    <option value="">Sin tutor asignado</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.nombres_completos}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md shadow-purple-200 transition-all text-sm flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Save className="w-4 h-4" />
                                    {isEditMode ? 'Guardar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}