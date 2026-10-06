import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Search, Plus, User, Edit3, Users,
    ChevronLeft, ChevronRight, Upload,
    CheckCircle2, AlertTriangle, XCircle, X, RefreshCw,
    FileText, Loader2, Trash2, Eye
} from 'lucide-react';
import { EventsOn } from '../../../wailsjs/runtime/runtime';
import Swal from 'sweetalert2';

import { BuscarEstudiantesFiltrados, ObtenerFotoBase64, ImportarEstudiantes, EliminarEstudiante } from '../../../wailsjs/go/services/StudentService';
import { ListarCursos } from '../../../wailsjs/go/services/CourseService';
import { ObtenerPeriodoVista } from '../../../wailsjs/go/academic/YearService';
import { ListarNiveles } from '../../../wailsjs/go/academic/LevelService';
import {
    ListarPlantillas, ObtenerDatosCertificado, GenerarCertificado, AbrirCarpetaCertificados
} from '../../../wailsjs/go/services/TemplateService';
import { useScreenLock } from '../../context/ScreenLockContext';
import { nombreCampo, labelsDePlantilla } from '../../constants/certificateTags';

export default function StudentsPage() {
    const navigate = useNavigate();

    const handleCreate = () => {
        navigate('/estudiantes/nuevo');
    };

    const handleEdit = (id) => {
        navigate(`/estudiantes/editar/${id}`);
    };

    return (
        <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans">
            <StudentList onCreate={handleCreate} onEdit={handleEdit} />
        </div>
    );
}

function StudentList({ onCreate, onEdit }) {
    const [students, setStudents] = useState([]);
    const [activePeriod, setActivePeriod] = useState(null);
    const [query, setQuery] = useState(() => sessionStorage.getItem('student_query') || '');
    const [filterNivel, setFilterNivel] = useState(() => sessionStorage.getItem('student_nivel') || 0);
    const [filterParalelo, setFilterParalelo] = useState(() => sessionStorage.getItem('student_paralelo') || '');
    const [filterJornada, setFilterJornada] = useState(() => sessionStorage.getItem('student_jornada') || '');
    const [filterSinMatricula, setFilterSinMatricula] = useState(() => sessionStorage.getItem('student_sin_matricula') === 'true');
    const searchRequestId = useRef(0);
    const searchTimer = useRef(null);
    const [levels, setLevels] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [imageCache, setImageCache] = useState({});
    const [importProgress, setImportProgress] = useState(null);
    const [importResult, setImportResult] = useState(null);

    // Import Configuration Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [selectedCourseID, setSelectedCourseID] = useState("");
    const [isLoadingCourses, setIsLoadingCourses] = useState(false);
    const [activePeriodName, setActivePeriodName] = useState("");

    // Certificate Modal State
    const [isCertModalOpen, setIsCertModalOpen] = useState(false);
    const [certStudent, setCertStudent] = useState(null);
    const [certTemplates, setCertTemplates] = useState([]);
    const [certSelectedTemplate, setCertSelectedTemplate] = useState(null);
    const [certCampos, setCertCampos] = useState([]); // [{ tag, valor, automatico }] en el orden del documento
    const { user } = useScreenLock();
    const [isLoadingCert, setIsLoadingCert] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const cancel = EventsOn("student:import_progress", (data) => {
            setImportProgress(data);
        });
        return () => {
            if (cancel) cancel();
        };
    }, []);

    const isLocalPath = (rf) => {
        if (!rf) return false;
        try {
            if (rf.startsWith('file:')) return true;
            if (/^[A-Za-z]:/.test(rf)) return true;
            if (rf.startsWith('\\')) return true;
            if (rf.startsWith('/')) return true;
        } catch (e) {
            return false;
        }
        return false;
    };

    const search = async (q = query, niv = filterNivel, par = filterParalelo, jor = filterJornada, sinMat = filterSinMatricula) => {
        // Una búsqueda inmediata reemplaza a la que estaba pendiente por el debounce.
        clearTimeout(searchTimer.current);
        // Solo se aplica la respuesta de la última búsqueda lanzada; las anteriores se descartan.
        const requestId = ++searchRequestId.current;
        try {
            const data = await BuscarEstudiantesFiltrados(q, Number(niv) || 0, par, jor, sinMat);
            if (requestId !== searchRequestId.current) return;
            setStudents(data || []);
            setCurrentPage(1);
            try {
                if (data && Array.isArray(data)) {
                    data.forEach((s) => {
                        if (s.ruta_foto && isLocalPath(s.ruta_foto)) {
                            if (!imageCache[s.id]) {
                                ObtenerFotoBase64(s.id).then((b64) => {
                                    if (b64) setImageCache(prev => ({ ...prev, [s.id]: b64 }));
                                }).catch(() => { });
                            }
                        }
                    });
                }
            } catch (e) {
            }
        } catch (err) {
            if (requestId !== searchRequestId.current) return;
            toast.error("Error al buscar estudiantes");
        }
    };

    const handleDelete = async (st) => {
        const result = await Swal.fire({
            title: '¿Confirmar eliminación?',
            html: `Está a punto de eliminar a <b>${st.apellidos} ${st.nombres}</b>.<br/><br/>Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await EliminarEstudiante(st.id);
                toast.success("Estudiante eliminado correctamente");
                search();
            } catch (error) {
                toast.error(error || "Error al eliminar estudiante");
            }
        }
    };

    useEffect(() => {
        sessionStorage.setItem('student_query', query);
        sessionStorage.setItem('student_nivel', filterNivel);
        sessionStorage.setItem('student_paralelo', filterParalelo);
        sessionStorage.setItem('student_jornada', filterJornada);
        sessionStorage.setItem('student_sin_matricula', filterSinMatricula);
    }, [query, filterNivel, filterParalelo, filterJornada, filterSinMatricula]);

    useEffect(() => () => clearTimeout(searchTimer.current), []);

    useEffect(() => {
        ListarNiveles().then(data => setLevels(data || [])).catch(() => {});
        ObtenerPeriodoVista().then(period => {
            setActivePeriod(period);
        }).catch((err) => {
            console.error("Error al obtener periodo activo:", err);
        });
        const initialQuery = sessionStorage.getItem('student_query') || '';
        const initialNivel = sessionStorage.getItem('student_nivel') || 0;
        const initialParalelo = sessionStorage.getItem('student_paralelo') || '';
        const initialJornada = sessionStorage.getItem('student_jornada') || '';
        const initialSinMatricula = sessionStorage.getItem('student_sin_matricula') === 'true';
        search(initialQuery, initialNivel, initialParalelo, initialJornada, initialSinMatricula);
    }, []);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => search(val), 300);
    };

    const filterSelectClass = (active) =>
        `w-full py-2.5 px-3 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer ${active ? 'bg-purple-50 border-purple-300 text-purple-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = students.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(students.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const openImportModal = async () => {
        setIsLoadingCourses(true);
        try {
            const period = await ObtenerPeriodoVista();
            if (period) {
                setActivePeriodName(period.nombre);
                const courses = await ListarCursos(period.id);
                setAvailableCourses(courses || []);
            } else {
                setActivePeriodName("");
                setAvailableCourses([]);
            }
            setSelectedCourseID(""); // Reset selection
            setIsImportModalOpen(true);
        } catch (err) {
            console.error(err);
            toast.error("Error al preparar importación: " + String(err));
        } finally {
            setIsLoadingCourses(false);
        }
    };

    const handleImport = async (courseID = 0) => {
        setImportProgress({ current: 0, total: 100, creados: 0, actualizados: 0, errores: 0 });
        setImportResult(null);
        try {
            // Pass courseID to backend (0 means no enrollment)
            const result = await ImportarEstudiantes(courseID);
            if (!result) {
                // Usuario canceló el diálogo de archivo
                toast.info("Importación cancelada.");
                setImportProgress(null);
                return;
            }

            setImportProgress(null);
            setImportResult(result);
            search(query);

            if (result.errores && result.errores.length > 0) {
                toast.warning(`Importación completada con ${result.errores.length} error(es).`);
            } else if (result.creados > 0 || result.actualizados > 0) {
                toast.success(`Importación exitosa: ${result.creados} creados, ${result.actualizados} actualizados.`);
            } else {
                toast.info("No hubo cambios en la base de datos.");
            }
        } catch (err) {
            console.error(err);
            toast.error(String(err) || "Error al importar estudiantes");
            setImportProgress(null);
        }
    };

    const closeImportResult = () => {
        setImportResult(null);
    };

    // === Certificate Generation ===
    const openCertificateModal = async (student) => {
        setCertStudent(student);
        setIsCertModalOpen(true);
        setCertSelectedTemplate(null);
        setCertCampos([]);
        try {
            const templates = await ListarPlantillas();
            const disponibles = (templates || []).filter(t => t.ruta_archivo);
            setCertTemplates(disponibles);
            // Con una sola plantilla no hay nada que elegir.
            if (disponibles.length === 1) handleSelectTemplate(disponibles[0].id, disponibles, student);
        } catch (err) {
            toast.error("Error cargando plantillas: " + String(err));
        }
    };

    const handleSelectTemplate = async (templateId, lista = certTemplates, estudiante = certStudent) => {
        if (!templateId || !estudiante) {
            setCertSelectedTemplate(null);
            setCertCampos([]);
            return;
        }
        setCertSelectedTemplate(lista.find(t => t.id === Number(templateId)) || null);
        setIsLoadingCert(true);
        try {
            const datos = await ObtenerDatosCertificado(Number(templateId), estudiante.id, user?.id || 0);
            setCertCampos(datos?.campos || []);
        } catch (err) {
            toast.error("Error cargando datos: " + String(err));
            setCertCampos([]);
        } finally {
            setIsLoadingCert(false);
        }
    };

    const setValorCampo = (tag, valor) =>
        setCertCampos(prev => prev.map(c => c.tag === tag ? { ...c, valor } : c));

    const abrirCarpetaCertificados = () => AbrirCarpetaCertificados().catch(err => toast.error(String(err)));

    const handleGenerateCert = async () => {
        if (!certSelectedTemplate || !certStudent) return;

        const vacios = certCampos.filter(c => !c.valor.trim());
        if (vacios.length > 0) {
            const labels = labelsDePlantilla(certSelectedTemplate);
            const lista = vacios.map(c => `<li>${nombreCampo(c.tag, labels)}</li>`).join('');
            const res = await Swal.fire({
                title: 'Hay campos vacíos',
                html: `<p style="margin-bottom:8px">Estos campos quedarán en blanco en el documento:</p><ul style="text-align:left;display:inline-block;list-style:disc;padding-left:20px">${lista}</ul>`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Generar igual',
                cancelButtonText: 'Completar',
                confirmButtonColor: '#2563eb',
                reverseButtons: true,
            });
            if (!res.isConfirmed) return;
        }

        setIsGenerating(true);
        try {
            const valores = Object.fromEntries(certCampos.map(c => [c.tag, c.valor]));
            await GenerarCertificado(certSelectedTemplate.id, certStudent.id, valores);
            toast.success("Certificado generado y abierto en Word", {
                action: { label: 'Ver carpeta', onClick: abrirCarpetaCertificados },
            });
            setIsCertModalOpen(false);
        } catch (err) {
            toast.error("Error generando certificado: " + String(err));
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 shadow-sm">
                        <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            Gestión de Estudiantes
                            {activePeriod?.solo_lectura && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
                                    <Eye className="w-3 h-3 text-amber-600 animate-pulse" />
                                    Solo Lectura
                                </span>
                            )}
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">Directorio general de alumnos</p>
                    </div>
                </div>
                {!activePeriod?.solo_lectura && (
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={openImportModal}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-bold shadow-md hover:shadow-green-200 active:scale-95"
                        >
                            <Upload size={18} /> Importar
                        </button>
                        <button
                            onClick={onCreate}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-bold shadow-md hover:shadow-purple-200 active:scale-95"
                        >
                            <Plus size={18} /> Nuevo
                        </button>
                    </div>
                )}
            </div>

            <div className="@container bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
                    <div className="inline-flex p-1 bg-slate-100 rounded-lg" role="tablist">
                        {[
                            { value: false, label: 'Matriculados' },
                            { value: true, label: 'Sin matrícula activa' },
                        ].map(tab => {
                            const active = filterSinMatricula === tab.value;
                            return (
                                <button
                                    key={tab.label}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => {
                                        if (active) return;
                                        setFilterSinMatricula(tab.value);
                                        search(query, filterNivel, filterParalelo, filterJornada, tab.value);
                                    }}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${active ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {tab.label}
                                    {active && (
                                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">{students.length}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        {(query !== '' || filterNivel != 0 || filterParalelo !== '' || filterJornada !== '') && (
                            <button
                                type="button"
                                onClick={() => {
                                    setQuery('');
                                    setFilterNivel(0);
                                    setFilterParalelo('');
                                    setFilterJornada('');
                                    search('', 0, '', '');
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-slate-500 hover:text-red-600 rounded-md transition-colors"
                                title="Limpiar búsqueda y filtros"
                            >
                                <X className="w-4 h-4" />
                                Limpiar
                            </button>
                        )}
                        <label className="flex items-center gap-2">
                            <span className="text-slate-500">Mostrar</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 focus:outline-none focus:border-purple-500 font-semibold text-slate-700"
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                            <span className="text-slate-500">filas</span>
                        </label>
                    </div>
                </div>

                <div className={`grid grid-cols-1 gap-3 p-4 ${filterSinMatricula ? '' : '@xl:grid-cols-3 @5xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]'}`}>
                    <div className="relative @xl:col-span-3 @5xl:col-span-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cédula, nombres o apellidos..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all"
                            value={query}
                            onChange={handleSearchChange}
                        />
                    </div>
                    {!filterSinMatricula && (
                        <>
                            <select
                                className={filterSelectClass(filterNivel != 0)}
                                value={filterNivel}
                                onChange={(e) => { setFilterNivel(e.target.value); search(query, e.target.value, filterParalelo, filterJornada); }}
                            >
                                <option value="0">Todos los niveles</option>
                                {levels.map(l => (
                                    <option key={l.id} value={l.id}>{l.nombre}</option>
                                ))}
                            </select>
                            <select
                                className={filterSelectClass(filterParalelo !== '')}
                                value={filterParalelo}
                                onChange={(e) => { setFilterParalelo(e.target.value); search(query, filterNivel, e.target.value, filterJornada); }}
                            >
                                <option value="">Todos los paralelos</option>
                                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(p => (
                                    <option key={p} value={p}>Paralelo {p}</option>
                                ))}
                            </select>
                            <select
                                className={filterSelectClass(filterJornada !== '')}
                                value={filterJornada}
                                onChange={(e) => { setFilterJornada(e.target.value); search(query, filterNivel, filterParalelo, e.target.value); }}
                            >
                                <option value="">Todas las jornadas</option>
                                <option value="Matutina">Matutina</option>
                                <option value="Vespertina">Vespertina</option>
                                <option value="Nocturna">Nocturna</option>
                            </select>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Estudiante</th>
                                <th className="px-6 py-4">Identificación</th>
                                <th className="px-6 py-4">Apellidos</th>
                                <th className="px-6 py-4">Nombres</th>
                                <th className="px-6 py-4">Correo</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-400">
                                        No se encontraron resultados
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((st) => (
                                    <tr key={st.id} className="hover:bg-purple-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-200 shadow-sm">
                                                {(() => {
                                                    const cached = imageCache[st.id];
                                                    const safeSrc = cached || (st.ruta_foto && !isLocalPath(st.ruta_foto) ? st.ruta_foto : null);
                                                    if (safeSrc) {
                                                        return <img src={safeSrc} alt="Avatar" className="w-full h-full object-cover" />;
                                                    }
                                                    return (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                                                            <User size={20} />
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-mono text-sm font-medium">
                                            {st.info_nacionalidad?.es_extranjero
                                                ? (st.info_nacionalidad.pasaporte_odni || 'S/N')
                                                : (st.cedula || 'S/N')
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-slate-800 font-bold text-sm uppercase">{st.apellidos}</td>
                                        <td className="px-6 py-4 text-slate-700 font-medium text-sm uppercase">{st.nombres}</td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">{st.correo_electronico || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {activePeriod?.solo_lectura ? (
                                                    <button
                                                        onClick={() => onEdit(st.id)}
                                                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                                        title="Visualizar Estudiante"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => onEdit(st.id)}
                                                        className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                                        title="Editar"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openCertificateModal(st); }}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Generar Certificado"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                                {!activePeriod?.solo_lectura && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(st); }}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Eliminar Estudiante"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {students.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                        <span className="text-sm text-slate-500">
                            Página <span className="font-bold text-slate-700">{currentPage}</span> de {totalPages}
                        </span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-400 disabled:opacity-30">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-400 disabled:opacity-30">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Import Configuration Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 scale-100 transform transition-all">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-green-600" />
                                Configuración de Importación
                            </h3>
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                                <p className="flex items-start gap-2">
                                    <span className="font-bold text-lg leading-none">ℹ</span>
                                    Seleccione un curso si desea que los estudiantes sean matriculados automáticamente tras ser importados.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                    Curso de Destino (Opcional)
                                </label>
                                {isLoadingCourses ? (
                                    <div className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-sm animate-pulse">
                                        Cargando cursos...
                                    </div>
                                ) : (
                                    <select
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                                        value={selectedCourseID}
                                        onChange={(e) => setSelectedCourseID(e.target.value)}
                                        disabled={availableCourses.length === 0}
                                    >
                                        <option value="">-- No matricular (Solo importar) --</option>
                                        {availableCourses.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.nombre_completo}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {availableCourses.length === 0 && !isLoadingCourses && (
                                    <p className="text-xs text-amber-600 font-medium">
                                        {activePeriodName
                                            ? "No hay cursos creados en el periodo activo."
                                            : "No hay periodo lectivo activo."}
                                    </p>
                                )}
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setIsImportModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        setIsImportModalOpen(false);
                                        handleImport(selectedCourseID ? parseInt(selectedCourseID) : 0);
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md shadow-green-200 transition-all text-sm flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Upload className="w-4 h-4" />
                                    Continuar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de progreso */}
            {importProgress && !importResult && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-100">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                            <h3 className="font-bold text-xl text-slate-800">Importando Estudiantes</h3>
                            <p className="text-slate-500 text-sm mt-1">Por favor espere, no cierre la aplicación...</p>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden border border-slate-200">
                            <div
                                className="bg-blue-600 h-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                                style={{ width: `${importProgress.total > 0 ? Math.round((importProgress.current / importProgress.total) * 100) : 0}%` }}
                            ></div>
                        </div>

                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-slate-600">{importProgress.current} de {importProgress.total} procesados</span>
                            <span className="text-blue-600">{importProgress.total > 0 ? Math.round((importProgress.current / importProgress.total) * 100) : 0}%</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de resultados */}
            {importResult && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-100">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${importResult.errores?.length > 0
                                    ? 'bg-amber-100'
                                    : 'bg-green-100'
                                    }`}>
                                    {importResult.errores?.length > 0
                                        ? <AlertTriangle className="w-6 h-6 text-amber-600" />
                                        : <CheckCircle2 className="w-6 h-6 text-green-600" />
                                    }
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">Resultado de Importación</h3>
                                    <p className="text-slate-500 text-sm">{importResult.totalFilas} filas procesadas</p>
                                </div>
                            </div>
                            <button
                                onClick={closeImportResult}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="p-6 border-b border-slate-200 shrink-0">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                                    <div className="text-2xl font-bold text-slate-800">{importResult.totalFilas}</div>
                                    <div className="text-xs font-medium text-slate-500 mt-1">Total Filas</div>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
                                    <div className="text-2xl font-bold text-green-700">{importResult.creados}</div>
                                    <div className="text-xs font-medium text-green-600 mt-1">Creados</div>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-center">
                                    <div className="text-2xl font-bold text-blue-700">{importResult.actualizados}</div>
                                    <div className="text-xs font-medium text-blue-600 mt-1">Actualizados</div>
                                </div>
                                <div className={`rounded-xl p-4 border text-center ${importResult.errores?.length > 0
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-slate-50 border-slate-200'
                                    }`}>
                                    <div className={`text-2xl font-bold ${importResult.errores?.length > 0 ? 'text-red-700' : 'text-slate-400'}`}>
                                        {importResult.errores?.length || 0}
                                    </div>
                                    <div className={`text-xs font-medium mt-1 ${importResult.errores?.length > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                        Errores
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error table */}
                        {importResult.errores && importResult.errores.length > 0 && (
                            <div className="flex-1 overflow-auto p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    <h4 className="font-bold text-sm text-slate-700">Detalle de Errores</h4>
                                    <span className="text-xs text-slate-400 ml-1">Corrija estos registros en el Excel y vuelva a importar (no se duplicarán)</span>
                                </div>
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-red-50 border-b border-red-100">
                                                <th className="px-4 py-2.5 text-left font-bold text-red-700 text-xs uppercase">Fila</th>
                                                <th className="px-4 py-2.5 text-left font-bold text-red-700 text-xs uppercase">Cédula</th>
                                                <th className="px-4 py-2.5 text-left font-bold text-red-700 text-xs uppercase">Detalle del Error</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {importResult.errores.map((err, idx) => (
                                                <tr key={idx} className="hover:bg-red-50/30">
                                                    <td className="px-4 py-2.5 font-mono text-slate-600 font-bold">{err.fila}</td>
                                                    <td className="px-4 py-2.5 font-mono text-slate-700">{err.cedula || '-'}</td>
                                                    <td className="px-4 py-2.5 text-red-600">{err.detalle}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                            {importResult.errores?.length > 0 && (
                                <button
                                    onClick={() => { closeImportResult(); openImportModal(); }}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-bold"
                                >
                                    <RefreshCw size={16} /> Re-importar
                                </button>
                            )}
                            <button
                                onClick={closeImportResult}
                                className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all text-sm font-bold"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Certificate Generation Modal */}
            {isCertModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-200 max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" /> Generar Certificado
                                </h3>
                                {certStudent && (
                                    <p className="text-sm text-slate-500 mt-0.5">
                                        Estudiante: <span className="font-medium text-slate-700">{certStudent.apellidos} {certStudent.nombres}</span>
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setIsCertModalOpen(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Template Selector */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Seleccionar Plantilla <span className="text-red-400">*</span>
                                </label>
                                <select
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                                    value={certSelectedTemplate?.id || ''}
                                    onChange={(e) => handleSelectTemplate(e.target.value)}
                                >
                                    <option value="">-- Seleccione una plantilla --</option>
                                    {certTemplates.map(tpl => (
                                        <option key={tpl.id} value={tpl.id}>
                                            {tpl.nombre} {tpl.descripcion ? `(${tpl.descripcion})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {certTemplates.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-2 font-medium flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> No hay plantillas disponibles con archivo. Suba una en Herramientas → Plantillas Word.
                                    </p>
                                )}
                            </div>

                            {/* Loading */}
                            {isLoadingCert && (
                                <div className="flex items-center justify-center py-12">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                        <span className="text-sm font-medium text-slate-500">Cargando datos del estudiante...</span>
                                    </div>
                                </div>
                            )}

                            {/* Campos del documento */}
                            {certSelectedTemplate && !isLoadingCert && (() => {
                                const labels = labelsDePlantilla(certSelectedTemplate);
                                const manuales = certCampos.filter(c => !c.automatico);
                                const automaticos = certCampos.filter(c => c.automatico);
                                const campo = (c) => {
                                    const vacio = !c.valor.trim();
                                    return (
                                        <div key={c.tag}>
                                            <label htmlFor={`cert-${c.tag}`} className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
                                                <span>{nombreCampo(c.tag, labels)}</span>
                                                {vacio && <span className="text-[10px] font-semibold text-amber-600">Vacío</span>}
                                            </label>
                                            <input
                                                id={`cert-${c.tag}`}
                                                type="text"
                                                value={c.valor}
                                                onChange={(e) => setValorCampo(c.tag, e.target.value)}
                                                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:bg-white transition-all placeholder:text-slate-300 ${vacio
                                                    ? 'bg-amber-50/40 border-amber-300 focus:ring-amber-500/20 focus:border-amber-500'
                                                    : 'bg-slate-50/50 border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'}`}
                                                placeholder={`Valor para {{${c.tag}}}`}
                                            />
                                        </div>
                                    );
                                };
                                if (certCampos.length === 0) {
                                    return (
                                        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4">
                                            Esta plantilla no tiene campos para completar. Se generará tal como está.
                                        </p>
                                    );
                                }
                                return (
                                    <div className="space-y-6">
                                        {manuales.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="w-2 h-2 bg-amber-500 rounded-full" />
                                                    <h4 className="text-sm font-bold text-slate-700">Por completar</h4>
                                                    <span className="text-xs text-slate-400">({manuales.length})</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{manuales.map(campo)}</div>
                                            </div>
                                        )}
                                        {automaticos.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                                    <h4 className="text-sm font-bold text-slate-700">Completado automáticamente</h4>
                                                    <span className="text-xs text-slate-400">({automaticos.length})</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mb-3">Datos del estudiante, de su usuario y de la fecha de hoy. Puede corregirlos antes de generar.</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{automaticos.map(campo)}</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
                            <button
                                onClick={abrirCarpetaCertificados}
                                className="px-3 py-2.5 text-slate-500 font-semibold rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-colors text-sm"
                                title="Abrir la carpeta de certificados generados"
                            >
                                Ver generados
                            </button>
                            <button
                                onClick={() => setIsCertModalOpen(false)}
                                disabled={isGenerating}
                                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGenerateCert}
                                disabled={!certSelectedTemplate || isGenerating || isLoadingCert}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
                                ) : (
                                    <><FileText className="w-4 h-4" /> Generar Certificado</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}