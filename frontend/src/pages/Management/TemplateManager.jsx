import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
    FileText, Upload, Trash2, Edit2, RefreshCw, X, FolderOpen, Search,
    ExternalLink, Replace, Plus, FileWarning, Check, Copy, PenLine,
    Sparkles, Keyboard, ImageIcon, Info, AlertTriangle, Files
} from 'lucide-react';
import {
    SubirPlantilla, ListarPlantillas, EliminarPlantilla,
    ActualizarPlantilla, ReemplazarArchivoPlantilla,
    AbrirPlantillaEnEditor, RecargarTagsPlantilla, ActualizarTagLabels,
    ToggleIncluyeFirma, SubirFirma, TieneFirma, ObtenerFirmaBase64,
    AbrirCarpetaCertificados
} from '../../../wailsjs/go/services/TemplateService';
import { ClipboardSetText } from '../../../wailsjs/runtime/runtime';
import {
    ETIQUETAS_AUTOMATICAS, esEtiquetaAutomatica, nombreCampo,
    tagsDePlantilla, labelsDePlantilla
} from '../../constants/certificateTags';

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const copiar = async (texto) => {
    try {
        await ClipboardSetText(texto);
        toast.success(`${texto} copiado`, { duration: 1500 });
    } catch {
        toast.error('No se pudo copiar');
    }
};

// Guía de etiquetas automáticas, con copia al portapapeles para pegarlas en Word.
function GuiaEtiquetas({ compacta = false }) {
    const grupos = useMemo(() => {
        const g = {};
        ETIQUETAS_AUTOMATICAS.forEach(e => { (g[e.grupo] ||= []).push(e); });
        return g;
    }, []);

    return (
        <div className="space-y-4">
            {Object.entries(grupos).map(([grupo, items]) => (
                <div key={grupo}>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{grupo}</p>
                    <div className={`grid gap-1.5 ${compacta ? 'grid-cols-1' : 'grid-cols-1 @lg:grid-cols-2'}`}>
                        {items.map(e => (
                            <button
                                key={e.tag}
                                type="button"
                                onClick={() => copiar(`{{${e.tag}}}`)}
                                className="group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50 text-left transition-colors"
                                title="Copiar etiqueta"
                            >
                                <span className="min-w-0">
                                    <span className="block font-mono text-[11px] font-bold text-violet-700 truncate">{`{{${e.tag}}}`}</span>
                                    <span className="block text-[11px] text-slate-500 truncate">{e.label}</span>
                                </span>
                                <Copy className="w-3.5 h-3.5 text-slate-300 group-hover:text-violet-500 shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>
            ))}
            <p className="text-[11px] text-slate-400 leading-relaxed">
                Cualquier otra etiqueta, por ejemplo <code className="bg-slate-100 px-1 rounded">{'{{motivo}}'}</code>, aparecerá como campo para llenar a mano al generar el documento.
            </p>
        </div>
    );
}

export default function TemplateManager() {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState(null);

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadForm, setUploadForm] = useState({ nombre: '', descripcion: '' });
    const [isUploading, setIsUploading] = useState(false);

    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [infoForm, setInfoForm] = useState({ nombre: '', descripcion: '' });

    const [labels, setLabels] = useState({});
    const [isSavingLabels, setIsSavingLabels] = useState(false);

    const [hasFirmaGlobal, setHasFirmaGlobal] = useState(false);
    const [firmaPreview, setFirmaPreview] = useState(null);
    const [busy, setBusy] = useState(null); // acción en curso: 'reload' | 'replace' | ...

    const selected = templates.find(t => t.id === selectedId) || null;
    const tags = tagsDePlantilla(selected);
    const savedLabels = labelsDePlantilla(selected);
    const labelsDirty = tags.some(t => (labels[t] || '').trim() !== (savedLabels[t] || ''));
    const tieneTagFirma = tags.some(t => t.toLowerCase() === 'firma');

    const loadTemplates = useCallback(async ({ silencioso = false } = {}) => {
        if (!silencioso) setIsLoading(true);
        try {
            const data = await ListarPlantillas();
            setTemplates(data || []);
        } catch {
            if (!silencioso) toast.error('Error al cargar plantillas');
        } finally {
            if (!silencioso) setIsLoading(false);
        }
    }, []);

    const checkFirmaStatus = async () => {
        try {
            const exists = await TieneFirma();
            setHasFirmaGlobal(exists);
            setFirmaPreview(exists ? await ObtenerFirmaBase64() : null);
        } catch { setHasFirmaGlobal(false); }
    };

    useEffect(() => {
        loadTemplates();
        checkFirmaStatus();
        // Al volver de Word, la lista se refresca: el backend vuelve a leer los campos del archivo.
        const onFocus = () => loadTemplates({ silencioso: true });
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [loadTemplates]);

    // Seleccionar la primera plantilla al cargar; mantener los labels del formulario al día.
    useEffect(() => {
        if (!selectedId && templates.length > 0) setSelectedId(templates[0].id);
    }, [templates, selectedId]);

    useEffect(() => {
        setLabels(Object.fromEntries(tags.map(t => [t, savedLabels[t] || ''])));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, JSON.stringify(tags), JSON.stringify(savedLabels)]);

    useEffect(() => { setIsEditingInfo(false); }, [selectedId]);

    const reemplazarEnLista = (updated) => {
        if (!updated) return;
        setTemplates(prev => prev.map(t => t.id === updated.id ? { ...updated, ruta_archivo: updated.ruta_archivo } : t));
    };

    const filteredTemplates = templates.filter(t => {
        const q = searchQuery.toLowerCase();
        return t.nombre.toLowerCase().includes(q) || (t.descripcion || '').toLowerCase().includes(q);
    });

    // ---------- Acciones ----------
    const handleUpload = async () => {
        if (!uploadForm.nombre.trim()) return toast.error('Ingrese un nombre para la plantilla');
        setIsUploading(true);
        try {
            const result = await SubirPlantilla(uploadForm.nombre, uploadForm.descripcion);
            if (!result) return toast.info('Carga cancelada');
            toast.success('Plantilla agregada');
            setIsUploadModalOpen(false);
            setUploadForm({ nombre: '', descripcion: '' });
            await loadTemplates({ silencioso: true });
            setSelectedId(result.id);
        } catch (err) {
            toast.error(String(err));
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: '¿Eliminar plantilla?',
            html: `Se eliminará <b>"${selected.nombre}"</b> y su archivo Word. Los certificados ya generados no se borran.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;
        try {
            await EliminarPlantilla(selected.id);
            toast.success('Plantilla eliminada');
            setSelectedId(null);
            loadTemplates({ silencioso: true });
        } catch (err) {
            toast.error(String(err));
        }
    };

    const handleReplace = async () => {
        setBusy('replace');
        try {
            const result = await ReemplazarArchivoPlantilla(selected.id);
            if (!result) return toast.info('Cambio cancelado');
            toast.success('Archivo reemplazado. Los nombres de los campos que siguen existiendo se conservaron.');
            loadTemplates({ silencioso: true });
        } catch (err) {
            toast.error(String(err));
        } finally {
            setBusy(null);
        }
    };

    const handleOpenInEditor = async () => {
        try {
            await AbrirPlantillaEnEditor(selected.id);
            toast.info('Abriendo en Word. Guarde los cambios en Word; los campos se actualizan al volver.', { duration: 5000 });
        } catch (err) {
            toast.error(String(err));
        }
    };

    const handleReloadTags = async () => {
        setBusy('reload');
        try {
            const result = await RecargarTagsPlantilla(selected.id);
            reemplazarEnLista(result);
            toast.success('Campos actualizados desde el archivo');
        } catch (err) {
            toast.error(String(err));
        } finally {
            setBusy(null);
        }
    };

    const saveInfo = async () => {
        if (!infoForm.nombre.trim()) return toast.error('El nombre no puede estar vacío');
        try {
            const updated = await ActualizarPlantilla(selected.id, infoForm.nombre, infoForm.descripcion);
            reemplazarEnLista(updated);
            setIsEditingInfo(false);
            toast.success('Datos actualizados');
        } catch (err) {
            toast.error(String(err));
        }
    };

    const saveLabels = async () => {
        setIsSavingLabels(true);
        try {
            const clean = {};
            Object.entries(labels).forEach(([tag, label]) => { if (label.trim()) clean[tag] = label.trim(); });
            const updated = await ActualizarTagLabels(selected.id, clean);
            reemplazarEnLista(updated);
            toast.success('Nombres de los campos guardados');
        } catch (err) {
            toast.error(String(err));
        } finally {
            setIsSavingLabels(false);
        }
    };

    const handleToggleFirma = async (incluye) => {
        try {
            const updated = await ToggleIncluyeFirma(selected.id, incluye);
            reemplazarEnLista(updated);
        } catch {
            toast.error('Error al actualizar la firma');
        }
    };

    const handleUploadFirma = async () => {
        try {
            const path = await SubirFirma();
            if (path) {
                await checkFirmaStatus();
                toast.success('Imagen de firma actualizada');
            }
        } catch {
            toast.error('Error al subir la imagen de firma');
        }
    };

    const abrirCarpeta = async () => {
        try { await AbrirCarpetaCertificados(); } catch (err) { toast.error(String(err)); }
    };

    // ---------- UI ----------
    return (
        <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans animate-in fade-in duration-300">
            <div className="flex flex-col gap-6">

                {/* Encabezado */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-violet-50 rounded-xl border border-violet-100 shadow-sm">
                            <Files className="w-6 h-6 text-violet-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Plantillas de documentos</h1>
                            <p className="text-slate-500 text-sm font-medium">Documentos Word que se usan para generar certificados desde Gestión de Estudiantes</p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={abrirCarpeta}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                        >
                            <FolderOpen className="w-4 h-4" /> Certificados generados
                        </button>
                        <button
                            onClick={() => { setUploadForm({ nombre: '', descripcion: '' }); setIsUploadModalOpen(true); }}
                            className="flex-1 sm:flex-none bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus className="w-5 h-5" /> Nueva plantilla
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
                        <RefreshCw className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">Cargando plantillas...</p>
                    </div>
                ) : templates.length === 0 ? (
                    /* Estado vacío: cómo empezar */
                    <div className="@container bg-white rounded-xl border border-slate-200 shadow-sm p-8 grid grid-cols-1 @3xl:grid-cols-2 gap-8">
                        <div className="flex flex-col justify-center">
                            <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mb-4 border border-violet-100">
                                <FileText className="w-7 h-7 text-violet-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Aún no hay plantillas</h3>
                            <ol className="mt-3 space-y-2 text-sm text-slate-600 list-decimal list-inside">
                                <li>Cree el documento en Word (por ejemplo, un certificado de matrícula).</li>
                                <li>Escriba las etiquetas entre llaves dobles donde van los datos, como <code className="bg-slate-100 px-1 rounded text-violet-700">{'{{cedula_estudiante}}'}</code>.</li>
                                <li>Súbalo aquí. Al generar el certificado, los datos se completan solos.</li>
                            </ol>
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="mt-6 self-start inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium"
                            >
                                <Upload className="w-4 h-4" /> Subir primera plantilla
                            </button>
                        </div>
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                            <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-500" /> Etiquetas que se completan solas</p>
                            <GuiaEtiquetas />
                        </div>
                    </div>
                ) : (
                    <div className="@container">
                        <div className="grid grid-cols-1 @4xl:grid-cols-[20rem_minmax(0,1fr)] gap-6 items-start">

                            {/* Lista de plantillas */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-3 border-b border-slate-100">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar plantilla..."
                                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <ul className="divide-y divide-slate-100 max-h-[65vh] overflow-y-auto">
                                    {filteredTemplates.length === 0 && (
                                        <li className="p-6 text-center text-sm text-slate-400">Sin resultados</li>
                                    )}
                                    {filteredTemplates.map(tpl => {
                                        const activo = tpl.id === selectedId;
                                        const n = tagsDePlantilla(tpl).filter(t => t.toLowerCase() !== 'firma').length;
                                        return (
                                            <li key={tpl.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedId(tpl.id)}
                                                    className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors border-l-4 ${activo ? 'bg-violet-50/70 border-violet-500' : 'border-transparent hover:bg-slate-50'}`}
                                                >
                                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tpl.ruta_archivo ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'}`}>
                                                        {tpl.ruta_archivo ? <FileText className="w-5 h-5" /> : <FileWarning className="w-5 h-5" />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`text-sm font-semibold truncate ${activo ? 'text-violet-800' : 'text-slate-800'}`}>{tpl.nombre}</p>
                                                        {tpl.descripcion && <p className="text-xs text-slate-500 truncate">{tpl.descripcion}</p>}
                                                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                            {!tpl.ruta_archivo ? (
                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">Archivo no encontrado</span>
                                                            ) : (
                                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{n} {n === 1 ? 'campo' : 'campos'}</span>
                                                            )}
                                                            {tpl.incluye_firma && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">Con firma</span>}
                                                        </div>
                                                    </div>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>

                            {/* Detalle */}
                            {!selected ? (
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
                                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    Seleccione una plantilla
                                </div>
                            ) : (
                                <div className="@container bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    {/* Cabecera del detalle */}
                                    <div className="p-6 border-b border-slate-100">
                                        {isEditingInfo ? (
                                            <div className="space-y-2">
                                                <input
                                                    value={infoForm.nombre}
                                                    onChange={(e) => setInfoForm({ ...infoForm, nombre: e.target.value })}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') saveInfo(); if (e.key === 'Escape') setIsEditingInfo(false); }}
                                                    className="w-full text-lg font-bold text-slate-800 border border-violet-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
                                                    placeholder="Nombre de la plantilla"
                                                    autoFocus
                                                />
                                                <input
                                                    value={infoForm.descripcion}
                                                    onChange={(e) => setInfoForm({ ...infoForm, descripcion: e.target.value })}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') saveInfo(); if (e.key === 'Escape') setIsEditingInfo(false); }}
                                                    className="w-full text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
                                                    placeholder="Descripción (opcional)"
                                                />
                                                <div className="flex gap-2">
                                                    <button onClick={saveInfo} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-violet-600 text-white rounded-lg hover:bg-violet-700"><Check className="w-3.5 h-3.5" /> Guardar</button>
                                                    <button onClick={() => setIsEditingInfo(false)} className="px-3 py-1.5 text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-100">Cancelar</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                        <span className="truncate">{selected.nombre}</span>
                                                        <button
                                                            onClick={() => { setInfoForm({ nombre: selected.nombre, descripcion: selected.descripcion || '' }); setIsEditingInfo(true); }}
                                                            className="p-1 rounded-md text-slate-400 hover:text-violet-600 hover:bg-violet-50 shrink-0"
                                                            title="Editar nombre y descripción"
                                                            aria-label="Editar nombre y descripción"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    </h2>
                                                    <p className="text-sm text-slate-500">{selected.descripcion || <span className="italic text-slate-400">Sin descripción</span>}</p>
                                                    <p className="text-xs text-slate-400 mt-1">Modificada: {formatDate(selected.fecha_modificacion)}</p>
                                                </div>
                                                <button
                                                    onClick={handleDelete}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                                                    title="Eliminar plantilla"
                                                    aria-label="Eliminar plantilla"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Archivo */}
                                        {selected.ruta_archivo ? (
                                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                                <button onClick={handleOpenInEditor} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
                                                    <ExternalLink className="w-4 h-4" /> Editar en Word
                                                </button>
                                                <button onClick={handleReplace} disabled={busy === 'replace'} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 disabled:opacity-50">
                                                    <Replace className="w-4 h-4" /> Reemplazar archivo
                                                </button>
                                                <button onClick={handleReloadTags} disabled={busy === 'reload'} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 disabled:opacity-50">
                                                    <RefreshCw className={`w-4 h-4 ${busy === 'reload' ? 'animate-spin' : ''}`} /> Actualizar campos
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
                                                <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> No se encontró el archivo Word de esta plantilla. Suba de nuevo el documento.</span>
                                                <button onClick={handleReplace} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-red-200 rounded-lg font-semibold hover:bg-red-100">
                                                    <Upload className="w-4 h-4" /> Subir archivo
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Campos */}
                                    <div className="p-6 border-b border-slate-100">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="text-sm font-bold text-slate-700">Campos del documento</h3>
                                            <span className="text-xs text-slate-400">{tags.length} detectados</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-4">
                                            El nombre del campo es el texto que verá quien genera el certificado. Los automáticos se completan con los datos del estudiante y se pueden corregir.
                                        </p>

                                        {tags.length === 0 ? (
                                            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                                                No se encontraron etiquetas <code className="bg-slate-200 px-1 rounded">{'{{etiqueta}}'}</code> en el documento.
                                            </div>
                                        ) : (
                                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="hidden @2xl:grid grid-cols-[minmax(0,14rem)_minmax(0,1fr)_7rem] gap-3 px-4 py-2 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                    <span>Etiqueta en Word</span><span>Nombre del campo</span><span>Tipo</span>
                                                </div>
                                                <ul className="divide-y divide-slate-100">
                                                    {tags.map(tag => {
                                                        const esFirma = tag.toLowerCase() === 'firma';
                                                        const auto = esEtiquetaAutomatica(tag);
                                                        return (
                                                            <li key={tag} className="grid grid-cols-1 @2xl:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_7rem] gap-2 @2xl:gap-3 px-4 py-2.5 items-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copiar(`{{${tag}}}`)}
                                                                    className="justify-self-start font-mono text-xs font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-1 rounded-md hover:bg-violet-100 truncate max-w-full"
                                                                    title="Copiar etiqueta"
                                                                >
                                                                    {`{{${tag}}}`}
                                                                </button>
                                                                {esFirma ? (
                                                                    <span className="text-sm text-slate-500">Se reemplaza por la imagen de la firma</span>
                                                                ) : (
                                                                    <input
                                                                        value={labels[tag] || ''}
                                                                        onChange={(e) => setLabels(prev => ({ ...prev, [tag]: e.target.value }))}
                                                                        placeholder={nombreCampo(tag)}
                                                                        aria-label={`Nombre del campo ${tag}`}
                                                                        className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 placeholder:text-slate-400"
                                                                    />
                                                                )}
                                                                <span className={`justify-self-start inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${esFirma ? 'bg-emerald-50 text-emerald-700' : auto ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'}`}>
                                                                    {esFirma ? <><ImageIcon className="w-3 h-3" /> Imagen</> : auto ? <><Sparkles className="w-3 h-3" /> Automático</> : <><Keyboard className="w-3 h-3" /> Manual</>}
                                                                </span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                                {labelsDirty && (
                                                    <div className="flex items-center justify-end gap-2 px-4 py-2.5 bg-violet-50/60 border-t border-violet-100">
                                                        <span className="text-xs text-violet-700 mr-auto">Hay cambios sin guardar</span>
                                                        <button onClick={() => setLabels(Object.fromEntries(tags.map(t => [t, savedLabels[t] || ''])))} className="px-3 py-1.5 text-xs font-bold text-slate-600 rounded-lg hover:bg-white">Descartar</button>
                                                        <button onClick={saveLabels} disabled={isSavingLabels} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50">
                                                            {isSavingLabels ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Guardar nombres
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Firma */}
                                    <div className="p-6 border-b border-slate-100">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><PenLine className="w-4 h-4 text-slate-400" /> Firma</h3>
                                                <p className="text-xs text-slate-500 mt-0.5">Inserta la imagen de la firma donde el documento tenga <code className="bg-slate-100 px-1 rounded">{'{{firma}}'}</code>.</p>
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
                                                <span className="text-xs font-semibold text-slate-600">{selected.incluye_firma ? 'Activada' : 'Desactivada'}</span>
                                                <span className="relative">
                                                    <input type="checkbox" checked={!!selected.incluye_firma} onChange={(e) => handleToggleFirma(e.target.checked)} className="sr-only peer" />
                                                    <span className="block w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-emerald-500 transition-colors" />
                                                    <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                                                </span>
                                            </label>
                                        </div>

                                        {selected.incluye_firma && (
                                            <div className="mt-4 flex flex-wrap items-center gap-4">
                                                {hasFirmaGlobal && firmaPreview ? (
                                                    <img src={firmaPreview} alt="Firma configurada" className="h-14 max-w-48 object-contain bg-white rounded-lg border border-slate-200 p-1.5" />
                                                ) : (
                                                    <span className="text-xs font-medium text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> No hay imagen de firma cargada</span>
                                                )}
                                                <button onClick={handleUploadFirma} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50">
                                                    <Upload className="w-3.5 h-3.5" /> {hasFirmaGlobal ? 'Cambiar imagen' : 'Subir imagen'}
                                                </button>
                                                <span className="text-[11px] text-slate-400">La imagen es la misma para todas las plantillas.</span>
                                            </div>
                                        )}
                                        {selected.incluye_firma && !tieneTagFirma && (
                                            <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-start gap-2">
                                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                El documento no tiene la etiqueta {'{{firma}}'}: escríbala en Word, en una línea propia, donde debe ir la firma.
                                            </p>
                                        )}
                                    </div>

                                    {/* Guía */}
                                    <details className="group p-6">
                                        <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-bold text-slate-700">
                                            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-500" /> Etiquetas disponibles para usar en Word</span>
                                            <span className="text-xs font-semibold text-violet-600 group-open:hidden">Mostrar</span>
                                            <span className="text-xs font-semibold text-violet-600 hidden group-open:inline">Ocultar</span>
                                        </summary>
                                        <div className="mt-4"><GuiaEtiquetas /></div>
                                    </details>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: nueva plantilla */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="@container bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Upload className="w-5 h-5 text-violet-600" /> Nueva plantilla</h3>
                            <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400" aria-label="Cerrar"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto grid grid-cols-1 @3xl:grid-cols-2">
                            <div className="p-6 space-y-5">
                                <div>
                                    <label htmlFor="tpl-nombre" className="block text-sm font-bold text-slate-700 mb-1.5">Nombre <span className="text-red-500">*</span></label>
                                    <input
                                        id="tpl-nombre"
                                        type="text"
                                        placeholder="Ej: Certificado de matrícula"
                                        value={uploadForm.nombre}
                                        onChange={(e) => setUploadForm({ ...uploadForm, nombre: e.target.value })}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && uploadForm.nombre.trim()) handleUpload(); }}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label htmlFor="tpl-desc" className="block text-sm font-bold text-slate-700 mb-1.5">Descripción <span className="text-slate-400 font-normal text-xs">(opcional)</span></label>
                                    <textarea
                                        id="tpl-desc"
                                        rows="3"
                                        placeholder="Para qué se usa este documento"
                                        value={uploadForm.descripcion}
                                        onChange={(e) => setUploadForm({ ...uploadForm, descripcion: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
                                    />
                                </div>
                                <div className="flex gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
                                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span>Al continuar se abrirá el explorador para elegir el archivo <b>.docx</b>. El sistema detecta las etiquetas <code className="bg-white px-1 rounded border border-slate-200">{'{{...}}'}</code> automáticamente.</span>
                                </div>
                            </div>
                            <div className="p-6 bg-slate-50/70 border-t @3xl:border-t-0 @3xl:border-l border-slate-100">
                                <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-500" /> Etiquetas que se completan solas</p>
                                <GuiaEtiquetas compacta />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setIsUploadModalOpen(false)} disabled={isUploading} className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 text-sm disabled:opacity-50">Cancelar</button>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading || !uploadForm.nombre.trim()}
                                className="px-5 py-2.5 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Subiendo...</> : <><Upload className="w-4 h-4" /> Elegir archivo Word</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
