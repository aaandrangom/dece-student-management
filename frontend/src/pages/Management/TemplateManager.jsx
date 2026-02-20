import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
    FileText, Upload, Trash2, Edit2, RefreshCw, X,
    FolderOpen, Tag, Clock, Search, MoreVertical,
    ExternalLink, Replace, Plus, FileWarning, Check
} from 'lucide-react';
import {
    SubirPlantilla, ListarPlantillas, EliminarPlantilla,
    ActualizarPlantilla, ReemplazarArchivoPlantilla,
    AbrirPlantillaEnEditor, RecargarTagsPlantilla, ActualizarTagLabels
} from '../../../wailsjs/go/services/TemplateService';

export default function TemplateManager() {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadForm, setUploadForm] = useState({ nombre: '', descripcion: '' });
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ nombre: '', descripcion: '' });
    const [isEditingLabels, setIsEditingLabels] = useState(false);
    const [editingLabels, setEditingLabels] = useState({});
    const [isSavingLabels, setIsSavingLabels] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setIsLoading(true);
        try {
            const data = await ListarPlantillas();
            setTemplates(data || []);
        } catch (err) {
            toast.error("Error al cargar plantillas");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!uploadForm.nombre.trim()) {
            toast.error("Ingrese un nombre para la plantilla");
            return;
        }

        setIsUploading(true);
        try {
            const result = await SubirPlantilla(uploadForm.nombre, uploadForm.descripcion);
            if (!result) {
                toast.info("Carga cancelada");
                setIsUploading(false);
                return;
            }

            toast.success("Plantilla subida correctamente");
            setIsUploadModalOpen(false);
            setUploadForm({ nombre: '', descripcion: '' });
            loadTemplates();

            // Abrir detalle del template recién creado
            setSelectedTemplate(result);
        } catch (err) {
            toast.error("Error: " + String(err));
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id, nombre) => {
        const result = await Swal.fire({
            title: '¿Eliminar plantilla?',
            html: `Se eliminará <b>"${nombre}"</b> y su archivo asociado.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
        });

        if (!result.isConfirmed) return;

        try {
            await EliminarPlantilla(id);
            toast.success("Plantilla eliminada");
            if (selectedTemplate?.id === id) setSelectedTemplate(null);
            loadTemplates();
        } catch (err) {
            toast.error("Error al eliminar: " + String(err));
        }
    };

    const handleReplace = async (id) => {
        try {
            const result = await ReemplazarArchivoPlantilla(id);
            if (!result) {
                toast.info("Cambio cancelado");
                return;
            }
            toast.success("Archivo reemplazado correctamente");
            setSelectedTemplate(result);
            loadTemplates();
        } catch (err) {
            toast.error("Error: " + String(err));
        }
    };

    const handleOpenInEditor = async (id) => {
        try {
            await AbrirPlantillaEnEditor(id);
            toast.success("Abriendo en editor de Word...");
        } catch (err) {
            toast.error("Error: " + String(err));
        }
    };

    const handleReloadTags = async (id) => {
        try {
            const result = await RecargarTagsPlantilla(id);
            if (result) {
                toast.success("Tags actualizados");
                setSelectedTemplate(result);
                loadTemplates();
                // Reset label editing if active
                if (isEditingLabels) {
                    const tags = getTemplateTags(result);
                    const labels = getTemplateTagLabels(result);
                    const newLabels = {};
                    tags.forEach(tag => { newLabels[tag] = labels[tag] || ''; });
                    setEditingLabels(newLabels);
                }
            }
        } catch (err) {
            toast.error("Error: " + String(err));
        }
    };

    const startEditing = (tpl) => {
        setEditingId(tpl.id);
        setEditForm({ nombre: tpl.nombre, descripcion: tpl.descripcion || '' });
    };

    const saveEditing = async () => {
        if (!editForm.nombre.trim()) {
            toast.error("El nombre no puede estar vacío");
            return;
        }
        try {
            const updated = await ActualizarPlantilla(editingId, editForm.nombre, editForm.descripcion);
            toast.success("Plantilla actualizada");
            setEditingId(null);
            if (selectedTemplate?.id === editingId) setSelectedTemplate(updated);
            loadTemplates();
        } catch (err) {
            toast.error("Error: " + String(err));
        }
    };

    const filteredTemplates = templates.filter(t =>
        t.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.descripcion || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr.replace(' ', 'T'));
            return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch {
            return dateStr;
        }
    };

    const getTemplateTags = (tpl) => {
        // JSONMap serializa con campo "Data": { "tags": [...] }
        if (tpl?.tags?.Data?.tags) return tpl.tags.Data.tags;
        // Fallback por si la estructura cambia
        if (tpl?.tags?.tags) return tpl.tags.tags;
        if (Array.isArray(tpl?.tags)) return tpl.tags;
        return [];
    };

    const getTemplateTagLabels = (tpl) => {
        if (tpl?.tags?.Data?.tag_labels) return tpl.tags.Data.tag_labels;
        if (tpl?.tags?.tag_labels) return tpl.tags.tag_labels;
        return {};
    };

    const startEditingLabels = () => {
        const tags = getTemplateTags(selectedTemplate);
        const labels = getTemplateTagLabels(selectedTemplate);
        const currentLabels = {};
        tags.forEach(tag => {
            currentLabels[tag] = labels[tag] || '';
        });
        setEditingLabels(currentLabels);
        setIsEditingLabels(true);
    };

    const cancelEditingLabels = () => {
        setIsEditingLabels(false);
        setEditingLabels({});
    };

    const saveTagLabels = async () => {
        if (!selectedTemplate) return;
        setIsSavingLabels(true);
        try {
            // Filtrar labels vacíos
            const cleanLabels = {};
            Object.entries(editingLabels).forEach(([tag, label]) => {
                if (label.trim()) cleanLabels[tag] = label.trim();
            });
            const updated = await ActualizarTagLabels(selectedTemplate.id, cleanLabels);
            toast.success("Etiquetas de tags actualizadas");
            setSelectedTemplate(updated);
            setIsEditingLabels(false);
            loadTemplates();
        } catch (err) {
            toast.error("Error: " + String(err));
        } finally {
            setIsSavingLabels(false);
        }
    };

    return (
        <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans animate-in fade-in duration-300">
            <div className="flex flex-col gap-6">

                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-violet-50 rounded-xl border border-violet-100 shadow-sm">
                            <FileText className="w-6 h-6 text-violet-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Gestión de Plantillas</h1>
                            <p className="text-slate-500 text-sm font-medium">Administra plantillas Word para certificados y documentos</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setUploadForm({ nombre: '', descripcion: '' }); setIsUploadModalOpen(true); }}
                        className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 font-medium"
                    >
                        <Plus className="w-5 h-5" /> Nueva Plantilla
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar plantilla..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Main Content: File Manager Grid */}
                <div>
                    {isLoading ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
                            <RefreshCw className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-3" />
                            <p className="text-slate-400 font-medium">Cargando plantillas...</p>
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FolderOpen className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-600 mb-1">
                                {searchQuery ? 'Sin resultados' : 'No hay plantillas'}
                            </h3>
                            <p className="text-slate-400 text-sm mb-6">
                                {searchQuery
                                    ? 'Intente con otro término de búsqueda'
                                    : 'Suba su primera plantilla Word para empezar'}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium transition-all"
                                >
                                    <Upload className="w-4 h-4" /> Subir Plantilla
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                            {filteredTemplates.map(tpl => (
                                <div
                                    key={tpl.id}
                                    onClick={() => setSelectedTemplate(tpl)}
                                    className={`bg-white rounded-xl border-2 shadow-sm p-5 cursor-pointer transition-all duration-200 hover:shadow-md group relative ${selectedTemplate?.id === tpl.id
                                        ? 'border-violet-400 ring-2 ring-violet-100 bg-violet-50/30'
                                        : 'border-slate-200 hover:border-violet-200'
                                        }`}
                                >
                                    {/* File icon + info */}
                                    <div className="flex items-start gap-4">
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-colors ${tpl.ruta_archivo
                                            ? 'bg-blue-50 border border-blue-100'
                                            : 'bg-red-50 border border-red-100'
                                            }`}>
                                            {tpl.ruta_archivo ? (
                                                <FileText className="w-7 h-7 text-blue-500" />
                                            ) : (
                                                <FileWarning className="w-7 h-7 text-red-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {editingId === tpl.id ? (
                                                <input
                                                    type="text"
                                                    value={editForm.nombre}
                                                    onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full text-sm font-bold text-slate-800 bg-white border border-violet-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
                                                    autoFocus
                                                    onKeyDown={(e) => { if (e.key === 'Enter') saveEditing(); if (e.key === 'Escape') setEditingId(null); }}
                                                />
                                            ) : (
                                                <h3 className="text-sm font-bold text-slate-800 truncate">{tpl.nombre}</h3>
                                            )}
                                            {tpl.descripcion && !editingId && (
                                                <p className="text-xs text-slate-500 mt-0.5 truncate">{tpl.descripcion}</p>
                                            )}
                                            {editingId === tpl.id && (
                                                <input
                                                    type="text"
                                                    value={editForm.descripcion}
                                                    onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                                                    onClick={(e) => e.stopPropagation()}
                                                    placeholder="Descripción (opcional)"
                                                    className="w-full text-xs text-slate-600 bg-white border border-slate-200 rounded px-2 py-1 mt-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
                                                    onKeyDown={(e) => { if (e.key === 'Enter') saveEditing(); if (e.key === 'Escape') setEditingId(null); }}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Tags preview */}
                                    <div className="mt-3">
                                        {getTemplateTags(tpl).length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {getTemplateTags(tpl).slice(0, 4).map((tag, idx) => (
                                                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md border border-amber-200">
                                                        <Tag className="w-2.5 h-2.5" />{tag}
                                                    </span>
                                                ))}
                                                {getTemplateTags(tpl).length > 4 && (
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md">
                                                        +{getTemplateTags(tpl).length - 4} más
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 font-medium italic">Sin tags detectados</span>
                                        )}
                                    </div>

                                    {/* Meta info */}
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {formatDate(tpl.fecha_creacion)}
                                        </span>

                                        {/* Quick actions */}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {editingId === tpl.id ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); saveEditing(); }}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Guardar"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); startEditing(tpl); }}
                                                    className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                                    title="Editar nombre"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(tpl.id, tpl.nombre); }}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Not found badge */}
                                    {!tpl.ruta_archivo && (
                                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">
                                            Archivo no encontrado
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Template Detail Modal */}
            {selectedTemplate && !isEditingLabels && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${selectedTemplate.ruta_archivo ? 'bg-blue-50 border border-blue-100' : 'bg-red-50 border border-red-100'}`}>
                                    {selectedTemplate.ruta_archivo ? (
                                        <FileText className="w-6 h-6 text-blue-500" />
                                    ) : (
                                        <FileWarning className="w-6 h-6 text-red-400" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-lg text-slate-800 truncate">{selectedTemplate.nombre}</h3>
                                    {selectedTemplate.descripcion && (
                                        <p className="text-sm text-slate-500 truncate">{selectedTemplate.descripcion}</p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedTemplate(null); setIsEditingLabels(false); }}
                                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors shrink-0 ml-3"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content - Grid Layout */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Left Column */}
                                <div className="space-y-6 col-span-12 lg:col-span-5">
                                    {/* File Info */}
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Archivo</h4>
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selectedTemplate.ruta_archivo ? 'bg-blue-100' : 'bg-red-100'}`}>
                                                {selectedTemplate.ruta_archivo ? (
                                                    <FileText className="w-5 h-5 text-blue-600" />
                                                ) : (
                                                    <FileWarning className="w-5 h-5 text-red-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-700">.DOCX</p>
                                                <p className="text-[10px] text-slate-400 truncate">
                                                    {selectedTemplate.ruta_archivo || 'Archivo no disponible'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fechas</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Creado</p>
                                                <p className="text-xs text-slate-600 font-medium mt-0.5">{formatDate(selectedTemplate.fecha_creacion)}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Modificado</p>
                                                <p className="text-xs text-slate-600 font-medium mt-0.5">{formatDate(selectedTemplate.fecha_modificacion)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Acciones</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {selectedTemplate.ruta_archivo && (
                                                <button
                                                    onClick={() => handleOpenInEditor(selectedTemplate.id)}
                                                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm active:scale-[0.98]"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" /> Abrir en Word
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleReplace(selectedTemplate.id)}
                                                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-all shadow-sm active:scale-[0.98]"
                                            >
                                                <Replace className="w-3.5 h-3.5" /> Cambiar Archivo
                                            </button>
                                            <button
                                                onClick={() => { handleDelete(selectedTemplate.id, selectedTemplate.nombre); }}
                                                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-red-600 text-xs font-bold rounded-xl border border-red-200 hover:bg-red-50 transition-all active:scale-[0.98]"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Tags */}
                                <div className="col-span-12 lg:col-span-7">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                            <Tag className="w-3 h-3" /> Tags Detectados ({getTemplateTags(selectedTemplate).length})
                                        </h4>
                                        <div className="flex items-center gap-1">
                                            {getTemplateTags(selectedTemplate).length > 0 && (
                                                <button
                                                    onClick={startEditingLabels}
                                                    className="text-[10px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                                                    title="Configurar etiquetas personalizadas"
                                                >
                                                    <Edit2 className="w-3 h-3" /> Etiquetas
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleReloadTags(selectedTemplate.id)}
                                                className="text-[10px] text-violet-600 hover:text-violet-700 font-bold flex items-center gap-1 hover:bg-violet-50 px-2 py-1 rounded-lg transition-colors"
                                                title="Recargar tags del archivo"
                                            >
                                                <RefreshCw className="w-3 h-3" /> Recargar
                                            </button>
                                        </div>
                                    </div>

                                    {getTemplateTags(selectedTemplate).length > 0 ? (
                                        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                                            {getTemplateTags(selectedTemplate).map((tag, idx) => {
                                                const labels = getTemplateTagLabels(selectedTemplate);
                                                const label = labels[tag];
                                                return (
                                                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 select-all shrink-0">
                                                            <span className="text-amber-400 font-mono">{`{{}}`}</span>
                                                            {tag}
                                                        </span>
                                                        {label ? (
                                                            <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 truncate">
                                                                {label}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-300 italic">Sin etiqueta</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <Tag className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                            <p className="text-xs text-slate-400">
                                                No se detectaron tags <code className="bg-slate-200 px-1 rounded text-[10px]">{`{{tag}}`}</code> en el documento.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end shrink-0">
                            <button
                                onClick={() => { setSelectedTemplate(null); setIsEditingLabels(false); }}
                                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                                <Upload className="w-6 h-6 text-violet-600" /> Subir Nueva Plantilla
                            </h3>
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="p-2 hover:bg-slate-200/50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Columna Izquierda: Instrucciones */}
                            <div className="space-y-4">
                                <div className="bg-violet-50 p-6 rounded-2xl border border-violet-100 text-sm text-violet-800 space-y-4 h-full flex flex-col">
                                    <div className="flex items-center gap-2 font-bold text-base text-violet-900">
                                        <FileText className="w-5 h-5 text-violet-600 shrink-0" />
                                        <span>Requisitos del Archivo</span>
                                    </div>

                                    <p className="text-violet-700/90 text-sm leading-relaxed">
                                        El archivo debe ser un documento de Word (<b>.docx</b>). Para definir campos variables, utilice el formato de doble llave:
                                    </p>

                                    <div className="bg-white/80 p-6 rounded-xl border border-violet-200/60 flex flex-col items-center justify-center gap-3 flex-1 min-h-[120px]">
                                        <code className="text-xl font-mono font-bold text-violet-700 bg-violet-100 px-3 py-1.5 rounded-lg border border-violet-200 shadow-sm">
                                            {`{{nombre_alumno}}`}
                                        </code>
                                        <span className="text-xs text-violet-400 font-medium bg-white px-2 py-0.5 rounded-full border border-violet-100">
                                            Ejemplo de etiqueta válida
                                        </span>
                                    </div>

                                    <div className="flex gap-2 items-start text-xs text-violet-600 bg-violet-100/50 p-3 rounded-lg">
                                        <Check className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                                        <span>El sistema detectará automáticamente todas las etiquetas al procesar el archivo.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Columna Derecha: Formulario */}
                            <div className="flex flex-col justify-center space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Nombre de la plantilla <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Certificado de Matrícula"
                                        value={uploadForm.nombre}
                                        onChange={(e) => setUploadForm({ ...uploadForm, nombre: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium text-slate-700 shadow-sm placeholder:font-normal"
                                        autoFocus
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1.5 ml-1">
                                        Nombre descriptivo para identificar el documento.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                                        <span>Descripción</span>
                                        <span className="text-slate-400 font-normal text-xs">Opcional</span>
                                    </label>
                                    <textarea
                                        rows="3"
                                        placeholder="Describa el propósito de esta plantilla..."
                                        value={uploadForm.descripcion}
                                        onChange={(e) => setUploadForm({ ...uploadForm, descripcion: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none shadow-sm placeholder:font-normal"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-slate-100 mt-auto">
                                    <button
                                        onClick={() => setIsUploadModalOpen(false)}
                                        disabled={isUploading}
                                        className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleUpload}
                                        disabled={isUploading || !uploadForm.nombre.trim()}
                                        className="flex-[1.5] px-4 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        {isUploading ? (
                                            <><RefreshCw className="w-4 h-4 animate-spin" /> Subiendo...</>
                                        ) : (
                                            <><Upload className="w-4 h-4 group-hover:translate-y-[-1px] transition-transform" /> Seleccionar y Subir</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tag Labels Modal */}
            {isEditingLabels && selectedTemplate && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-violet-600" /> Configurar Etiquetas
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Plantilla: <span className="font-semibold text-slate-700">{selectedTemplate.nombre}</span>
                                </p>
                            </div>
                            <button
                                onClick={cancelEditingLabels}
                                disabled={isSavingLabels}
                                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800 space-y-1">
                                <p className="font-semibold flex items-center gap-2">
                                    <Edit2 className="w-4 h-4 text-blue-500 shrink-0" />
                                    Etiquetas personalizadas
                                </p>
                                <p className="text-blue-600 text-xs leading-relaxed pl-6">
                                    Define nombres legibles para cada tag. Estas etiquetas se mostrarán como nombres de campo en el formulario al generar un certificado.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {getTemplateTags(selectedTemplate).map((tag, idx) => (
                                    <div key={idx} className="group bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:border-violet-100 hover:bg-white transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">
                                                <span className="text-amber-400 font-mono">{`{{}}`}</span>
                                                {tag}
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            value={editingLabels[tag] || ''}
                                            onChange={(e) => setEditingLabels(prev => ({ ...prev, [tag]: e.target.value }))}
                                            placeholder={tag.replace(/_/g, ' ')}
                                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium text-slate-700 placeholder:text-slate-300"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
                            <button
                                onClick={cancelEditingLabels}
                                disabled={isSavingLabels}
                                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveTagLabels}
                                disabled={isSavingLabels}
                                className="flex-1 px-4 py-2.5 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 shadow-md shadow-violet-200 transition-all text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSavingLabels ? (
                                    <><RefreshCw className="w-4 h-4 animate-spin" /> Guardando...</>
                                ) : (
                                    <><Check className="w-4 h-4" /> Guardar Etiquetas</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
