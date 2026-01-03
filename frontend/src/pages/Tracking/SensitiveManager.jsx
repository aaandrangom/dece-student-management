import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
    ShieldAlert, Plus, Save, X, FileText, UploadCloud,
    Eye, Calendar, Building, Activity, Paperclip, Loader2, ArrowLeft,
    User, Edit2, CheckCircle, AlertTriangle, Trash2, Shield
} from 'lucide-react';

import {
    ListarCasos, CrearCaso, SubirEvidenciaCaso, SeleccionarArchivo, LeerArchivoParaVista
} from '../../../wailsjs/go/services/TrackingService';

export default function SensitiveManager({ studentId, studentName, onBack }) {
    const [casos, setCasos] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [previewData, setPreviewData] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const initialForm = {
        id: 0,
        estudiante_id: studentId,
        fecha_deteccion: new Date().toISOString().split('T')[0],
        entidad_derivacion: '',
        descripcion: '',
        estado: 'Abierto',
        rutas_evidencias: []
    };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        if (studentId) cargarCasos();
    }, [studentId]);

    const cargarCasos = async () => {
        setIsLoading(true);
        try {
            const data = await ListarCasos(studentId);
            setCasos(data || []);
        } catch (error) {
            toast.error("Error al cargar historial de casos");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await CrearCaso(formData);
            toast.success(formData.id === 0 ? "Caso iniciado correctamente" : "Caso actualizado");
            setIsModalOpen(false);
            cargarCasos();
        } catch (error) {
            toast.error("Error: " + error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUploadEvidence = async (casoId) => {
        try {
            const path = await SeleccionarArchivo('pdf');
            if (!path) return;

            const toastId = toast.loading("Encriptando y subiendo evidencia...");
            await SubirEvidenciaCaso(casoId, path);

            toast.dismiss(toastId);

            if (isModalOpen) {
                const data = await ListarCasos(studentId);
                setCasos(data || []);
                const casoActualizado = data.find(c => c.id === casoId);
                if (casoActualizado) {
                    setFormData(prev => ({ ...prev, rutas_evidencias: casoActualizado.rutas_evidencias }));
                }
            } else {
                cargarCasos();
            }
            cargarCasos();
        } catch (error) {
            toast.dismiss();
            toast.error("Error al subir: " + error);
        }
    };

    const handleDeleteEvidence = async (casoId, ruta) => {
        const result = await Swal.fire({
            title: '¿Eliminar evidencia?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        const toastId = toast.loading('Eliminando evidencia...');
        try {
            if (window?.go?.services?.TrackingService?.EliminarEvidenciaCaso) {
                await window.go.services.TrackingService.EliminarEvidenciaCaso(casoId, ruta);
            } else {
                throw new Error('Función de backend no disponible');
            }

            toast.dismiss(toastId);
            toast.success('Evidencia eliminada');

            if (isModalOpen) {
                setFormData(prev => ({ ...prev, rutas_evidencias: (prev.rutas_evidencias || []).filter(r => r !== ruta) }));
            }
            cargarCasos();
        } catch (error) {
            toast.dismiss();
            toast.error('Error al eliminar: ' + String(error));
        }
    };

    const handlePreview = async (ruta) => {
        const toastId = toast.loading("Desencriptando documento...");
        try {
            const base64 = await LeerArchivoParaVista(ruta);
            setPreviewData(base64);
            setIsPreviewOpen(true);
            toast.dismiss(toastId);
        } catch (error) {
            toast.dismiss();
            toast.error("No se pudo leer el archivo");
        }
    };

    const openNewModal = () => {
        setFormData(initialForm);
        setIsModalOpen(true);
    };

    const openEditModal = (caso) => {
        setFormData({
            id: caso.id,
            estudiante_id: studentId,
            fecha_deteccion: caso.fecha_deteccion,
            entidad_derivacion: caso.entidad_derivacion,
            descripcion: caso.descripcion || '',
            estado: caso.estado,
            rutas_evidencias: caso.rutas_evidencias || []
        });
        setIsModalOpen(true);
    };

    const updateField = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));

    return (
        <div className="bg-slate-50/50 min-h-full font-sans animate-in fade-in duration-300">

            {/* --- HEADER Y TABLA (MANTENIDOS IGUAL) --- */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={onBack}
                        className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all shadow-sm group"
                        title="Volver al buscador"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <div className="border-l border-slate-200 pl-4 h-10 flex flex-col justify-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <User className="w-3 h-3" /> Estudiante
                        </span>
                        <h2 className="text-lg font-bold text-slate-800 leading-tight">
                            {studentName || 'Sin nombre'}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <div className="hidden md:block text-right mr-4">
                        <span className="text-xs text-slate-400 font-medium uppercase">Total Casos</span>
                        <p className="text-xl font-bold text-slate-800 leading-none">{casos.length}</p>
                    </div>
                    <button
                        onClick={openNewModal}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Aperturar Caso
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-10">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Código</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Entidad / Derivación</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Evidencias</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {isLoading ? (
                            <tr><td colSpan="6" className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" /></td></tr>
                        ) : casos.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic">No existen casos registrados para este estudiante.</td></tr>
                        ) : (
                            casos.map((caso) => (
                                <tr key={caso.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-700 font-mono font-bold">{caso.codigo_caso}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{caso.fecha_deteccion}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">
                                        {caso.entidad_derivacion ? (
                                            <span className="flex items-center gap-1.5">
                                                <Building className="w-3 h-3 text-slate-400" /> {caso.entidad_derivacion}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 italic">Interno</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1 w-fit border ${caso.estado === 'Abierto' ? 'bg-red-50 text-red-600 border-red-100' :
                                            caso.estado === 'Cerrado' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {caso.estado === 'Abierto' ? <Activity className="w-3 h-3" /> :
                                                caso.estado === 'Cerrado' ? <CheckCircle className="w-3 h-3" /> :
                                                    <AlertTriangle className="w-3 h-3" />}
                                            {caso.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-700">
                                        <div className="flex items-center gap-1 text-slate-500">
                                            <Paperclip className="w-3 h-3" />
                                            {caso.total_evidencias} docs
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => openEditModal(caso)} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- FORMULARIO REDISEÑADO --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">

                        {/* HEADER MODAL */}
                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <ShieldAlert className="w-6 h-6 text-indigo-600" />
                                    {formData.id === 0 ? 'Apertura de Nuevo Caso' : 'Gestión de Caso'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 ml-8 flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> Expediente confidencial DECE
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* BODY MODAL */}
                        <div className="overflow-y-auto bg-white flex-1">
                            <form onSubmit={handleSave} className="h-full flex flex-col">
                                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12">

                                    {/* COLUMNA IZQUIERDA: DETALLES (Mayor espacio) */}
                                    <div className="lg:col-span-7 p-8 border-r border-slate-100">
                                        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-6 flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> Detalles del Suceso
                                        </h4>

                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha de Detección</label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                                        <input
                                                            type="date"
                                                            required
                                                            value={formData.fecha_deteccion}
                                                            onChange={e => updateField('fecha_deteccion', e.target.value)}
                                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Estado Actual</label>
                                                    <div className="relative">
                                                        <select
                                                            value={formData.estado}
                                                            onChange={e => updateField('estado', e.target.value)}
                                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none"
                                                        >
                                                            <option value="Abierto">Abierto (En seguimiento)</option>
                                                            <option value="Derivado">Derivado (Entidad Externa)</option>
                                                            <option value="Cerrado">Cerrado (Resuelto)</option>
                                                        </select>
                                                        <Activity className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Entidad de Derivación (Opcional)</label>
                                                <div className="relative">
                                                    <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Ej: Fiscalía, UDAI, Ministerio de Salud..."
                                                        value={formData.entidad_derivacion}
                                                        onChange={e => updateField('entidad_derivacion', e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="h-full">
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Descripción y Antecedentes</label>
                                                <textarea
                                                    required
                                                    rows="8"
                                                    value={formData.descripcion}
                                                    onChange={e => updateField('descripcion', e.target.value)}
                                                    placeholder="Detalle los hechos observados, narrativa de la situación y cualquier antecedente relevante para el caso..."
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    {/* COLUMNA DERECHA: EVIDENCIAS (Panel diferenciado) */}
                                    <div className="lg:col-span-5 bg-slate-50 p-8 flex flex-col h-full border-t lg:border-t-0 border-slate-200">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                <Paperclip className="w-4 h-4" /> Expediente Digital
                                            </h4>
                                            {formData.id > 0 && (
                                                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                                                    {formData.rutas_evidencias?.length || 0} Archivos
                                                </span>
                                            )}
                                        </div>

                                        {formData.id === 0 ? (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                                                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-3">
                                                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                                                </div>
                                                <h5 className="text-sm font-bold text-slate-700 mb-1">Modo Creación</h5>
                                                <p className="text-xs text-slate-500 max-w-xs">
                                                    Para adjuntar evidencias digitales, primero debe guardar la información inicial del caso.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col h-full">
                                                <button
                                                    type="button"
                                                    onClick={() => handleUploadEvidence(formData.id)}
                                                    className="w-full py-3 bg-white border border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 transition-all font-semibold shadow-sm flex items-center justify-center gap-2 mb-4 group"
                                                >
                                                    <UploadCloud className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                    Adjuntar Nueva Evidencia (PDF)
                                                </button>

                                                <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                                                    {formData.rutas_evidencias && formData.rutas_evidencias.length > 0 ? (
                                                        formData.rutas_evidencias.map((ruta, idx) => (
                                                            <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600 shrink-0">
                                                                        <FileText className="w-5 h-5" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-bold text-slate-700 truncate">Evidencia Documental #{idx + 1}</p>
                                                                        <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5" title={ruta}>
                                                                            ...{ruta.slice(-25)}
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handlePreview(ruta)}
                                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                        title="Ver Documento"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteEvidence(formData.id, ruta)}
                                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                                                                        title="Eliminar evidencia"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="h-40 flex flex-col items-center justify-center text-slate-400 bg-slate-100/50 rounded-xl border border-dashed border-slate-200">
                                                            <Paperclip className="w-8 h-8 mb-2 opacity-50" />
                                                            <span className="text-xs">No hay documentos adjuntos</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* FOOTER MODAL */}
                                <div className="px-8 py-4 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {formData.id === 0 ? 'Crear Caso' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* --- VISUALIZADOR (MANTENIDO IGUAL) --- */}
            {isPreviewOpen && previewData && (
                <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm flex justify-center items-center z-60 p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden relative">
                        <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center shadow-md shrink-0">
                            <span className="font-bold text-sm flex items-center gap-2 text-slate-200">
                                <FileText className="w-4 h-4 text-indigo-400" /> Vista Previa de Evidencia
                            </span>
                            <button onClick={() => { setIsPreviewOpen(false); setPreviewData(null); }} className="p-1.5 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 bg-slate-100 relative">
                            {previewData.startsWith('data:image') ? (
                                <img src={previewData} alt="Vista previa" className="w-full h-full object-contain" />
                            ) : (
                                <iframe src={previewData} className="w-full h-full border-0" title="PDF Preview" />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}