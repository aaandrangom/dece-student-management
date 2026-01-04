import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
    Presentation, Calendar, Users, FileCheck, UploadCloud,
    Plus, Edit2, Trash2, X, Eye, Loader2, Save, CheckCircle, MoreVertical, ChevronLeft, ChevronRight
} from 'lucide-react';

import {
    ListarCapacitaciones,
    RegistrarCapacitacion,
    ObtenerCapacitacion,
    SubirEvidenciaCapacitacion,
    EliminarCapacitacion,
    ListarAulasPeriodoActivo
} from '../../../wailsjs/go/services/ManagementService';

import {
    SeleccionarArchivo,
    LeerArchivoParaVista
} from '../../../wailsjs/go/services/TrackingService';

export default function TrainingManager() {
    const [trainings, setTrainings] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [aulas, setAulas] = useState([]);
    const [isLoadingAulas, setIsLoadingAulas] = useState(false);

    const [openActions, setOpenActions] = useState(null);

    const [previewData, setPreviewData] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const initialForm = {
        id: 0,
        tema: '',
        fecha: '',
        grupo_objetivo: 'Padres de Familia',
        jornada_docentes: '',
        curso_id: 0,
        grado_especifico: '',
        paralelo_especifico: '',
        cantidad_beneficiarios: 0
    };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        loadTrainings();
    }, []);

    useEffect(() => {
        if (!formData.fecha) {
            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
            setFormData((prev) => ({ ...prev, fecha: local }));
        }
    }, []);

    const loadAulas = async () => {
        setIsLoadingAulas(true);
        try {
            const data = await ListarAulasPeriodoActivo();
            setAulas(data || []);
        } catch (e) {
            toast.error('No se pudieron cargar las aulas');
        } finally {
            setIsLoadingAulas(false);
        }
    };

    useEffect(() => {
        const onMouseDown = (event) => {
            if (event.target.closest('[data-actions-anchor="true"]')) return;
            if (event.target.closest('[data-actions-flyout="true"]')) return;
            setOpenActions(null);
        };

        const onRepositionOrClose = () => {
            setOpenActions(null);
        };

        document.addEventListener('mousedown', onMouseDown);
        window.addEventListener('scroll', onRepositionOrClose, true);
        window.addEventListener('resize', onRepositionOrClose);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('scroll', onRepositionOrClose, true);
            window.removeEventListener('resize', onRepositionOrClose);
        };
    }, []);

    const loadTrainings = async () => {
        setIsLoading(true);
        try {
            const data = await ListarCapacitaciones();
            setTrainings(data || []);
        } catch (error) {
            toast.error("Error al cargar capacitaciones");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                cantidad_beneficiarios: parseInt(formData.cantidad_beneficiarios || 0)
            };

            await RegistrarCapacitacion(payload);
            toast.success(formData.id === 0 ? "Taller registrado" : "Taller actualizado");
            setIsModalOpen(false);
            loadTrainings();
        } catch (error) {
            toast.error("Error: " + error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que desea eliminar este registro? Se borrará la evidencia física también.")) return;
        try {
            setOpenActions(null);
            await EliminarCapacitacion(id);
            toast.success("Registro eliminado");
            loadTrainings();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const handleUpload = async (id) => {
        try {  
            const path = await SeleccionarArchivo('pdf');
            if (!path) return;

            const toastId = toast.loading("Subiendo evidencia...");
            await SubirEvidenciaCapacitacion(id, path);

            toast.dismiss(toastId);
            toast.success("Evidencia guardada");
            loadTrainings();
        } catch (error) {
            toast.dismiss();
            toast.error("Error al subir: " + error);
        }
    };

    const handlePreview = async (ruta) => {
        if (!ruta) return;
        setOpenActions(null);
        const toastId = toast.loading("Cargando archivo...");
        try {
            const base64 = await LeerArchivoParaVista(ruta);
            setPreviewData(base64);
            setIsPreviewOpen(true);
        } catch (error) {
            toast.error("No se pudo abrir el archivo");
        } finally {
            toast.dismiss(toastId);
        }
    };

    const handleEdit = async (id) => {
        const toastId = toast.loading("Cargando datos...");
        try {
            setOpenActions(null);
            const data = await ObtenerCapacitacion(id);
            const fechaLocal = (data.fecha || '').includes(' ') ? data.fecha.replace(' ', 'T') : (data.fecha || '');
            setFormData({
                ...data,
                fecha: fechaLocal,
                curso_id: data.curso_id ?? 0,
            });
            await loadAulas();
            setIsModalOpen(true);
        } catch (error) {
            toast.error("Error al obtener detalle");
        } finally {
            toast.dismiss(toastId);
        }
    };

    const openNew = () => {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
        setFormData({ ...initialForm, fecha: local });
        loadAulas();
        setIsModalOpen(true);
    };

    const toggleActionsMenu = (trainingId, anchorEl) => {
        if (!anchorEl) return;
        if (openActions?.id === trainingId) {
            setOpenActions(null);
            return;
        }

        const rect = anchorEl.getBoundingClientRect();
        const menuEstimatedHeight = 132;
        const openUp = rect.bottom + menuEstimatedHeight > window.innerHeight - 8;
        setOpenActions({ id: trainingId, rect, openUp });
    };

    const renderActionsMenu = () => {
        if (!openActions) return null;

        const training = trainings.find(t => t.id === openActions.id);
        if (!training) return null;

        const menuWidth = 192;
        const gap = 8;
        const left = Math.max(8, Math.min(openActions.rect.right - menuWidth, window.innerWidth - menuWidth - 8));
        const top = openActions.openUp
            ? Math.max(8, openActions.rect.top - gap)
            : Math.min(openActions.rect.bottom + gap, window.innerHeight - 8);

        return createPortal(
            <div
                data-actions-flyout="true"
                className="fixed z-9999"
                style={{ left, top, transform: openActions.openUp ? 'translateY(-100%)' : 'translateY(0)' }}
            >
                <div className="w-48 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    {training.tiene_evidencia ? (
                        <>
                            <button
                                type="button"
                                onClick={() => handlePreview(training.ruta_evidencia)}
                                className="w-full px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                Ver evidencia
                            </button>
                            <button
                                type="button"
                                onClick={() => handleUpload(training.id)}
                                className="w-full px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2"
                            >
                                <UploadCloud className="w-4 h-4" />
                                Cambiar evidencia
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => handleUpload(training.id)}
                            className="w-full px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2"
                        >
                            <UploadCloud className="w-4 h-4" />
                            Subir evidencia
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => handleEdit(training.id)}
                        className="w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
                    >
                        <Edit2 className="w-4 h-4" />
                        Editar
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDelete(training.id)}
                        className="w-full px-3 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                    </button>
                </div>
            </div>,
            document.body
        );
    };

    const totalPages = Math.max(1, Math.ceil(trainings.length / rowsPerPage));
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedTrainings = trainings.slice(startIndex, endIndex);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleRowsPerPageChange = (newSize) => {
        setRowsPerPage(newSize);
        setCurrentPage(1);
    };

    return (
        <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans animate-in fade-in duration-300">

            <div className="flex flex-col gap-6">

                <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Presentation className="w-7 h-7 text-indigo-600" /> Capacitaciones y Talleres
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Registro de actividades de prevención y promoción.</p>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                        <div className="hidden md:block text-right bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                            <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Registrados</span>
                            <p className="text-xl font-bold text-indigo-700 leading-none">{trainings.length}</p>
                        </div>
                        <button
                            onClick={openNew}
                            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus className="w-5 h-5" /> Registrar Taller
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Tema</th>
                                    <th className="px-6 py-4">Grupo</th>
                                    <th className="px-6 py-4">Asistentes</th>
                                    <th className="px-6 py-4">Evidencia</th>
                                    <th className="px-6 py-4 text-center">Opciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-slate-400">
                                            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin inline-block" />
                                        </td>
                                    </tr>
                                ) : trainings.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-slate-400">No se han registrado talleres en este periodo lectivo.</td>
                                    </tr>
                                ) : (
                                    paginatedTrainings.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    {item.fecha}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-800 font-bold max-w-lg truncate" title={item.tema}>
                                                {item.tema}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700">
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700">
                                                    {item.grupo_objetivo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-slate-400" />
                                                    {item.cantidad_beneficiarios}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {item.tiene_evidencia ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 px-2 py-1">
                                                        <CheckCircle className="w-3 h-3" /> Evidencia
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 px-2 py-1">
                                                        Sin evidencia
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex" data-actions-anchor="true">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => toggleActionsMenu(item.id, e.currentTarget)}
                                                        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="Opciones"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {trainings.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-white gap-4">
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-slate-500">
                                    Mostrando <span className="font-semibold text-slate-700">{startIndex + 1}</span> a <span className="font-semibold text-slate-700">{Math.min(endIndex, trainings.length)}</span> de <span className="font-semibold text-slate-700">{trainings.length}</span> resultados
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-600">Filas:</span>
                                    <select
                                        value={rowsPerPage}
                                        onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                                        className="border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
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

                {renderActionsMenu()}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">

                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    {formData.id === 0 ? (
                                        <>
                                            <Plus className="w-5 h-5 text-indigo-600" /> Registrar Actividad
                                        </>
                                    ) : (
                                        <>
                                            <Edit2 className="w-5 h-5 text-indigo-600" /> Editar Actividad
                                        </>
                                    )}
                                </h3>
                                <p className="text-xs text-slate-500">Registro de capacitaciones y evidencia de asistencia.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto bg-slate-50/50">
                            <form onSubmit={handleSave} className="space-y-6">

                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tema / Título del Taller</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: Prevención de embarazo adolescente"
                                        value={formData.tema}
                                        onChange={e => setFormData({ ...formData, tema: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm px-3 py-2.5"
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Fecha y hora</label>
                                            <input
                                                type="datetime-local"
                                                required
                                                value={formData.fecha}
                                                onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                                                className="w-full border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm px-3 py-2.5"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Asistentes aprox.</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.cantidad_beneficiarios}
                                                onChange={e => setFormData({ ...formData, cantidad_beneficiarios: e.target.value })}
                                                className="w-full border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm px-3 py-2.5"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Detalles de Audiencia</label>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Grupo Objetivo</label>
                                            <select
                                                value={formData.grupo_objetivo}
                                                onChange={e => setFormData({ ...formData, grupo_objetivo: e.target.value, curso_id: 0, jornada_docentes: '' })}
                                                className="w-full border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm px-3 py-2.5 bg-white"
                                            >
                                                <option value="Padres de Familia">Padres de Familia</option>
                                                <option value="Estudiantes">Estudiantes</option>
                                                <option value="Docentes">Docentes</option>
                                                <option value="Comunidad">Comunidad Educativa (General)</option>
                                            </select>
                                        </div>

                                        {formData.grupo_objetivo === 'Docentes' && (
                                            <div className="animate-in fade-in slide-in-from-top-1">
                                                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Jornada</label>
                                                <select
                                                    value={formData.jornada_docentes}
                                                    onChange={e => setFormData({ ...formData, jornada_docentes: e.target.value })}
                                                    className="w-full border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm px-3 py-2.5 bg-white"
                                                >
                                                    <option value="">-- Seleccione --</option>
                                                    <option value="Matutina">Matutina</option>
                                                    <option value="Vespertina">Vespertina</option>
                                                    <option value="Ambas">Ambas</option>
                                                </select>
                                            </div>
                                        )}

                                        {(formData.grupo_objetivo === 'Estudiantes' || formData.grupo_objetivo === 'Padres de Familia') && (
                                            <div className="animate-in fade-in slide-in-from-top-1">
                                                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Aula (curso)</label>
                                                <select
                                                    value={formData.curso_id}
                                                    onChange={e => setFormData({ ...formData, curso_id: parseInt(e.target.value || 0) })}
                                                    className="w-full border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm px-3 py-2.5 bg-white"
                                                    disabled={isLoadingAulas}
                                                >
                                                    <option value={0}>{isLoadingAulas ? 'Cargando...' : '-- Seleccione un aula --'}</option>
                                                    {aulas.map(a => (
                                                        <option key={a.id} value={a.id}>{a.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 shadow-sm hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Guardar Registro
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {isPreviewOpen && previewData && (
                <div className="fixed inset-0 bg-black/90 z-60 flex justify-center items-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-5xl h-[85vh] rounded-lg flex flex-col overflow-hidden relative">
                        <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center">
                            <span className="flex items-center gap-2 text-sm font-bold"><FileCheck className="w-4 h-4 text-teal-400" /> Evidencia de Asistencia</span>
                            <button onClick={() => setIsPreviewOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 bg-slate-200 relative">
                            {previewData.startsWith('data:application/pdf') ? (
                                <iframe src={previewData} className="w-full h-full border-0" title="PDF Preview" />
                            ) : (
                                <img src={previewData} className="w-full h-full object-contain" alt="Evidencia" />
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}