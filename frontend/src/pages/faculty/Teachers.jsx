import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import Swal from 'sweetalert2';
import {
    Users, Plus, Search, CheckCircle2, XCircle, Power, Pencil,
    Mail, Phone, IdCard, GraduationCap, X, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';

import {
    ListarDocentes, CrearDocente, ActualizarDocente, ToggleEstado
} from '../../../wailsjs/go/services/TeacherService';

export default function TeachersPage() {
    const [teachers, setTeachers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        cedula: '',
        nombres_completos: '',
        telefono: '',
        correo: ''
    });

    useEffect(() => {
        loadTeachers();
    }, []);

    const loadTeachers = async () => {
        setIsLoading(true);
        try {
            const data = await ListarDocentes(false);
            setTeachers(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar la planta docente");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if ((name === 'cedula' || name === 'telefono') && !/^\d*$/.test(value)) {
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingId(null);
        setFormData({ cedula: '', nombres_completos: '', telefono: '', correo: '' });
        setIsCreateModalOpen(true);
    };

    const openEditModal = (teacher) => {
        setIsEditMode(true);
        setEditingId(teacher.id);
        setFormData({
            cedula: teacher.cedula,
            nombres_completos: teacher.nombres_completos,
            telefono: teacher.telefono,
            correo: teacher.correo
        });
        setIsCreateModalOpen(true);
    };

    const closeModal = () => {
        setIsCreateModalOpen(false);
        setFormData({ cedula: '', nombres_completos: '', telefono: '', correo: '' });
        setIsEditMode(false);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.cedula || !formData.nombres_completos) {
            toast.warning("Cédula y Nombres son obligatorios");
            return;
        }

        if (formData.cedula.length !== 10) {
            toast.error("La cédula debe tener exactamente 10 dígitos");
            return;
        }

        try {
            const payload = {
                cedula: formData.cedula,
                nombres_completos: formData.nombres_completos,
                telefono: formData.telefono,
                correo: formData.correo
            };

            if (isEditMode && editingId) {
                await ActualizarDocente({ id: editingId, ...payload });
                toast.success("Docente actualizado exitosamente");
            } else {
                await CrearDocente(payload);
                toast.success("Docente registrado exitosamente");
            }

            closeModal();
            loadTeachers();
        } catch (error) {
            toast.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} docente: ` + error);
        }
    };

    const handleToggleStatus = async (teacher) => {
        const action = teacher.activo ? 'desactivar' : 'activar';
        const color = teacher.activo ? '#ef4444' : '#10b981';

        const result = await Swal.fire({
            title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} Docente?`,
            text: `¿Estás seguro de ${action} a ${teacher.nombres_completos}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: color,
            cancelButtonColor: '#64748b',
            confirmButtonText: `Sí, ${action}`,
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
                await ToggleEstado(teacher.id);
                toast.success(`Docente ${action === 'activar' ? 'activado' : 'desactivado'} correctamente`);
                loadTeachers();
            } catch (error) {
                toast.error("Error al cambiar estado: " + error);
            }
        }
    };

    const filteredTeachers = teachers.filter(t =>
        t.nombres_completos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.cedula.includes(searchTerm)
    );

    const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / rowsPerPage));
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleRowsPerPageChange = (newSize) => {
        setRowsPerPage(newSize);
        setCurrentPage(1);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans">

            <div className="w-full flex flex-col gap-6">

                <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 shadow-sm">
                            <GraduationCap className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Planta Docente</h1>
                            <p className="text-sm text-slate-500 font-medium">Directorio de profesores y personal académico</p>
                        </div>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-bold shadow-md hover:shadow-purple-200 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Docente
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">

                    <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o cédula..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium ml-auto">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Activos
                            </span>
                            <span className="w-px h-3 bg-slate-300 mx-1"></span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-slate-300"></span> Inactivos
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Docente</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contacto</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                                <span className="text-sm font-medium">Cargando docentes...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredTeachers.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-16 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Users className="w-12 h-12 text-slate-200 mb-2" />
                                                <p className="font-medium">No se encontraron docentes</p>
                                                <p className="text-xs mt-1 text-slate-400">Registre nuevos docentes para asignarlos a cursos</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedTeachers.map((teacher) => (
                                        <tr key={teacher.id} className={`transition-colors ${!teacher.activo ? 'bg-slate-50/50 grayscale-[0.5]' : 'hover:bg-purple-50/30'}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border ${teacher.activo
                                                        ? 'bg-purple-50 text-purple-600 border-purple-100'
                                                        : 'bg-slate-100 text-slate-400 border-slate-200'
                                                        }`}>
                                                        {teacher.nombres_completos.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-bold ${teacher.activo ? 'text-slate-800' : 'text-slate-500'}`}>
                                                            {teacher.nombres_completos}
                                                        </p>
                                                        <p className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                                            <IdCard className="w-3 h-3" />
                                                            {teacher.cedula}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    {teacher.telefono && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                            {teacher.telefono}
                                                        </div>
                                                    )}
                                                    {teacher.correo && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                            {teacher.correo}
                                                        </div>
                                                    )}
                                                    {!teacher.telefono && !teacher.correo && (
                                                        <span className="text-xs text-slate-400 italic">Sin contacto</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {teacher.activo ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(teacher)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 shadow-sm"
                                                        title="Editar información"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleToggleStatus(teacher)}
                                                        className={`p-2 rounded-lg transition-all border border-transparent shadow-sm ${teacher.activo
                                                            ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100'
                                                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100'
                                                            }`}
                                                        title={teacher.activo ? "Desactivar docente" : "Activar docente"}
                                                    >
                                                        <Power className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer de Paginación */}
                    {filteredTeachers.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-white gap-4">
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-slate-500">
                                    Mostrando <span className="font-semibold text-slate-700">{startIndex + 1}</span> a <span className="font-semibold text-slate-700">{Math.min(endIndex, filteredTeachers.length)}</span> de <span className="font-semibold text-slate-700">{filteredTeachers.length}</span> docentes
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-600">Filas:</span>
                                    <select
                                        value={rowsPerPage}
                                        onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                                        className="border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Anterior
                                </button>
                                <span className="text-sm text-slate-600">
                                    Página <span className="font-semibold text-slate-700">{currentPage}</span> de <span className="font-semibold text-slate-700">{totalPages}</span>
                                </span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Siguiente <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 scale-100 transform transition-all">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-600" />
                                {isEditMode ? 'Editar Docente' : 'Nuevo Docente'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cédula</label>
                                    <input
                                        type="text"
                                        name="cedula"
                                        required
                                        maxLength={10}
                                        placeholder="0000000000"
                                        className={`w-full px-4 py-2.5 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all ${isEditMode
                                            ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                                            : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400'
                                            }`}
                                        value={formData.cedula}
                                        onChange={handleInputChange}
                                        disabled={isEditMode}
                                    />
                                    {!isEditMode && <p className="text-[10px] text-slate-400 ml-1">Debe tener 10 dígitos</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Teléfono</label>
                                    <input
                                        type="tel"
                                        name="telefono"
                                        placeholder="099..."
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                        value={formData.telefono}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombres Completos</label>
                                <input
                                    type="text"
                                    name="nombres_completos"
                                    required
                                    placeholder="Ej: Lic. Juan Pérez"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                    value={formData.nombres_completos}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Correo Electrónico</label>
                                <input
                                    type="email"
                                    name="correo"
                                    placeholder="docente@escuela.edu.ec"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                    value={formData.correo}
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
                                    {isEditMode ? 'Guardar Cambios' : 'Registrar Docente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}