import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
    School, Plus, Trash2, BookOpen, User, Settings, X,
    Save, GraduationCap, Loader2, Calendar
} from 'lucide-react';

import { GetAniosLectivos } from '../../wailsjs/go/academic/YearService';
import { GetCursos } from '../../wailsjs/go/academic/CourseService';
import { GetParalelos } from '../../wailsjs/go/academic/ParallelService';
import { GetDocentes } from '../../wailsjs/go/academic/TeacherService';
import { GetMaterias } from '../../wailsjs/go/academic/SubjectService';
import {
    GetAulasByAnio, CreateAula, DeleteAula,
    GetCargaHoraria, AssignMateria, RemoveMateria
} from '../../wailsjs/go/academic/ClassroomService';

const ClassroomsPage = () => {
    const [anios, setAnios] = useState([]);
    const [selectedAnio, setSelectedAnio] = useState(null);
    const [aulas, setAulas] = useState([]);
    const [loading, setLoading] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [cursos, setCursos] = useState([]);
    const [paralelos, setParalelos] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [newAula, setNewAula] = useState({
        curso_id: '',
        paralelo_id: '',
        tutor_id: ''
    });

    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [selectedAula, setSelectedAula] = useState(null);
    const [cargaHoraria, setCargaHoraria] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [newMateria, setNewMateria] = useState({
        materia_id: '',
        docente_id: ''
    });

    useEffect(() => {
        loadAnios();
        loadCatalogos();
    }, []);

    useEffect(() => {
        if (selectedAnio) {
            loadAulas();
        }
    }, [selectedAnio]);

    const loadAnios = async () => {
        try {
            const data = await GetAniosLectivos();
            setAnios(data);
            const activo = data.find(a => a.Activo);
            if (activo) setSelectedAnio(activo.ID);
            else if (data.length > 0) setSelectedAnio(data[0].ID);
        } catch (error) {
            toast.error("Error al cargar años lectivos");
        }
    };

    const loadCatalogos = async () => {
        try {
            const [c, p, d, m] = await Promise.all([
                GetCursos(),
                GetParalelos(),
                GetDocentes(""),
                GetMaterias()
            ]);
            setCursos(c);
            setParalelos(p);
            setDocentes(d);
            setMaterias(m.filter(mat => mat.Activo));
        } catch (error) {
            console.error("Error cargando catálogos", error);
        }
    };

    const loadAulas = async () => {
        if (!selectedAnio) return;
        setLoading(true);
        try {
            const data = await GetAulasByAnio(selectedAnio);
            setAulas(data || []);
        } catch (error) {
            toast.error("Error al cargar aulas: " + error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAula = async (e) => {
        e.preventDefault();
        if (!newAula.curso_id || !newAula.paralelo_id) {
            toast.warning("Curso y Paralelo son obligatorios");
            return;
        }

        try {
            const cursoId = parseInt(newAula.curso_id);
            const paraleloId = parseInt(newAula.paralelo_id);
            const tutorId = newAula.tutor_id ? parseInt(newAula.tutor_id) : null;

            await CreateAula(selectedAnio, cursoId, paraleloId, tutorId);
            toast.success("Aula creada exitosamente");
            setIsCreateModalOpen(false);
            setNewAula({ curso_id: '', paralelo_id: '', tutor_id: '' });
            loadAulas();
        } catch (error) {
            toast.error("Error al crear aula: " + error);
        }
    };

    const handleDeleteAula = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás eliminar el aula si tiene estudiantes o materias asignadas.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await DeleteAula(id);
                toast.success("Aula eliminada");
                loadAulas();
            } catch (error) {
                toast.error("No se pudo eliminar: " + error);
            }
        }
    };

    const openConfigModal = async (aula) => {
        setSelectedAula(aula);
        setIsConfigModalOpen(true);
        loadCargaHoraria(aula.id);
    };

    const loadCargaHoraria = async (aulaId) => {
        try {
            const data = await GetCargaHoraria(aulaId);
            setCargaHoraria(data || []);
        } catch (error) {
            toast.error("Error al cargar malla curricular");
        }
    };

    const handleAssignMateria = async () => {
        if (!newMateria.materia_id || !newMateria.docente_id) {
            toast.warning("Seleccione materia y docente");
            return;
        }

        try {
            await AssignMateria(
                selectedAula.id,
                parseInt(newMateria.materia_id),
                parseInt(newMateria.docente_id)
            );
            toast.success("Materia asignada/actualizada");
            loadCargaHoraria(selectedAula.id);
            setNewMateria({ ...newMateria, materia_id: '' });
        } catch (error) {
            toast.error("Error al asignar materia: " + error);
        }
    };

    const handleRemoveMateria = async (id) => {
        try {
            await RemoveMateria(id);
            toast.success("Materia removida del aula");
            loadCargaHoraria(selectedAula.id);
        } catch (error) {
            toast.error("Error al remover materia");
        }
    };

    return (
        <div className="min-h-full w-full bg-slate-50/50 font-sans">
            <div className="w-full flex flex-col gap-6">
                <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 shadow-sm">
                            <School className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Gestión de Aulas</h1>
                            <p className="text-sm text-slate-500 font-medium">Configura cursos, paralelos y carga horaria</p>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <select
                                value={selectedAnio || ''}
                                onChange={(e) => setSelectedAnio(parseInt(e.target.value))}
                                className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 appearance-none cursor-pointer shadow-sm hover:bg-slate-50 transition-colors"
                            >
                                {anios.map(a => (
                                    <option key={a.ID} value={a.ID}>{a.Nombre} {a.Activo ? '(Activo)' : ''}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            disabled={!selectedAnio}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all text-sm font-semibold shadow-md hover:shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4" />
                            Abrir Aula
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Curso</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Paralelo</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tutor (Dirigente)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                                <span className="text-sm font-medium">Cargando aulas...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : aulas.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <School className="w-10 h-10 text-slate-300" />
                                                <p className="font-medium">No hay aulas abiertas para este año lectivo</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    aulas.map((aula) => (
                                        <tr key={aula.id} className="hover:bg-purple-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-slate-800 text-sm">{aula.curso_nombre}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center min-w-8 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100 shadow-sm">
                                                    {aula.paralelo_nombre}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {aula.tutor_nombre !== "Sin Asignar" ? (
                                                    <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                                        <div className="p-1.5 bg-slate-100 rounded-full text-slate-500">
                                                            <User size={14} />
                                                        </div>
                                                        {aula.tutor_nombre}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic bg-slate-50 px-2 py-1 rounded border border-slate-100">Sin asignar</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openConfigModal(aula)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 shadow-sm"
                                                        title="Configurar Malla Curricular"
                                                    >
                                                        <Settings size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAula(aula.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 shadow-sm"
                                                        title="Eliminar Aula"
                                                    >
                                                        <Trash2 size={18} />
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
                                <Plus className="w-5 h-5 text-purple-600" />
                                Abrir Nueva Aula
                            </h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAula} className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Curso</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                                    value={newAula.curso_id}
                                    onChange={(e) => setNewAula({ ...newAula, curso_id: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione un curso...</option>
                                    {cursos.map(c => (
                                        <option key={c.ID} value={c.ID}>{c.Nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Paralelo</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                                    value={newAula.paralelo_id}
                                    onChange={(e) => setNewAula({ ...newAula, paralelo_id: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione un paralelo...</option>
                                    {paralelos.map(p => (
                                        <option key={p.ID} value={p.ID}>{p.Nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tutor (Opcional)</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                                    value={newAula.tutor_id}
                                    onChange={(e) => setNewAula({ ...newAula, tutor_id: e.target.value })}
                                >
                                    <option value="">Sin tutor asignado</option>
                                    {docentes.filter(d => d.Activo).map(d => (
                                        <option key={d.ID} value={d.ID}>{d.Apellidos} {d.Nombres}</option>
                                    ))}
                                </select>
                            </div>

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
                                    className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md shadow-purple-200 transition-all text-sm flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Guardar Aula
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isConfigModalOpen && selectedAula && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] border border-slate-200 scale-100 transform transition-all flex flex-col overflow-hidden">

                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <BookOpen className="w-6 h-6 text-purple-600" />
                                    Malla Curricular
                                </h2>
                                <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                    <span className="font-semibold text-slate-700">{selectedAula.curso_nombre}</span>
                                    <span className="text-slate-300">•</span>
                                    <span className="font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 text-xs">Paralelo "{selectedAula.paralelo_nombre}"</span>
                                </p>
                            </div>
                            <button onClick={() => setIsConfigModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            <div className="w-80 border-r border-slate-100 bg-slate-50/50 p-6 flex flex-col shrink-0 overflow-y-auto">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-5 flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-emerald-600" /> Asignar Materia
                                </h3>

                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Materia</label>
                                        <select
                                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                                            value={newMateria.materia_id}
                                            onChange={(e) => setNewMateria({ ...newMateria, materia_id: e.target.value })}
                                        >
                                            <option value="">Seleccione materia...</option>
                                            {materias.map(m => (
                                                <option key={m.ID} value={m.ID}>{m.Nombre} ({m.Area})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Docente Encargado</label>
                                        <select
                                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                                            value={newMateria.docente_id}
                                            onChange={(e) => setNewMateria({ ...newMateria, docente_id: e.target.value })}
                                        >
                                            <option value="">Seleccione docente...</option>
                                            {docentes.filter(d => d.Activo).map(d => (
                                                <option key={d.ID} value={d.ID}>{d.Apellidos} {d.Nombres}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        onClick={handleAssignMateria}
                                        className="w-full py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md shadow-purple-200 transition-all text-sm flex items-center justify-center gap-2 mt-2 active:scale-[0.98]"
                                    >
                                        <Save size={16} /> Asignar a Malla
                                    </button>
                                </div>

                                <div className="mt-auto pt-6">
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                        <p className="text-xs text-blue-800 leading-relaxed">
                                            <strong>Nota:</strong> Si asignas una materia que ya existe en la lista, se actualizará el docente encargado automáticamente.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                <div className="p-6 pb-2 border-b border-slate-50">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4 text-purple-600" /> Materias Asignadas
                                        <span className="ml-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs border border-slate-200">{cargaHoraria.length}</span>
                                    </h3>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2">
                                    {cargaHoraria.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                                            <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                                            <p className="font-medium text-slate-600">Malla curricular vacía</p>
                                            <p className="text-sm">Agrega materias desde el panel izquierdo.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {cargaHoraria.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-purple-200 hover:shadow-sm transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100 font-bold">
                                                            {item.materia_nombre.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-sm">{item.materia_nombre}</h4>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                                <User className="w-3 h-3" />
                                                                <span>{item.docente_nombre}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleRemoveMateria(item.id)}
                                                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        title="Quitar materia"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassroomsPage;