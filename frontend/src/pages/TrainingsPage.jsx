import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Presentation, Users, FileText, Plus, Trash2,
    Save, Upload, CheckCircle2,
} from 'lucide-react';
import {
    GetTrainings, SaveTraining, DeleteTraining,
    UploadEvidence, GetEvidence
} from '../../wailsjs/go/management/TrainingService';

const TrainingsPage = () => {
    const [trainings, setTrainings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [evidencePreview, setEvidencePreview] = useState(null);

    const emptyTraining = {
        id: 0,
        anio_lectivo_id: 1,
        tema: '',
        fecha: new Date().toISOString().split('T')[0],
        publico_objetivo: '',
        asistentes_count: 0,
        archivo_evidencia_path: ''
    };

    const TARGET_AUDIENCE = [
        { value: 'DOCENTES', label: 'Docentes' },
        { value: 'PADRES', label: 'Padres de Familia' },
        { value: 'ESTUDIANTES', label: 'Estudiantes' },
        { value: 'COMUNIDAD', label: 'Comunidad Educativa' },
        { value: 'OTROS', label: 'Otros' }
    ];

    useEffect(() => {
        loadTrainings();
    }, []);

    const loadTrainings = async () => {
        setLoading(true);
        try {
            const data = await GetTrainings();
            setTrainings(data || []);
        } catch (err) {
            toast.error("Error cargando capacitaciones: " + err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setSelectedTraining({ ...emptyTraining });
        setIsEditing(true);
        setEvidencePreview(null);
    };

    const handleEdit = async (training) => {
        setSelectedTraining({
            ...training,
            fecha: training.fecha.split('T')[0]
        });
        setIsEditing(true);
        setEvidencePreview(null);

        if (training.archivo_evidencia_path) {
            try {
                const preview = await GetEvidence(training.id);
                setEvidencePreview(preview);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleSave = async () => {
        if (!selectedTraining.tema) {
            toast.warning("El tema es obligatorio");
            return;
        }
        if (!selectedTraining.fecha) {
            toast.warning("La fecha es obligatoria");
            return;
        }

        try {
            const trainingToSave = {
                ...selectedTraining,
                fecha: new Date(selectedTraining.fecha).toISOString(),
                asistentes_count: parseInt(selectedTraining.asistentes_count)
            };

            await SaveTraining(trainingToSave);
            toast.success("Capacitación guardada correctamente");
            setIsEditing(false);
            setSelectedTraining(null);
            loadTrainings();
        } catch (err) {
            toast.error("Error al guardar: " + err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Estás seguro de eliminar este registro?")) return;
        try {
            await DeleteTraining(id);
            toast.success("Registro eliminado");
            if (selectedTraining?.id === id) {
                setIsEditing(false);
                setSelectedTraining(null);
            }
            loadTrainings();
        } catch (err) {
            toast.error("Error al eliminar: " + err);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (selectedTraining.id === 0) {
            toast.warning("Primero guarda el registro antes de subir evidencia");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const base64 = e.target.result;
                await UploadEvidence(selectedTraining.id, base64);
                toast.success("Evidencia subida correctamente");
                setEvidencePreview(base64);
                setSelectedTraining(prev => ({ ...prev, archivo_evidencia_path: 'updated' }));
            } catch (err) {
                toast.error("Error al subir archivo: " + err);
            }
        };
        reader.readAsDataURL(file);
    };

    const updateField = (field, value) => {
        setSelectedTraining(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-full w-full bg-slate-50/50 font-sans">
            <div className="mx-auto w-full flex flex-col gap-6">

                <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                            <Presentation className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Capacitaciones y Talleres</h1>
                            <p className="text-sm text-slate-500 font-medium">Registro de actividades formativas</p>
                        </div>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Capacitación
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Historial de Actividades
                        </h3>

                        <div className="space-y-3">
                            {loading ? (
                                <div className="text-center py-8 text-slate-400">Cargando...</div>
                            ) : trainings.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                                    <Presentation className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">No hay capacitaciones registradas</p>
                                </div>
                            ) : (
                                trainings.map(t => (
                                    <div
                                        key={t.id}
                                        onClick={() => handleEdit(t)}
                                        className={`bg-white p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedTraining?.id === t.id ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-200 hover:border-blue-300'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs text-slate-500 font-bold uppercase">
                                                {new Date(t.fecha).toLocaleDateString()}
                                            </span>
                                            {t.archivo_evidencia_path && (
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            )}
                                        </div>

                                        <h4 className="font-bold text-slate-800 text-sm mb-1">{t.tema}</h4>

                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Users className="w-3 h-3" />
                                            {t.publico_objetivo} ({t.asistentes_count} asistentes)
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        {isEditing ? (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        {selectedTraining.id === 0 ? <Plus className="w-4 h-4 text-blue-500" /> : <Presentation className="w-4 h-4 text-blue-500" />}
                                        {selectedTraining.id === 0 ? 'Nueva Capacitación' : 'Detalles de la Actividad'}
                                    </h3>
                                    {selectedTraining.id !== 0 && (
                                        <button
                                            onClick={() => handleDelete(selectedTraining.id)}
                                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                            title="Eliminar registro"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="p-6 space-y-6">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tema / Título</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="Ej: Prevención de Drogas, Escuela para Padres..."
                                            value={selectedTraining.tema}
                                            onChange={(e) => updateField('tema', e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</label>
                                            <input
                                                type="date"
                                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                value={selectedTraining.fecha}
                                                onChange={(e) => updateField('fecha', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Público Objetivo</label>
                                            <select
                                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                value={selectedTraining.publico_objetivo}
                                                onChange={(e) => updateField('publico_objetivo', e.target.value)}
                                            >
                                                <option value="">Seleccione...</option>
                                                {TARGET_AUDIENCE.map(t => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cantidad de Asistentes</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            value={selectedTraining.asistentes_count}
                                            onChange={(e) => updateField('asistentes_count', e.target.value)}
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Evidencia (Lista de Asistencia / Fotos)</label>

                                        <div className="flex items-center gap-4">
                                            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors">
                                                <Upload className="w-4 h-4" />
                                                Subir Archivo (PDF/IMG)
                                                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                                            </label>

                                            {selectedTraining.archivo_evidencia_path && (
                                                <span className="text-xs text-green-600 flex items-center gap-1 font-medium">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Evidencia cargada
                                                </span>
                                            )}
                                        </div>

                                        {evidencePreview && (
                                            <div className="mt-4 p-2 bg-slate-100 rounded-lg border border-slate-200">
                                                {evidencePreview.startsWith('data:application/pdf') ? (
                                                    <iframe src={evidencePreview} className="w-full h-75 rounded" title="Vista previa" />
                                                ) : (
                                                    <img src={evidencePreview} alt="Vista previa" className="max-w-full h-auto rounded max-h-75 mx-auto" />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-100 mt-4">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            Guardar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <Presentation className="w-16 h-16 mb-4 text-slate-300" />
                                <p className="font-medium">Selecciona una capacitación para ver detalles</p>
                                <p className="text-sm">o registra una nueva actividad</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainingsPage;