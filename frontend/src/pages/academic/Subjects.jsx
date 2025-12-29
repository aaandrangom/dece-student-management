import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
    BookOpen, Plus, Search, Trash2,
    X, Loader2, Pencil, Filter, Library
} from 'lucide-react';

import {
    ListarMaterias, CrearMateria, ActualizarMateria, EliminarMateria
} from '../../../wailsjs/go/academic/SubjectService';

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [areaFilter, setAreaFilter] = useState('');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        nombre: '',
        area: ''
    });

    const areas = [
        "Ciencias Exactas",
        "Ciencias Naturales",
        "Ciencias Sociales",
        "Lengua y Literatura",
        "Educación Artística",
        "Educación Física",
        "Idiomas",
        "Tecnología",
        "Interdisciplinar"
    ];

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        setIsLoading(true);
        try {
            const data = await ListarMaterias();
            setSubjects(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar las materias");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingId(null);
        setFormData({ nombre: '', area: '' });
        setIsCreateModalOpen(true);
    };

    const openEditModal = (subject) => {
        setIsEditMode(true);
        setEditingId(subject.id);
        setFormData({
            nombre: subject.nombre,
            area: subject.area
        });
        setIsCreateModalOpen(true);
    };

    const closeModal = () => {
        setIsCreateModalOpen(false);
        setFormData({ nombre: '', area: '' });
        setIsEditMode(false);
        setEditingId(null);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nombre || !formData.area) {
            toast.warning("El nombre y el área son obligatorios");
            return;
        }

        try {
            const payload = {
                nombre: formData.nombre,
                area: formData.area
            };

            if (isEditMode && editingId) {
                await ActualizarMateria({ id: editingId, ...payload });
                toast.success("Materia actualizada exitosamente");
            } else {
                await CrearMateria(payload);
                toast.success("Materia creada exitosamente");
            }

            closeModal();
            loadSubjects();
        } catch (error) {
            toast.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} materia: ` + error);
        }
    };

    const handleDelete = async (subject) => {
        const result = await Swal.fire({
            title: '¿Eliminar Materia?',
            text: `Vas a eliminar "${subject.nombre}". Esta acción no se puede deshacer y solo es posible si no está asignada a ningún distributivo.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-2xl',
                confirmButton: 'rounded-xl px-4 py-2 font-bold',
                cancelButton: 'rounded-xl px-4 py-2 font-bold'
            }
        });

        if (result.isConfirmed) {
            try {
                await EliminarMateria(subject.id);
                toast.success("Materia eliminada correctamente");
                loadSubjects();
            } catch (error) {
                toast.error(typeof error === 'string' ? error : "No se pudo eliminar la materia (posiblemente está asignada)");
            }
        }
    };

    const filteredSubjects = subjects.filter(s => {
        const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesArea = areaFilter ? s.area === areaFilter : true;
        return matchesSearch && matchesArea;
    });

    return (
        <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans">

            <div className="w-full flex flex-col gap-6">

                <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 shadow-sm">
                            <BookOpen className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Gestión de Materias</h1>
                            <p className="text-sm text-slate-500 font-medium">Catálogo de asignaturas académicas</p>
                        </div>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-bold shadow-md hover:shadow-purple-200 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Materia
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">

                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4 bg-slate-50/30">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar materia..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <select
                                className="w-full pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 appearance-none cursor-pointer text-slate-600"
                                value={areaFilter}
                                onChange={(e) => setAreaFilter(e.target.value)}
                            >
                                <option value="">Todas las Áreas</option>
                                {areas.map(area => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">Nombre de la Materia</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Área Académica</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-32">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-20 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                                <span className="text-sm font-medium">Cargando materias...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredSubjects.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-16 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Library className="w-12 h-12 text-slate-200 mb-2" />
                                                <p className="font-medium">No se encontraron materias</p>
                                                <p className="text-xs mt-1 text-slate-400">Prueba ajustando los filtros de búsqueda</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSubjects.map((subject) => (
                                        <tr key={subject.id} className="hover:bg-purple-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 font-bold text-xs">
                                                        {subject.nombre.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-slate-800 text-sm">
                                                        {subject.nombre}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                    {subject.area}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEditModal(subject)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 shadow-sm"
                                                        title="Editar materia"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(subject)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 shadow-sm"
                                                        title="Eliminar materia"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 scale-100 transform transition-all">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-purple-600" />
                                {isEditMode ? 'Editar Materia' : 'Nueva Materia'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                    Nombre de la Materia
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    required
                                    placeholder="Ej: Matemáticas"
                                    className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                    Área Académica
                                </label>
                                <div className="relative">
                                    <select
                                        name="area"
                                        required
                                        className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all bg-white border-slate-200 text-slate-800 appearance-none cursor-pointer"
                                        value={formData.area}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Seleccione un área...</option>
                                        {areas.map(area => (
                                            <option key={area} value={area}>{area}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
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
                                    {isEditMode ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {isEditMode ? 'Guardar Cambios' : 'Crear Materia'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}