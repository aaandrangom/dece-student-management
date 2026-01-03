import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
    FileText, Save, Plus, Edit2, X, AlertTriangle, CheckCircle, Loader2,
    FileSignature, Gavel, Eye, ArrowLeft, Calendar, User, UploadCloud, AlertCircle
} from 'lucide-react';

import {
    ListarLlamados,
    ObtenerLlamado,
    CrearLlamado,
    SubirDocumentoDisciplina,
    SeleccionarArchivo,
    LeerArchivoParaVista
} from '../../../wailsjs/go/services/TrackingService';

export default function LlamadosAtencion({ matriculaId, nombreEstudiante, onBack }) {
    const [llamados, setLlamados] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [previewData, setPreviewData] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const initialFormState = {
        id: 0,
        matricula_id: matriculaId || 0,
        fecha: new Date().toISOString().split('T')[0],
        motivo: '',
        representante_notificado: false,
        representante_firmo: false,
        motivo_no_firma: '',
        medida_disciplinaria: '',
        cumplio_medida: false,
        motivo_incumplimiento: '',
        ruta_acta: '',
        ruta_resolucion: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (matriculaId) {
            cargarHistorial();
            setFormData(prev => ({ ...prev, matricula_id: matriculaId }));
        }
    }, [matriculaId]);

    const cargarHistorial = async () => {
        try {
            const data = await ListarLlamados(matriculaId);
            setLlamados(data || []);
        } catch (error) {
            toast.error("Error al cargar historial");
        }
    };

    const handleUpload = async (idLlamado, tipoDoc) => {
        try {
            // Si ya existe un archivo, pedimos confirmación antes de reemplazar
            const key = tipoDoc === 'acta' ? 'ruta_acta' : 'ruta_resolucion';
            const existe = !!formData[key];

            if (existe) {
                const result = await Swal.fire({
                    title: '¿Reemplazar archivo?',
                    text: 'El archivo actual será reemplazado.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, reemplazar',
                    cancelButtonText: 'Cancelar',
                    reverseButtons: true,
                });

                if (!result.isConfirmed) return;
            }

            const path = await SeleccionarArchivo('pdf');
            if (!path) return;
            const nombreDoc = tipoDoc === 'acta' ? 'Acta' : 'Resolución';
            const toastId = toast.loading(`Subiendo ${nombreDoc}...`);
            const nuevaRuta = await SubirDocumentoDisciplina(idLlamado, tipoDoc, path);

            if (tipoDoc === 'acta') {
                setFormData(prev => ({ ...prev, ruta_acta: nuevaRuta }));
            } else {
                setFormData(prev => ({ ...prev, ruta_resolucion: nuevaRuta }));
            }
            toast.dismiss(toastId);
            toast.success(`${nombreDoc} subida correctamente`);
        } catch (error) {
            toast.dismiss();
            toast.error("Error: " + error);
        }
    };

    const handlePreview = async (rutaArchivo) => {
        if (!rutaArchivo) return;
        const toastId = toast.loading("Cargando documento...");
        try {
            const base64 = await LeerArchivoParaVista(rutaArchivo);
            if (base64) {
                setPreviewData(base64);
                setIsPreviewOpen(true);
            } else {
                toast.error("No se pudo leer el archivo.");
            }
        } catch (error) {
            toast.error("Error al abrir vista previa");
        } finally {
            toast.dismiss(toastId);
        }
    };

    const handleOpenModal = async (idLlamado = 0) => {
        setIsModalOpen(true);
        if (idLlamado > 0) {
            setIsLoading(true);
            try {
                const data = await ObtenerLlamado(idLlamado);
                setFormData(data);
            } catch (error) {
                toast.error("Error al obtener datos");
                setIsModalOpen(false);
            } finally { setIsLoading(false); }
        } else {
            setFormData({ ...initialFormState, matricula_id: matriculaId });
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const nuevoRegistro = await CrearLlamado(formData);
            toast.success("Guardado correctamente");
            await cargarHistorial();

            if (formData.id === 0 && nuevoRegistro) {
                setFormData(prev => ({ ...prev, id: nuevoRegistro.id }));
            } else {
                setIsModalOpen(false);
            }
        } catch (error) {
            toast.error("Error: " + error);
        } finally { setIsSubmitting(false); }
    };

    const updateField = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));

    return (
        <div className="bg-slate-50/50 min-h-full font-sans animate-in fade-in duration-300">

            {/* --- SECCIÓN ORIGINAL: HEADER Y TABLA --- */}
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
                            {nombreEstudiante || 'Sin nombre'}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <div className="hidden md:block text-right mr-4">
                        <span className="text-xs text-slate-400 font-medium uppercase">Total Faltas</span>
                        <p className="text-xl font-bold text-slate-800 leading-none">{llamados.length}</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal(0)}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Registro
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-10">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Motivo</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Medida</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {llamados.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-700 font-medium">{item.fecha}</td>
                                <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate" title={item.motivo}>{item.motivo}</td>
                                <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">{item.medida || '-'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1 w-fit ${item.estado.includes('Firmado') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {item.estado.includes('Firmado') ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                        {item.estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleOpenModal(item.id)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {llamados.length === 0 && <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">No hay registros disciplinarios.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* --- SECCIÓN NUEVA: FORMULARIO MEJORADO --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">

                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    {formData.id === 0 ? <Plus className="w-5 h-5 text-blue-600" /> : <Edit2 className="w-5 h-5 text-blue-600" />}
                                    {formData.id === 0 ? 'Registrar Falta' : 'Editar Registro'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Complete la información disciplinaria del estudiante.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400 hover:text-slate-600" /></button>
                        </div>

                        <div className="overflow-y-auto p-8 bg-slate-50/50">
                            {isLoading ? (
                                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">

                                    {/* BLOQUE 1: DATOS PRINCIPALES (Full Width) */}
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            <div className="md:col-span-1">
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                                    <input type="date" required value={formData.fecha} onChange={(e) => updateField('fecha', e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                                                </div>
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Descripción del Suceso</label>
                                                <textarea required rows="2" placeholder="Ej: Uso inadecuado de uniforme..." value={formData.motivo} onChange={(e) => updateField('motivo', e.target.value)}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* BLOQUE 2: GRID SIMÉTRICO (Proceso y Sanción) */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Columna Izquierda */}
                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                                            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                                                <FileSignature className="w-4 h-4 text-blue-500" /> Proceso Administrativo
                                            </h4>
                                            <div className="space-y-4 flex-1">
                                                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.representante_notificado ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                                                    <input type="checkbox" checked={formData.representante_notificado} onChange={(e) => updateField('representante_notificado', e.target.checked)} className="mt-1 w-4 h-4 text-blue-600 rounded" />
                                                    <div>
                                                        <span className={`block text-sm font-semibold ${formData.representante_notificado ? 'text-blue-800' : 'text-slate-700'}`}>Representante Notificado</span>
                                                        <span className="text-xs text-slate-500">Se informó al representante legal.</span>
                                                    </div>
                                                </label>

                                                <div className={`p-3 rounded-lg border transition-all ${formData.representante_firmo ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                                                    <label className="flex items-center gap-3 cursor-pointer">
                                                        <input type="checkbox" checked={formData.representante_firmo} onChange={(e) => updateField('representante_firmo', e.target.checked)} className="w-4 h-4 text-green-600 rounded" />
                                                        <span className={`text-sm font-semibold ${formData.representante_firmo ? 'text-green-800' : 'text-slate-700'}`}>Acta Firmada</span>
                                                    </label>
                                                    {!formData.representante_firmo && (
                                                        <div className="mt-3 pl-7 animate-in slide-in-from-top-2">
                                                            <input type="text" placeholder="¿Por qué no firmó?" value={formData.motivo_no_firma} onChange={(e) => updateField('motivo_no_firma', e.target.value)}
                                                                className="w-full px-3 py-1.5 text-sm border-b border-slate-300 focus:border-red-400 outline-none bg-transparent placeholder:text-slate-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Columna Derecha */}
                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                                            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                                                <Gavel className="w-4 h-4 text-purple-500" /> Resolución / Sanción
                                            </h4>
                                            <div className="space-y-4 flex-1 flex flex-col">
                                                <textarea rows="3" placeholder="Describa la medida disciplinaria..." value={formData.medida_disciplinaria} onChange={(e) => updateField('medida_disciplinaria', e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"></textarea>

                                                <div className="mt-auto pt-2">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium text-slate-700">Cumplimiento de Medida</span>
                                                        <button type="button" onClick={() => updateField('cumplio_medida', !formData.cumplio_medida)}
                                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.cumplio_medida ? 'bg-green-600' : 'bg-slate-200'}`}>
                                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.cumplio_medida ? 'translate-x-6' : 'translate-x-1'}`} />
                                                        </button>
                                                    </div>
                                                    {!formData.cumplio_medida && (
                                                        <input type="text" placeholder="Observación de incumplimiento..." value={formData.motivo_incumplimiento} onChange={(e) => updateField('motivo_incumplimiento', e.target.value)}
                                                            className="w-full px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800 focus:border-red-300 outline-none" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* BLOQUE 3: DOCUMENTOS (Diseño mejorado) */}
                                    <div className="bg-slate-100 p-6 rounded-xl border border-slate-200">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <UploadCloud className="w-4 h-4" /> Evidencia Digital
                                        </h4>

                                        {formData.id === 0 ? (
                                            <div className="flex items-center gap-3 text-amber-700 bg-amber-50 px-4 py-3 rounded-lg border border-amber-100">
                                                <AlertCircle className="w-5 h-5 shrink-0" />
                                                <p className="text-sm font-medium">Guarde el registro primero para poder subir documentos.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {[
                                                    { key: 'ruta_acta', label: 'Acta de Compromiso', type: 'acta', color: 'blue' },
                                                    { key: 'ruta_resolucion', label: 'Resolución Rectoral', type: 'resolucion', color: 'purple' }
                                                ].map((doc) => (
                                                    <div key={doc.type} className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${formData[doc.key] ? `bg-${doc.color}-50 text-${doc.color}-600` : 'bg-slate-100 text-slate-400'}`}>
                                                                <FileText className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-700">{doc.label}</p>
                                                                <p className="text-[10px] uppercase font-bold text-slate-400">
                                                                    {formData[doc.key] ? 'Archivo cargado' : 'Sin archivo'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {formData[doc.key] && (
                                                                <button type="button" onClick={() => handlePreview(formData[doc.key])} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors" title="Ver PDF">
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button type="button" onClick={() => handleUpload(formData.id, doc.type)}
                                                                className="text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-800 transition-colors">
                                                                {formData[doc.key] ? 'Cambiar' : 'Subir'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* FOOTER MODAL */}
                                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                                            Cancelar
                                        </button>
                                        <button type="submit" disabled={isSubmitting}
                                            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-md shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition-all">
                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {formData.id === 0 ? 'Guardar Registro' : 'Actualizar Cambios'}
                                        </button>
                                    </div>

                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- SECCIÓN ORIGINAL: VISUALIZADOR DE PDF --- */}
            {isPreviewOpen && previewData && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden relative">
                        <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center shadow-md shrink-0">
                            <span className="font-bold text-sm flex items-center gap-2 text-slate-200">
                                <FileText className="w-4 h-4 text-blue-400" /> Vista Previa
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