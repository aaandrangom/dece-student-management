import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import Swal from 'sweetalert2';
import {
    Layers,
    Plus,
    Search,
    Trash2,
    X,
    Save,
    Loader2,
    Pencil,
    ArrowDownAZ,
    SortAsc
} from 'lucide-react';

import {
    ListarNiveles,
    CrearNivel,
    ActualizarNivel,
    EliminarNivel
} from '../../../wailsjs/go/academic/LevelService';

export default function LevelsPage() {
    const [levels, setLevels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        nombre: '',
        nombre_completo: '',
        orden: ''
    });

    useEffect(() => {
        loadLevels();
    }, []);

    const loadLevels = async () => {
        setIsLoading(true);
        try {
            const data = await ListarNiveles();
            setLevels(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar los niveles educativos");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const finalValue = name === 'orden' ? (value === '' ? '' : parseInt(value)) : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const openCreateModal = () => {
        const maxOrder = levels.length > 0 ? Math.max(...levels.map(l => l.Orden)) : 0;

        setIsEditMode(false);
        setEditingId(null);
        setFormData({
            nombre: '',
            nombre_completo: '',
            orden: maxOrder + 1
        });
        setIsCreateModalOpen(true);
    };

    const openEditModal = (level) => {
        setIsEditMode(true);
        setEditingId(level.id);
        setFormData({
            nombre: level.nombre,
            nombre_completo: level.nombre_completo,
            orden: level.orden
        });
        setIsCreateModalOpen(true);
    };

    const closeModal = () => {
        setIsCreateModalOpen(false);
        setFormData({ nombre: '', nombre_completo: '', orden: '' });
        setIsEditMode(false);
        setEditingId(null);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nombre || !formData.orden) {
            toast.warning("Nombre y Orden son obligatorios");
            return;
        }

        try {
            const payload = {
                nombre: formData.nombre,
                nombre_completo: formData.nombre_completo,
                orden: parseInt(formData.orden)
            };

            if (isEditMode && editingId) {
                await ActualizarNivel({ id: editingId, ...payload });
                toast.success("Nivel actualizado exitosamente");
            } else {
                await CrearNivel(payload);
                toast.success("Nivel creado exitosamente");
            }

            closeModal();
            loadLevels();
        } catch (error) {
            toast.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} nivel: ` + error);
        }
    };

    const handleDelete = async (level) => {
        const result = await Swal.fire({
            title: '¿Eliminar Nivel?',
            text: `Vas a eliminar "${level.nombre}". Esta acción no se puede deshacer y solo es posible si no hay cursos asociados.`,
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
                await EliminarNivel(level.id);
                toast.success("Nivel eliminado correctamente");
                loadLevels();
            } catch (error) {
                toast.error(typeof error === 'string' ? error : "No se pudo eliminar el nivel (posiblemente tiene cursos asociados)");
            }
        }
    };

    const filteredLevels = levels.filter(l =>
        l.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans">
            <Toaster position="top-right" richColors />

            <div className="w-full flex flex-col gap-6">

                <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 shadow-sm">
                            <Layers className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Niveles Educativos</h1>
                            <p className="text-sm text-slate-500 font-medium">Jerarquía y orden de los cursos</p>
                        </div>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-bold shadow-md hover:shadow-purple-200 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Nivel
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">

                    <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar nivel (ej: 8vo, Bachillerato)..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24 text-center">Orden</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Corto</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                                <span className="text-sm font-medium">Cargando niveles...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredLevels.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-16 text-center text-slate-400">
                                            <p className="font-medium">No se encontraron niveles registrados</p>
                                            <p className="text-xs mt-1">Define la estructura académica creando niveles</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLevels.map((level) => (
                                        <tr key={level.id} className="hover:bg-purple-50/30 transition-colors group">
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-sm border border-slate-200 shadow-sm">
                                                    {level.orden}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-slate-800 text-sm">
                                                    {level.nombre}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {level.nombre_completo || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(level)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 shadow-sm"
                                                        title="Editar nivel"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(level)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 shadow-sm"
                                                        title="Eliminar nivel"
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
                                <SortAsc className="w-5 h-5 text-purple-600" />
                                {isEditMode ? 'Editar Nivel' : 'Nuevo Nivel Educativo'}
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
                                    Número de Orden (Jerarquía)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <ArrowDownAZ className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="number"
                                        name="orden"
                                        required
                                        min="1"
                                        placeholder="Ej: 1"
                                        className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium bg-white border-slate-200 text-slate-800"
                                        value={formData.orden}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400">Define la secuencia: 1 para el nivel más bajo, etc.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre Corto</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    required
                                    placeholder="Ej: 8vo EGB"
                                    className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre Completo (Opcional)</label>
                                <input
                                    type="text"
                                    name="nombre_completo"
                                    placeholder="Ej: Octavo Año de Educación General Básica"
                                    className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
                                    value={formData.nombre_completo}
                                    onChange={handleInputChange}
                                />
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
                                    {isEditMode ? 'Guardar Cambios' : 'Crear Nivel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}