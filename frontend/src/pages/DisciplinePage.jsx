import React, { useState } from 'react';
import { toast } from 'sonner';
import {
    Gavel, Search, Save, Upload, FileText, AlertTriangle, Loader2, Plus,
    Trash2, User, X, CheckCircle2, AlertCircle, ArrowRight, Calendar, FileCheck,
    Info, LayoutList
} from 'lucide-react';
import { GetStudents } from '../../wailsjs/go/student/StudentService';
import {
    GetDisciplineCases, SaveDisciplineCase, DeleteDisciplineCase,
    UploadSignedAct, GetSignedAct
} from '../../wailsjs/go/welfare/DisciplineService';

const DisciplinePage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loadingSearch, setLoadingSearch] = useState(false);

    const [loadingData, setLoadingData] = useState(false);
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [actPreview, setActPreview] = useState(null);

    const emptyCase = {
        id: 0,
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'DISCIPLINA',
        descripcion_motivo: '',
        gravedad: 'LEVE',
        acciones_realizadas: '',
        resolucion: '',
        derivado_a: '',
        estado: 'ABIERTO',
        notifico_representante: false,
        firmo_acta: false,
        motivo_no_firma: '',
        cumplio_medida: false,
        archivo_acta_path: ''
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        setLoadingSearch(true);
        try {
            const response = await GetStudents(0, 0, 0, searchTerm, 1, 5);
            setSearchResults(response.data || []);
            if ((response.data || []).length === 0) toast.error("No se encontró ningún estudiante.");
        } catch (err) {
            console.error(err);
            toast.error("Error buscando estudiantes");
        } finally {
            setLoadingSearch(false);
        }
    };

    const selectStudent = async (student) => {
        if (student.estado === 'RETIRADO') {
            toast.error("Estudiante Retirado");
            return;
        }
        setSelectedStudent(student);
        setSearchResults([]);
        setSearchTerm('');
        loadCases(student.id);
    };

    const clearSelection = () => {
        setSelectedStudent(null);
        setCases([]);
        setSelectedCase(null);
        setIsEditing(false);
        setSearchTerm('');
    };

    const loadCases = async (studentId) => {
        setLoadingData(true);
        try {
            const data = await GetDisciplineCases(studentId);
            setCases(data || []);
            setIsEditing(false);
            setSelectedCase(null);
        } catch (err) {
            toast.error("Error cargando casos: " + err);
        } finally {
            setLoadingData(false);
        }
    };

    const handleCreateNew = () => {
        setSelectedCase({ ...emptyCase, estudiante_id: selectedStudent.id });
        setIsEditing(true);
        setActPreview(null);
    };

    const handleEdit = async (c) => {
        setSelectedCase({ ...c, fecha: c.fecha.split('T')[0] });
        setIsEditing(true);
        setActPreview(null);
        if (c.archivo_acta_path) {
            try {
                const preview = await GetSignedAct(c.id);
                setActPreview(preview);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleSave = async () => {
        if (!selectedCase.descripcion_motivo) {
            toast.warning("El motivo es obligatorio");
            return;
        }
        try {
            const caseToSave = {
                ...selectedCase,
                fecha: new Date(selectedCase.fecha).toISOString()
            };

            await SaveDisciplineCase(caseToSave);
            toast.success("Caso guardado correctamente");
            loadCases(selectedStudent.id);
        } catch (err) {
            toast.error("Error al guardar: " + err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Estás seguro de eliminar este caso?")) return;
        try {
            await DeleteDisciplineCase(id);
            toast.success("Caso eliminado");
            loadCases(selectedStudent.id);
        } catch (err) {
            toast.error("Error al eliminar: " + err);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (selectedCase.id === 0) {
            toast.warning("Primero guarda el caso antes de subir el acta");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const base64 = e.target.result;
                await UploadSignedAct(selectedCase.id, base64);
                toast.success("Acta subida correctamente");
                setActPreview(base64);
                setSelectedCase(prev => ({ ...prev, archivo_acta_path: 'updated' }));
            } catch (err) {
                toast.error("Error al subir archivo: " + err);
            }
        };
        reader.readAsDataURL(file);
    };

    const updateField = (field, value) => {
        setSelectedCase(prev => ({ ...prev, [field]: value }));
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'LEVE': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'GRAVE': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'MUY_GRAVE': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="min-h-full w-full bg-slate-50/50 font-sans">

            <div className="mx-auto w-full flex flex-col gap-6">

                <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 shadow-sm">
                            <Gavel className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Expediente Disciplinario</h1>
                            <p className="text-sm text-slate-500 font-medium">Registro de faltas y seguimiento</p>
                        </div>
                    </div>
                </div>

                {!selectedStudent ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-sm border border-slate-200 min-h-[60vh]">
                        <div className="w-full max-w-xl space-y-6 px-6">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <Search className="w-8 h-8 text-slate-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800">Buscar Estudiante</h2>
                                <p className="text-slate-500">Ingrese cédula o apellidos para gestionar disciplina</p>
                            </div>

                            <form onSubmit={handleSearch} className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Cédula, Nombres o Apellidos..."
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                                <button type="submit" className="absolute right-2 top-2 bottom-2 px-4 bg-white border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-200 rounded-lg text-sm font-bold transition-all">
                                    Buscar
                                </button>
                            </form>

                            {loadingSearch && <div className="text-center py-4"><Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" /></div>}

                            {searchResults.length > 0 && (
                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4">
                                    {searchResults.map(student => (
                                        <div
                                            key={student.id}
                                            onClick={() => selectStudent(student)}
                                            className={`p-4 cursor-pointer border-b border-slate-100 last:border-0 flex items-center justify-between group transition-colors ${student.estado === 'RETIRADO' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                                    {student.nombres.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors flex items-center gap-2">
                                                        {student.apellidos} {student.nombres}
                                                        {student.estado === 'RETIRADO' && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded border border-red-200 font-bold uppercase tracking-wider">Retirado</span>}
                                                    </p>
                                                    <p className="text-xs text-slate-500 flex items-center gap-2">
                                                        <span className="font-mono bg-slate-100 px-1.5 rounded">{student.cedula}</span>
                                                        <span>•</span>
                                                        <span>{student.curso} "{student.paralelo}"</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-orange-500 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">{selectedStudent.apellidos} {selectedStudent.nombres}</h2>
                                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                                        <span className="font-mono bg-slate-100 px-2 rounded border border-slate-200">{selectedStudent.cedula}</span>
                                        <span>•</span>
                                        <span>{selectedStudent.curso} "{selectedStudent.paralelo}"</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={clearSelection}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Cambiar estudiante"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            <div className="lg:col-span-1 space-y-4">
                                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                                        <LayoutList className="w-4 h-4 text-slate-400" />
                                        Historial
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs border border-slate-200">{cases.length}</span>
                                    </h3>
                                    <button
                                        onClick={handleCreateNew}
                                        className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-1 font-bold shadow-sm"
                                    >
                                        <Plus className="w-3 h-3" /> Nuevo
                                    </button>
                                </div>

                                <div className="space-y-3 h-150 overflow-y-auto custom-scrollbar pr-1">
                                    {cases.length === 0 ? (
                                        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed text-slate-400 text-sm flex flex-col items-center justify-center h-full">
                                            <AlertTriangle className="w-8 h-8 mb-2 opacity-20" />
                                            No hay casos registrados
                                        </div>
                                    ) : (
                                        cases.map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => handleEdit(c)}
                                                className={`bg-white p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md group relative ${selectedCase?.id === c.id ? 'border-orange-500 ring-1 ring-orange-500/20 shadow-md' : 'border-slate-200 hover:border-orange-300'}`}
                                            >
                                                {selectedCase?.id === c.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-l-xl"></div>}

                                                <div className="flex justify-between items-start mb-2 pl-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getSeverityColor(c.gravedad)}`}>
                                                        {c.gravedad.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(c.fecha).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-800 line-clamp-2 mb-2 pl-2">{c.descripcion_motivo}</p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 pl-2">
                                                    {c.estado === 'CERRADO' ? (
                                                        <span className="flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100"><CheckCircle2 className="w-3 h-3" /> Cerrado</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100"><AlertCircle className="w-3 h-3" /> Abierto</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="lg:col-span-2">
                                {isEditing && selectedCase ? (
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-right-4">
                                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-orange-500" />
                                                {selectedCase.id === 0 ? 'Registrar Nueva Falta' : 'Editar Expediente'}
                                            </h3>
                                            {selectedCase.id !== 0 && (
                                                <button
                                                    onClick={() => handleDelete(selectedCase.id)}
                                                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                    title="Eliminar caso"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="p-6 overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-5">
                                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                            <Info className="w-3 h-3" /> Detalles del Hecho
                                                        </h4>

                                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-500 mb-1.5">Fecha</label>
                                                                <input
                                                                    type="date"
                                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                                                    value={selectedCase.fecha}
                                                                    onChange={(e) => updateField('fecha', e.target.value)}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-500 mb-1.5">Gravedad</label>
                                                                <select
                                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                                                    value={selectedCase.gravedad}
                                                                    onChange={(e) => updateField('gravedad', e.target.value)}
                                                                >
                                                                    <option value="LEVE">Leve</option>
                                                                    <option value="GRAVE">Grave</option>
                                                                    <option value="MUY_GRAVE">Muy Grave</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-500 mb-1.5">Motivo / Descripción</label>
                                                                <textarea
                                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-300"
                                                                    placeholder="Describa detalladamente lo sucedido..."
                                                                    value={selectedCase.descripcion_motivo}
                                                                    onChange={(e) => updateField('descripcion_motivo', e.target.value)}
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-500 mb-1.5">Resolución / Medida Tomada</label>
                                                                <textarea
                                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-300"
                                                                    placeholder="Suspensión, trabajo comunitario..."
                                                                    value={selectedCase.resolucion}
                                                                    onChange={(e) => updateField('resolucion', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-5">
                                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 h-full">
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                            <User className="w-3 h-3" /> Gestión con Representante
                                                        </h4>

                                                        <div className="space-y-4">
                                                            <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-orange-300 transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                                                    checked={selectedCase.notifico_representante}
                                                                    onChange={(e) => updateField('notifico_representante', e.target.checked)}
                                                                />
                                                                <span className="text-sm font-medium text-slate-700">¿Se notificó al representante?</span>
                                                            </label>

                                                            <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-orange-300 transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                                                    checked={selectedCase.firmo_acta}
                                                                    onChange={(e) => updateField('firmo_acta', e.target.checked)}
                                                                />
                                                                <span className="text-sm font-medium text-slate-700">¿Firmó acta de compromiso?</span>
                                                            </label>

                                                            {!selectedCase.firmo_acta && (
                                                                <div className="animate-in fade-in slide-in-from-top-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                                                                    <label className="block text-xs font-bold text-red-600 mb-1.5 uppercase">Motivo de no firma</label>
                                                                    <input
                                                                        type="text"
                                                                        className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 placeholder:text-red-300"
                                                                        placeholder="Ej: Se negó, no asistió..."
                                                                        value={selectedCase.motivo_no_firma}
                                                                        onChange={(e) => updateField('motivo_no_firma', e.target.value)}
                                                                    />
                                                                </div>
                                                            )}

                                                            <div className="pt-4 border-t border-slate-200 mt-4">
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Documentación</h4>
                                                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-orange-400 hover:bg-orange-50/10 transition-all group bg-white">
                                                                    <input
                                                                        type="file"
                                                                        className="hidden"
                                                                        id="acta-upload"
                                                                        onChange={handleFileUpload}
                                                                        accept=".pdf,image/*"
                                                                        disabled={selectedCase.id === 0}
                                                                    />
                                                                    <label htmlFor="acta-upload" className={`cursor-pointer flex flex-col items-center ${selectedCase.id === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                                            <Upload className="w-5 h-5" />
                                                                        </div>
                                                                        <p className="text-xs font-bold text-slate-700">Subir Acta Firmada</p>
                                                                        {selectedCase.id === 0 && <p className="text-[10px] text-red-400 mt-1">Guarde el caso primero</p>}
                                                                    </label>
                                                                </div>

                                                                {(selectedCase.archivo_acta_path || actPreview) && (
                                                                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-3">
                                                                        <FileCheck className="w-5 h-5 text-emerald-600" />
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs font-bold text-emerald-800">Acta cargada</p>
                                                                            <button
                                                                                onClick={() => window.open(actPreview)}
                                                                                className="text-[10px] text-emerald-600 hover:underline font-medium"
                                                                            >
                                                                                Ver documento
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-slate-100">
                                                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                            checked={selectedCase.cumplio_medida}
                                                            onChange={(e) => updateField('cumplio_medida', e.target.checked)}
                                                        />
                                                        ¿Cumplió la medida disciplinaria?
                                                    </label>

                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs font-bold text-slate-500 uppercase">Estado:</label>
                                                        <select
                                                            className={`px-3 py-1.5 border rounded-lg text-xs font-bold focus:outline-none cursor-pointer ${selectedCase.estado === 'ABIERTO'
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                }`}
                                                            value={selectedCase.estado}
                                                            onChange={(e) => updateField('estado', e.target.value)}
                                                        >
                                                            <option value="ABIERTO">ABIERTO</option>
                                                            <option value="CERRADO">CERRADO</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 z-10">
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-bold transition-colors shadow-sm"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                className="px-6 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all text-sm font-bold shadow-md hover:shadow-orange-200 active:scale-95 flex items-center gap-2"
                                            >
                                                <Save className="w-4 h-4" />
                                                Guardar Expediente
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 bg-white rounded-xl border border-slate-200 shadow-sm border-dashed">
                                        <div className="p-4 bg-slate-50 rounded-full mb-4">
                                            <Gavel className="w-12 h-12 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-600 mb-1">Ningún caso seleccionado</h3>
                                        <p className="text-sm text-center max-w-xs leading-relaxed">
                                            Seleccione un caso del historial de la izquierda para ver los detalles o cree uno nuevo.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DisciplinePage;