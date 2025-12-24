import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    UserPlus, ArrowRight, ArrowLeft, Save, CheckCircle2, User,
    School, Users, HeartPulse, AlertTriangle, Info
} from 'lucide-react';

import { GetAniosLectivos } from '../../wailsjs/go/academic/YearService';
import { GetCursos } from '../../wailsjs/go/academic/CourseService';
import { GetParalelos } from '../../wailsjs/go/academic/ParallelService';
import { GetAulasByAnio } from '../../wailsjs/go/academic/ClassroomService';
import { EnrollNewStudent, GetStudentByCedula, EnrollExistingStudent } from '../../wailsjs/go/student/StudentService';

const StudentEnrollmentPage = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isExistingStudent, setIsExistingStudent] = useState(false);

    const [anios, setAnios] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [paralelos, setParalelos] = useState([]);
    const [aulas, setAulas] = useState([]);

    const [formData, setFormData] = useState({
        cedula: '',
        apellidos: '',
        nombres: '',
        fecha_nacimiento: '',
        genero: 'M',
        nacionalidad: 'ECUATORIANA',
        direccion: '',
        telefono: '',

        anio_id: '',
        curso_id: '',
        paralelo_id: '',
        aula_id: 0,
        es_repetidor: false,
        institucion_procedencia: '',

        padre: { cedula: '', nombres: '', telefono: '', profesion: '', lugar_trabajo: '', nivel_instruccion: '' },
        madre: { cedula: '', nombres: '', telefono: '', profesion: '', lugar_trabajo: '', nivel_instruccion: '' },
        representante: { cedula: '', nombres: '', telefono: '', profesion: '', lugar_trabajo: '', nivel_instruccion: '' },
        representante_rol: 'PADRE',

        peso: 0,
        talla: 0,
        discapacidad: false,
        detalles_discapacidad: ''
    });

    useEffect(() => {
        loadCatalogos();
    }, []);

    useEffect(() => {
        if (formData.anio_id) {
            loadAulas(parseInt(formData.anio_id));
        }
    }, [formData.anio_id]);

    useEffect(() => {
        if (formData.curso_id && formData.paralelo_id && aulas.length > 0) {
            const aula = aulas.find(a =>
                a.curso_id === parseInt(formData.curso_id) &&
                a.paralelo_id === parseInt(formData.paralelo_id)
            );
            if (aula) {
                setFormData(prev => ({ ...prev, aula_id: aula.id }));
            } else {
                setFormData(prev => ({ ...prev, aula_id: 0 }));
            }
        }
    }, [formData.curso_id, formData.paralelo_id, aulas]);

    const loadCatalogos = async () => {
        try {
            const [a, c, p] = await Promise.all([
                GetAniosLectivos(),
                GetCursos(),
                GetParalelos()
            ]);
            setAnios(a);
            setCursos(c);
            setParalelos(p);

            const active = a.find(y => y.Activo);
            if (active) setFormData(prev => ({ ...prev, anio_id: active.ID }));
        } catch (error) {
            toast.error("Error cargando catálogos");
        }
    };

    const loadAulas = async (anioId) => {
        try {
            const data = await GetAulasByAnio(anioId);
            setAulas(data || []);
        } catch (error) {
            console.error("Error cargando aulas", error);
        }
    };

    const handleInputChange = (e, section = null) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        if (section) {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [name]: val
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: val }));
        }
    };

    const validateStep = () => {
        if (step === 1) {
            if (!formData.cedula || !formData.apellidos || !formData.nombres || !formData.fecha_nacimiento) {
                toast.warning("Complete los campos obligatorios del estudiante");
                return false;
            }
        }
        if (step === 2) {
            if (!formData.aula_id) {
                toast.warning("Debe seleccionar un curso y paralelo válido (Aula abierta)");
                return false;
            }
        }
        if (step === 3) {
            if (formData.representante_rol === 'OTRO' && !formData.representante.nombres) {
                toast.warning("Si el representante es 'OTRO', debe llenar sus datos");
                return false;
            }
            if (formData.representante_rol === 'PADRE' && !formData.padre.nombres) {
                toast.warning("Ha seleccionado al PADRE como representante, pero no ha ingresado sus datos.");
                return false;
            }
            if (formData.representante_rol === 'MADRE' && !formData.madre.nombres) {
                toast.warning("Ha seleccionado a la MADRE como representante, pero no ha ingresado sus datos.");
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep()) setStep(s => s + 1);
    };

    const prevStep = () => setStep(s => s - 1);

    const handleSearch = async () => {
        if (!formData.cedula || formData.cedula.length < 10) {
            toast.warning("Ingrese una cédula válida para buscar");
            return;
        }

        const toastId = toast.loading("Buscando estudiante...");
        try {
            const student = await GetStudentByCedula(formData.cedula);
            if (student) {
                setIsExistingStudent(true);
                setFormData(prev => ({
                    ...prev,
                    ...student,
                    anio_id: prev.anio_id,
                    curso_id: '',
                    paralelo_id: '',
                    aula_id: 0,
                    es_repetidor: false,
                    institucion_procedencia: student.institucion_procedencia || ''
                }));
                toast.success("Estudiante encontrado. Modo: Actualización de Datos", { id: toastId });
            } else {
                setIsExistingStudent(false);
                toast.info("Estudiante nuevo. Proceda con el registro.", { id: toastId });
            }
        } catch (error) {
            setIsExistingStudent(false);
            toast.info("Estudiante no registrado. Proceda con el registro.", { id: toastId });
        }
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setLoading(true);
        const loadingToast = toast.loading(isExistingStudent ? "Actualizando matrícula..." : "Registrando estudiante...");

        try {
            const dto = {
                ...formData,
                peso: parseFloat(formData.peso),
                talla: parseFloat(formData.talla),
                aula_id: parseInt(formData.aula_id)
            };

            if (isExistingStudent) {
                await EnrollExistingStudent(dto);
                toast.success("Estudiante matriculado (actualizado) exitosamente");
            } else {
                await EnrollNewStudent(dto);
                toast.success("Estudiante matriculado exitosamente");
            }

            toast.dismiss(loadingToast);

            setStep(1);
            setIsExistingStudent(false);
            setFormData(prev => ({
                ...prev,
                cedula: '', apellidos: '', nombres: '',
                padre: { ...prev.padre, cedula: '', nombres: '' },
                madre: { ...prev.madre, cedula: '', nombres: '' },
                representante: { ...prev.representante, cedula: '', nombres: '' }
            }));

        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error("Error al matricular: " + error);
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-lg font-bold text-slate-800">Datos Personales</h3>
                </div>
                {isExistingStudent && <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold border border-blue-200">Modo: Re-inscripción</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Cédula <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            name="cedula"
                            value={formData.cedula}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm ${isExistingStudent ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
                            maxLength={10}
                            placeholder="Ej: 1712345678"
                            readOnly={isExistingStudent}
                            onBlur={() => !isExistingStudent && formData.cedula.length === 10 && handleSearch()}
                        />
                        {!isExistingStudent && (
                            <button
                                onClick={handleSearch}
                                className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                                title="Buscar Estudiante"
                            >
                                <User size={20} />
                            </button>
                        )}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Apellidos <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="apellidos"
                        value={formData.apellidos}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase text-sm"
                        placeholder="APELLIDOS COMPLETOS"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nombres <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="nombres"
                        value={formData.nombres}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase text-sm"
                        placeholder="NOMBRES COMPLETOS"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Fecha Nacimiento <span className="text-red-500">*</span></label>
                    <input
                        type="date"
                        name="fecha_nacimiento"
                        value={formData.fecha_nacimiento}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-600 cursor-pointer"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Género</label>
                    <div className="relative">
                        <select
                            name="genero"
                            value={formData.genero}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-sm"
                        >
                            <option value="M">Masculino</option>
                            <option value="F">Femenino</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nacionalidad</label>
                    <input
                        type="text"
                        name="nacionalidad"
                        value={formData.nacionalidad}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase text-sm"
                        placeholder="ECUATORIANA"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Dirección Domiciliaria</label>
                    <input
                        type="text"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        placeholder="Calle Principal, Nro, Sector"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Teléfono</label>
                    <input
                        type="text"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        placeholder="099..."
                    />
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <School className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-800">Datos Académicos</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Año Lectivo</label>
                    <select
                        name="anio_id"
                        value={formData.anio_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 focus:outline-none cursor-not-allowed"
                        disabled
                    >
                        {anios.map(a => <option key={a.ID} value={a.ID}>{a.Nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Curso <span className="text-red-500">*</span></label>
                    <select
                        name="curso_id"
                        value={formData.curso_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Seleccione...</option>
                        {cursos.map(c => <option key={c.ID} value={c.ID}>{c.Nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Paralelo <span className="text-red-500">*</span></label>
                    <select
                        name="paralelo_id"
                        value={formData.paralelo_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Seleccione...</option>
                        {paralelos.map(p => <option key={p.ID} value={p.ID}>{p.Nombre}</option>)}
                    </select>
                </div>

                <div className="md:col-span-3">
                    {formData.aula_id ? (
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in zoom-in duration-200">
                            <div className="bg-emerald-100 p-1 rounded-full">
                                <CheckCircle2 size={16} className="text-emerald-600" />
                            </div>
                            <span>Aula disponible y lista para asignación.</span>
                        </div>
                    ) : (
                        formData.curso_id && formData.paralelo_id && (
                            <div className="bg-amber-50 border border-amber-100 text-amber-700 p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in zoom-in duration-200">
                                <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                                <span>No existe un aula abierta para este curso y paralelo en el año seleccionado.</span>
                            </div>
                        )
                    )}
                </div>

                <div className="md:col-span-3 border-t border-slate-100 pt-4 mt-2">
                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors w-fit">
                        <input
                            type="checkbox"
                            name="es_repetidor"
                            checked={formData.es_repetidor}
                            onChange={handleInputChange}
                            className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-sm font-bold text-slate-700">Estudiante Repetidor</span>
                    </label>
                </div>

                <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Institución de Procedencia</label>
                    <input
                        type="text"
                        name="institucion_procedencia"
                        value={formData.institucion_procedencia}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                        placeholder="Dejar en blanco si es nuevo ingreso escolar"
                    />
                </div>
            </div>
        </div>
    );

    const renderFamiliarForm = (rol, label, dataKey) => (
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200/60">
                <Users className="w-4 h-4 text-indigo-500" />
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{label}</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cédula</label>
                    <input
                        type="text"
                        value={formData[dataKey].cedula}
                        onChange={(e) => handleInputChange(e, dataKey)}
                        name="cedula"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                        maxLength={10}
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombres Completos</label>
                    <input
                        type="text"
                        value={formData[dataKey].nombres}
                        onChange={(e) => handleInputChange(e, dataKey)}
                        name="nombres"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                    <input
                        type="text"
                        value={formData[dataKey].telefono}
                        onChange={(e) => handleInputChange(e, dataKey)}
                        name="telefono"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Profesión</label>
                    <input
                        type="text"
                        value={formData[dataKey].profesion}
                        onChange={(e) => handleInputChange(e, dataKey)}
                        name="profesion"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lugar Trabajo</label>
                    <input
                        type="text"
                        value={formData[dataKey].lugar_trabajo}
                        onChange={(e) => handleInputChange(e, dataKey)}
                        name="lugar_trabajo"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Users className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-800">Datos Familiares</h3>
            </div>

            {renderFamiliarForm('PADRE', 'Datos del Padre', 'padre')}
            {renderFamiliarForm('MADRE', 'Datos de la Madre', 'madre')}

            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                <label className="block text-xs font-bold text-indigo-800 uppercase mb-3 items-center gap-2">
                    <Info className="w-4 h-4" />
                    ¿Quién es el Representante Legal?
                </label>
                <div className="flex flex-wrap gap-3 mb-4">
                    {['PADRE', 'MADRE', 'OTRO'].map(rol => (
                        <label
                            key={rol}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${formData.representante_rol === rol
                                ? 'bg-white border-indigo-500 text-indigo-700 shadow-sm ring-1 ring-indigo-200'
                                : 'bg-white/50 border-indigo-200 text-slate-600 hover:bg-white'
                                }`}
                        >
                            <input
                                type="radio"
                                name="representante_rol"
                                value={rol}
                                checked={formData.representante_rol === rol}
                                onChange={handleInputChange}
                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span className="font-bold text-sm">{rol}</span>
                        </label>
                    ))}
                </div>

                {formData.representante_rol === 'OTRO' && renderFamiliarForm('REPRESENTANTE', 'Datos del Representante (Otro)', 'representante')}
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <HeartPulse className="w-5 h-5 text-rose-500" />
                <h3 className="text-lg font-bold text-slate-800">Salud y Bienestar</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Peso (kg)</label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            name="peso"
                            value={formData.peso}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                            placeholder="0.00"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">KG</span>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Talla (cm)</label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            name="talla"
                            value={formData.talla}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                            placeholder="0.00"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">CM</span>
                    </div>
                </div>

                <div className="md:col-span-2 border-t border-slate-100 pt-6">
                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors w-fit mb-4">
                        <input
                            type="checkbox"
                            name="discapacidad"
                            checked={formData.discapacidad}
                            onChange={handleInputChange}
                            className="w-5 h-5 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                        />
                        <span className="font-bold text-slate-700 text-sm">¿Tiene alguna discapacidad?</span>
                    </label>

                    {formData.discapacidad && (
                        <div className="animate-in fade-in slide-in-from-top-2 bg-rose-50 p-4 rounded-xl border border-rose-100">
                            <label className="block text-xs font-bold text-rose-800 uppercase mb-2 items-center gap-2">
                                <Info className="w-3.5 h-3.5" />
                                Detalles de Discapacidad (Tipo y %)
                            </label>
                            <textarea
                                name="detalles_discapacidad"
                                value={formData.detalles_discapacidad}
                                onChange={handleInputChange}
                                className="w-full p-3 bg-white border border-rose-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none h-24 placeholder:text-rose-300 text-slate-700"
                                placeholder="Ej: Visual 30%, Carnet CONADIS No. 12345..."
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-full w-full bg-slate-50/50 font-sans">

            <div className="mx-auto w-full flex flex-col gap-2">

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
                            <UserPlus className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Matriculación Estudiantil</h1>
                            <p className="text-sm text-slate-500 font-medium">
                                {isExistingStudent ? 'Actualización de Datos (Caso B)' : 'Registro Nuevo (Caso A)'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-1">
                        <button
                            onClick={prevStep}
                            disabled={step === 1 || loading}
                            className="p-2 rounded-md hover:bg-white hover:shadow-sm text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            title="Anterior"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="w-px h-5 bg-slate-200 mx-1"></div>
                        {step < 4 ? (
                            <button
                                onClick={nextStep}
                                className="p-2 rounded-md hover:bg-white hover:shadow-sm text-indigo-600 font-bold transition-all flex items-center gap-2"
                                title="Siguiente"
                            >
                                <ArrowRight size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="p-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 font-bold transition-all flex items-center gap-2 shadow-sm"
                                title="Finalizar"
                            >
                                <Save size={18} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
                    <div className="relative flex justify-between items-center z-10">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-100 rounded-full -z-10"></div>

                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-indigo-600 rounded-full transition-all duration-500 ease-out -z-10"
                            style={{ width: `${((step - 1) / 3) * 100}%` }}
                        ></div>

                        {[
                            { id: 1, icon: User, label: "Identificación" },
                            { id: 2, icon: School, label: "Académico" },
                            { id: 3, icon: Users, label: "Familia" },
                            { id: 4, icon: HeartPulse, label: "Salud" }
                        ].map((s) => {
                            const isActive = step >= s.id;
                            const isCurrent = step === s.id;

                            return (
                                <div key={s.id} className="flex flex-col items-center gap-2">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-4 border-white ${isActive
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110'
                                            : 'bg-slate-200 text-slate-400'
                                            }`}
                                    >
                                        <s.icon size={18} />
                                    </div>
                                    <span
                                        className={`text-xs font-bold transition-colors duration-300 ${isActive ? 'text-indigo-700' : 'text-slate-400'
                                            } ${isCurrent ? 'scale-105' : ''}`}
                                    >
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 min-h-100 flex flex-col">
                    <div className="flex-1">
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                        {step === 4 && renderStep4()}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StudentEnrollmentPage;