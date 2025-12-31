import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, User, ArrowRight, Loader2, GraduationCap, FileText } from 'lucide-react';
import { BuscarEstudiantes, ObtenerEstudiante, ObtenerFotoBase64 } from '../../../wailsjs/go/services/StudentService';
import EnrollmentFormPage from './EnrollmentFormPage';

const StudentCard = ({ student, onSelect }) => {
    const [photo, setPhoto] = useState(null);

    useEffect(() => {
        let isMounted = true;
        if (student.ruta_foto) {
            ObtenerFotoBase64(student.id).then(b64 => {
                if (isMounted && b64) setPhoto(b64);
            }).catch(() => { });
        }
        return () => { isMounted = false; };
    }, [student]);

    return (
        <div
            onClick={() => onSelect(student)}
            className="group bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2"
        >
            <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-100 group-hover:border-blue-500 overflow-hidden shrink-0 flex items-center justify-center transition-colors">
                {photo ? (
                    <img src={photo} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                    <User className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors text-base">
                    {student.apellidos} {student.nombres}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {student.cedula}
                    </span>
                    {student.curso && (
                        <>
                            <span className="text-xs text-slate-300">•</span>
                            <span className="text-xs font-medium text-slate-600 bg-blue-50 px-2 py-0.5 rounded">
                                {student.curso}
                            </span>
                        </>
                    )}
                </div>
            </div>

            <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <ArrowRight className="w-5 h-5" />
            </div>
        </div>
    );
};

export default function EnrollmentManager() {
    const [view, setView] = useState('search');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const hasActiveSearch = query.trim().length > 0;

    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (query.trim().length >= 3) {
                setIsSearching(true);
                try {
                    const data = await BuscarEstudiantes(query);
                    setResults(data || []);
                } catch (err) {
                    console.error(err);
                    toast.error("Error al buscar estudiantes");
                } finally {
                    setIsSearching(false);
                }
            } else {
                setResults([]);
            }
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelectStudent = async (studentSummary) => {
        setIsLoadingDetails(true);
        try {
            const fullStudent = await ObtenerEstudiante(studentSummary.id);
            if (fullStudent) {
                setSelectedStudent(fullStudent);
                setView('form');
            }
        } catch (err) {
            toast.error("No se pudo cargar la información del estudiante");
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const handleBackToSearch = () => {
        setSelectedStudent(null);
        setView('search');
    };

    if (view === 'form' && selectedStudent) {
        return (
            <EnrollmentFormPage
                studentId={selectedStudent.id}
                studentGender={selectedStudent.genero_nacimiento}
                onBack={handleBackToSearch}
            />
        );
    }

    return (
        <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans">
            <div className="mx-auto w-full flex flex-col gap-6">

                <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                            <GraduationCap className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Gestión de Matrículas</h1>
                            <p className="text-sm text-slate-500 font-medium">Búsqueda y gestión de expedientes estudiantiles</p>
                        </div>
                    </div>
                </div>

                <div
                    className={`flex flex-col items-center bg-white rounded-xl shadow-sm border border-slate-200 min-h-[60vh] transition-all duration-500 ease-in-out ${hasActiveSearch ? 'justify-start pt-12' : 'justify-center py-12'
                        }`}
                >
                    <div className="w-full max-w-2xl px-6 space-y-6">

                        <div
                            className={`text-center space-y-2 transition-all duration-500 ease-in-out overflow-hidden ${hasActiveSearch ? 'max-h-0 opacity-0 mb-0' : 'max-h-60 opacity-100 mb-4'
                                }`}
                        >
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                                <Search className="w-8 h-8 text-slate-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">Buscar Estudiante</h2>
                            <p className="text-slate-500 text-sm">Ingrese cédula o apellidos para iniciar o editar el proceso de matrícula</p>
                        </div>

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
                                className={`block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium ${hasActiveSearch ? 'shadow-md bg-white' : ''
                                    }`}
                                placeholder="Buscar por cédula o apellidos..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {isLoadingDetails && (
                            <div className="flex justify-center p-4">
                                <span className="flex items-center gap-2 text-sm text-blue-600 font-medium bg-blue-50 px-4 py-2 rounded-full animate-pulse">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Cargando expediente...
                                </span>
                            </div>
                        )}

                        <div className={`space-y-4 transition-opacity duration-500 ${hasActiveSearch ? 'opacity-100' : 'opacity-0'}`}>
                            {query.length > 0 && query.length < 3 && results.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-slate-400 font-medium text-sm bg-slate-50 inline-block px-4 py-2 rounded-lg border border-slate-100">
                                        Ingrese al menos 3 caracteres...
                                    </p>
                                </div>
                            )}

                            {query.length >= 3 && !isSearching && results.length === 0 && (
                                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 animate-in fade-in zoom-in-95 duration-300">
                                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-50" />
                                    <p className="text-slate-600 font-medium">No se encontraron resultados</p>
                                    <p className="text-xs text-slate-400 mt-1">Verifique los datos ingresados</p>
                                </div>
                            )}

                            {results.length > 0 && (
                                <div className="grid grid-cols-1 gap-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1">Resultados ({results.length})</p>
                                    {results.map((est) => (
                                        <StudentCard
                                            key={est.id}
                                            student={est}
                                            onSelect={handleSelectStudent}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}