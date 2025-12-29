import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
    Calendar,
    Plus,
    Search,
    Trash2,
    X,
    Loader2,
    History,
    Lock,
    Pencil,
    Power,
    School,
    Archive,
    AlertCircle 
} from 'lucide-react';

import {
    ListarPeriodos,
    CrearPeriodo,
    ActivarPeriodo,
    EliminarPeriodo,
    ActualizarPeriodo,
    CerrarPeriodo
} from '../../../wailsjs/go/academic/YearService';

export default function AcademicYearsPage() {
    const [periods, setPeriods] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        nombre: '',
        fecha_inicio: '',
        fecha_fin: ''
    });

    useEffect(() => {
        loadPeriods();
    }, []);

    const loadPeriods = async () => {
        setIsLoading(true);
        try {
            const data = await ListarPeriodos();
            setPeriods(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar los periodos lectivos");
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
        setFormData({ nombre: '', fecha_inicio: '', fecha_fin: '' });
        setIsCreateModalOpen(true);
    };

    const openEditModal = (period) => {
        setIsEditMode(true);
        setEditingId(period.id);
        setFormData({
            nombre: period.nombre,
            fecha_inicio: period.fecha_inicio ? period.fecha_inicio.split('T')[0] : '',
            fecha_fin: period.fecha_fin ? period.fecha_fin.split('T')[0] : ''
        });
        setIsCreateModalOpen(true);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nombre || !formData.fecha_inicio || !formData.fecha_fin) {
            toast.warning("Todos los campos son obligatorios");
            return;
        }

        if (new Date(formData.fecha_inicio) > new Date(formData.fecha_fin)) {
            toast.error("La fecha de inicio no puede ser posterior a la fecha fin");
            return;
        }

        try {
            const payload = {
                nombre: formData.nombre,
                fecha_inicio: new Date(formData.fecha_inicio).toISOString(),
                fecha_fin: new Date(formData.fecha_fin).toISOString()
            };

            if (isEditMode && editingId) {
                await ActualizarPeriodo({ id: editingId, ...payload });
                toast.success("Periodo actualizado exitosamente");
            } else {
                await CrearPeriodo(payload);
                toast.success("Periodo lectivo creado exitosamente");
            }

            setIsCreateModalOpen(false);
            setFormData({ nombre: '', fecha_inicio: '', fecha_fin: '' });
            setIsEditMode(false);
            setEditingId(null);
            loadPeriods();
        } catch (error) {
            toast.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} periodo: ` + error);
        }
    };

    const handleAction = async (type, period) => {
        let swalOptions = {
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, confirmar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-2xl',
                confirmButton: 'rounded-xl px-4 py-2 font-bold',
                cancelButton: 'rounded-xl px-4 py-2 font-bold'
            }
        };

        if (type === 'ACTIVATE') {
            swalOptions = {
                ...swalOptions,
                title: '¿Activar Periodo?',
                text: `Se iniciará el año ${period.nombre} y se cerrarán automáticamente otros periodos activos.`,
                icon: 'question',
                confirmButtonColor: '#10b981',
                confirmButtonText: 'Sí, activar'
            };
        } else if (type === 'DELETE') {
            swalOptions = {
                ...swalOptions,
                title: '¿Eliminar Periodo?',
                text: `Vas a eliminar el periodo ${period.nombre}. No podrás recuperarlo.`,
                icon: 'error',
                confirmButtonColor: '#ef4444',
                confirmButtonText: 'Sí, eliminar'
            };
        } else if (type === 'CLOSE') {
            swalOptions = {
                ...swalOptions,
                title: '¿Cerrar Periodo?',
                text: `El periodo ${period.nombre} quedará cerrado y no podrá editarse.`,
                icon: 'warning',
                confirmButtonColor: '#f59e0b',
                confirmButtonText: 'Sí, cerrar'
            };
        }

        const result = await Swal.fire(swalOptions);

        if (result.isConfirmed) {
            try {
                if (type === 'ACTIVATE') {
                    await ActivarPeriodo(period.id);
                    toast.success(`Periodo ${period.nombre} activado`);
                } else if (type === 'DELETE') {
                    await EliminarPeriodo(period.id);
                    toast.success("Periodo eliminado");
                } else if (type === 'CLOSE') {
                    await CerrarPeriodo(period.id);
                    toast.success("Periodo cerrado");
                }
                loadPeriods();
            } catch (error) {
                toast.error(typeof error === 'string' ? error : "Ocurrió un error al procesar la solicitud");
            }
        }
    };

    const filteredPeriods = periods.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-EC', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC'
        });
    };

    const getStatusBadge = (period) => {
        if (period.cerrado) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    <Lock className="w-3.5 h-3.5" />
                    Cerrado
                </span>
            );
        }
        if (period.es_activo) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></div>
                    Activo
                </span>
            );
        }

        const now = new Date();
        const end = new Date(period.fecha_fin);

        if (end < now) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                    <History className="w-3.5 h-3.5" />
                    Finalizado
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Calendar className="w-3.5 h-3.5" />
                Planificado
            </span>
        );
    };

    return (
        <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans">
            <div className="w-full flex flex-col gap-6">
                <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 shadow-sm">
                            <School className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Periodos Lectivos</h1>
                            <p className="text-sm text-slate-500 font-medium">Gestión del calendario académico</p>
                        </div>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-bold shadow-md hover:shadow-purple-200 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Periodo
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">

                    <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar periodo (ej: 2024-2025)..."
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
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Periodo</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Inicio</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Fin</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                                <span className="text-sm font-medium">Cargando periodos...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredPeriods.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center text-slate-400">
                                            <p className="font-medium">No se encontraron periodos registrados</p>
                                            <p className="text-xs mt-1">Crea uno nuevo para comenzar el ciclo escolar</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPeriods.map((period) => (
                                        <tr key={period.id} className={`transition-colors ${period.es_activo ? 'bg-purple-50/30 hover:bg-purple-50/50' : 'hover:bg-slate-50'}`}>
                                            <td className="px-6 py-4">
                                                <span className={`font-bold text-sm ${period.es_activo ? 'text-purple-700' : 'text-slate-700'}`}>
                                                    {period.nombre}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                                {formatDate(period.fecha_inicio)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                                {formatDate(period.fecha_fin)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {getStatusBadge(period)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {!period.cerrado ? (
                                                        <>
                                                            <button
                                                                onClick={() => openEditModal(period)}
                                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 shadow-sm"
                                                                title="Editar fechas"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>

                                                            {!period.es_activo && (
                                                                <button
                                                                    onClick={() => handleAction('ACTIVATE', period)}
                                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100 shadow-sm"
                                                                    title="Activar Periodo"
                                                                >
                                                                    <Power className="w-4 h-4" />
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => handleAction('CLOSE', period)}
                                                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all border border-transparent hover:border-amber-100 shadow-sm"
                                                                title="Cerrar año lectivo"
                                                            >
                                                                <Archive className="w-4 h-4" />
                                                            </button>

                                                            {!period.es_activo && (
                                                                <button
                                                                    onClick={() => handleAction('DELETE', period)}
                                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 shadow-sm"
                                                                    title="Eliminar Periodo"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-slate-400 italic mr-2">Solo lectura</span>
                                                            <button
                                                                disabled
                                                                className="p-2 text-slate-300 bg-slate-50 rounded-lg cursor-not-allowed border border-slate-100"
                                                                title="Año cerrado"
                                                            >
                                                                <Lock className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 scale-100 transform transition-all">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-600" />
                                {isEditMode ? 'Editar Fechas' : 'Nuevo Año Lectivo'}
                            </h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre del Período</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    required
                                    placeholder="Ej: 2025-2026"
                                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium ${isEditMode
                                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                                        : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400'
                                        }`}
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    disabled={isEditMode}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        name="fecha_inicio"
                                        required
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                        value={formData.fecha_inicio}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Fecha Fin</label>
                                    <input
                                        type="date"
                                        name="fecha_fin"
                                        required
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                        value={formData.fecha_fin}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            {!isEditMode && (
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex gap-2 items-start">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <p>Por defecto, el nuevo periodo se crea como <strong>Inactivo</strong>. Deberás activarlo manualmente desde la lista.</p>
                                </div>
                            )}

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md shadow-purple-200 transition-all text-sm flex items-center justify-center gap-2 active:scale-95"
                                >
                                    {isEditMode ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {isEditMode ? 'Guardar Cambios' : 'Crear Año'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}