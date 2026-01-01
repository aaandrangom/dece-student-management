import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Search,
    User,
    Loader2,
    FileText,
    AlertCircle,
    ShieldAlert,
    Gavel,
    ArrowLeft
} from 'lucide-react';

// IMPORTACIONES DE SERVICIOS WAILS
// Nota: Usamos BuscarEstudiantesActivos del TrackingService porque ese devuelve el matricula_id
import { BuscarEstudiantesActivos } from '../../../wailsjs/go/services/TrackingService';
import { ObtenerFotoBase64 } from '../../../wailsjs/go/services/StudentService';

// IMPORTACIÓN DEL COMPONENTE DE GESTIÓN (El que hicimos en el paso anterior)
import LlamadosAtencion from './Warning';

// =============================================================================
// SUB-COMPONENTE: TARJETA DE RESULTADO DE ESTUDIANTE
// =============================================================================
const StudentResultCard = ({ student, onAction }) => {
    const [photo, setPhoto] = useState(null);

    // Cargar foto de forma asíncrona independiente para no bloquear la lista
    useEffect(() => {
        let isMounted = true;
        if (student.id) {
            ObtenerFotoBase64(student.id).then(b64 => {
                if (isMounted && b64) setPhoto(b64);
            }).catch(() => {
                // Silencioso: si falla la foto, se muestra el icono por defecto
            });
        }
        return () => { isMounted = false; };
    }, [student.id]);

    return (
        <div className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-2">

            {/* Información del Estudiante */}
            <div className="flex items-center gap-4 flex-1 w-full min-w-0">
                <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {photo ? (
                        <img src={photo} alt="Perfil" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-6 h-6 text-slate-400" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h4
                        className="font-bold text-slate-800 truncate text-base"
                        title={`${student.apellidos} ${student.nombres}`}
                    >
                        {student.apellidos} {student.nombres}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {student.cedula}
                        </span>
                        {/* Mostramos el curso activo devuelto por el JOIN del backend */}
                        {student.curso && (
                            <>
                                <span className="text-xs text-slate-300 hidden sm:inline">•</span>
                                <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 truncate max-w-50">
                                    {student.curso}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto mt-2 sm:mt-0 shrink-0 justify-end">
                <button
                    onClick={(e) => { e.stopPropagation(); onAction('discipline', student); }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100 hover:bg-red-100 hover:border-red-200 transition-colors whitespace-nowrap shadow-sm"
                >
                    <AlertCircle className="w-4 h-4" />
                    Llamado Atención
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onAction('sensitive', student); }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-colors whitespace-nowrap shadow-sm"
                >
                    <ShieldAlert className="w-4 h-4" />
                    Caso Sensible
                </button>
            </div>
        </div>
    );
};

// =============================================================================
// COMPONENTE PRINCIPAL: PÁGINA DE GESTIÓN DISCIPLINARIA
// =============================================================================
export default function DisciplineManagerPage() {
    // Estados del Buscador
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Estados de Navegación (Drill-down)
    const [selectedMatriculaId, setSelectedMatriculaId] = useState(null);
    const [selectedStudentName, setSelectedStudentName] = useState(''); // Para el título
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const hasActiveSearch = query.trim().length > 0;

    // Efecto Debounce para la búsqueda
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (query.trim().length >= 3) {
                setIsSearching(true);
                try {
                    // Llamamos al servicio TrackingService.BuscarEstudiantesActivos
                    // Este servicio devuelve EstudianteDisciplinaDTO (incluye matricula_id)
                    const data = await BuscarEstudiantesActivos(query);
                    setResults(data || []);
                } catch (err) {
                    console.error(err);
                    toast.error("Error al buscar estudiantes activos.");
                } finally {
                    setIsSearching(false);
                }
            } else {
                setResults([]);
            }
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [query]);

    // Manejador de acciones (Click en botones de la tarjeta)
    const handleAction = (type, student) => {
        if (type === 'discipline') {
            // Validación crítica: Sin matrícula activa no se puede poner sanción
            if (!student.matricula_id || student.matricula_id === 0) {
                toast.error("El estudiante no tiene una matrícula activa en el periodo vigente.");
                return;
            }

            // Configuramos el estado para mostrar la vista de detalle
            setSelectedMatriculaId(student.matricula_id);
            setSelectedStudentName(`${student.apellidos} ${student.nombres}`);
            setIsDetailOpen(true);
        } else if (type === 'sensitive') {
            toast.info("El módulo de Casos Sensibles estará disponible próximamente.");
        }
    };

    const handleBackToSearch = () => {
        setIsDetailOpen(false);
        setSelectedMatriculaId(null);
        setSelectedStudentName('');
    };

    return (
        <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans relative">

            {isDetailOpen && selectedMatriculaId ? (
                <div className="animate-in slide-in-from-right duration-300 h-full">
                    <LlamadosAtencion
                        matriculaId={selectedMatriculaId}
                        nombreEstudiante={selectedStudentName}
                        onBack={handleBackToSearch}
                    />
                </div>
            ) : (
                <div className="mx-auto w-full flex flex-col gap-6">

                    <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="p-3 bg-red-50 rounded-xl border border-red-100 shadow-sm">
                                <Gavel className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Gestión Disciplinaria</h1>
                                <p className="text-sm text-slate-500 font-medium">Registro de faltas, sanciones y seguimiento DECE</p>
                            </div>
                        </div>
                    </div>

                    {/* Contenedor del Buscador */}
                    <div
                        className={`flex flex-col items-center bg-white rounded-xl shadow-sm border border-slate-200 min-h-[60vh] transition-all duration-500 ease-in-out ${hasActiveSearch ? 'justify-start pt-12' : 'justify-center py-12'
                            }`}
                    >
                        <div className="w-full max-w-3xl px-6 space-y-6">

                            {/* Instrucciones (se ocultan al buscar) */}
                            <div
                                className={`text-center space-y-2 transition-all duration-500 ease-in-out overflow-hidden ${hasActiveSearch ? 'max-h-0 opacity-0 mb-0' : 'max-h-60 opacity-100 mb-4'
                                    }`}
                            >
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                                    <Search className="w-8 h-8 text-slate-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800">Buscar Estudiante</h2>
                                <p className="text-slate-500 text-sm">Ingrese cédula o apellidos para reportar una novedad</p>
                            </div>

                            {/* Input de Búsqueda */}
                            <div className="relative shadow-sm z-10 transition-transform duration-300">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    {isSearching ? (
                                        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                                    ) : (
                                        <Search className="h-5 w-5 text-slate-400" />
                                    )}
                                </div>
                                <input
                                    type="text"
                                    className={`block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-800 font-medium ${hasActiveSearch ? 'shadow-md bg-white' : ''
                                        }`}
                                    placeholder="Buscar estudiante matriculado..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {/* Lista de Resultados */}
                            <div className={`space-y-4 transition-opacity duration-500 ${hasActiveSearch ? 'opacity-100' : 'opacity-0'}`}>

                                {/* Mensaje de mínimo caracteres */}
                                {query.length > 0 && query.length < 3 && results.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-slate-400 font-medium text-sm bg-slate-50 inline-block px-4 py-2 rounded-lg border border-slate-100">
                                            Ingrese al menos 3 caracteres...
                                        </p>
                                    </div>
                                )}

                                {/* Mensaje de Sin Resultados */}
                                {query.length >= 3 && !isSearching && results.length === 0 && (
                                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 animate-in fade-in zoom-in-95 duration-300">
                                        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-50" />
                                        <p className="text-slate-600 font-medium">No se encontraron estudiantes activos</p>
                                        <p className="text-xs text-slate-400 mt-1">Verifique que el estudiante esté matriculado en el periodo actual</p>
                                    </div>
                                )}

                                {/* Tarjetas de Estudiantes */}
                                {results.length > 0 && (
                                    <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex justify-between items-end px-1 pb-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resultados Encontrados</p>
                                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{results.length}</span>
                                        </div>
                                        {results.map((est) => (
                                            <StudentResultCard
                                                key={est.id}
                                                student={est}
                                                onAction={handleAction}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}