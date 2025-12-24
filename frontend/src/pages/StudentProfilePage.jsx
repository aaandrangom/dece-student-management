import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { 
    User, 
    Calendar, 
    Phone, 
    MapPin, 
    Users, 
    School, 
    FileText, 
    Activity, 
    Clock,
    Download,
    AlertTriangle,
    CheckCircle2,
    ArrowLeft,
    HeartPulse,
    UserCircle2,
    GraduationCap,
    Home,
    AlertCircle,
    Camera,
    ArrowRightLeft,
    UserX,
    X
} from 'lucide-react';

// Servicios
import { 
    GetStudentProfile, 
    GetAlternativeAulas, 
    ChangeStudentParallel, 
    WithdrawStudent, 
    UpdateStudentPhoto 
} from '../../wailsjs/go/student/StudentService';
import { GetDisciplineCases } from '../../wailsjs/go/welfare/DisciplineService';

const StudentProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [selectedYear, setSelectedYear] = useState(0);
    const [activeTab, setActiveTab] = useState('academic');
    const [disciplineCases, setDisciplineCases] = useState([]);

    // Administrative State
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [alternativeAulas, setAlternativeAulas] = useState([]);
    const [selectedAula, setSelectedAula] = useState('');
    const [withdrawReason, setWithdrawReason] = useState('');
    const [withdrawDate, setWithdrawDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (id) {
            loadProfile(parseInt(id), selectedYear);
        }
    }, [id, selectedYear]);

    const loadProfile = async (studentId, yearId) => {
        setLoading(true);
        try {
            const data = await GetStudentProfile(studentId, yearId);
            setProfile(data);
            
            // Si no había año seleccionado, seleccionar el del historial cargado
            if (yearId === 0 && data.historial_actual && data.historial_actual.Aula && data.historial_actual.Aula.AnioLectivo) {
                setSelectedYear(data.historial_actual.Aula.AnioLectivo.ID);
            }

            // Load Discipline Cases
            const cases = await GetDisciplineCases(studentId);
            setDisciplineCases(cases || []);
        } catch (error) {
            toast.error("Error cargando perfil: " + error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                await UpdateStudentPhoto(profile.estudiante.ID, e.target.result);
                toast.success("Foto actualizada");
                loadProfile(profile.estudiante.ID, selectedYear);
            } catch (err) {
                toast.error("Error al subir foto: " + err);
            }
        };
        reader.readAsDataURL(file);
    };

    const openTransferModal = async () => {
        if (!profile.historial_actual) return;
        try {
            const aulas = await GetAlternativeAulas(profile.historial_actual.ID);
            setAlternativeAulas(aulas || []);
            setShowTransferModal(true);
        } catch (err) {
            toast.error("Error al cargar paralelos: " + err);
        }
    };

    const handleTransfer = async () => {
        if (!selectedAula) return;
        try {
            await ChangeStudentParallel(profile.historial_actual.ID, parseInt(selectedAula));
            toast.success("Traslado realizado con éxito");
            setShowTransferModal(false);
            loadProfile(profile.estudiante.ID, selectedYear);
        } catch (err) {
            toast.error("Error en traslado: " + err);
        }
    };

    const handleWithdraw = async () => {
        if (!withdrawReason) return;
        try {
            await WithdrawStudent(profile.historial_actual.ID, withdrawReason, new Date(withdrawDate));
            toast.success("Estudiante dado de baja");
            setShowWithdrawModal(false);
            loadProfile(profile.estudiante.ID, selectedYear);
        } catch (err) {
            toast.error("Error al dar de baja: " + err);
        }
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return 0;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    if (loading && !profile) {
        return (
            <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                    <p className="text-slate-500 font-medium">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full">
                    <div className="bg-red-50 p-4 rounded-full inline-block mb-4">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Estudiante no encontrado</h3>
                    <p className="text-slate-500 mb-6">No pudimos localizar la información solicitada.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors w-full font-medium"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    const { estudiante, historial_actual, familiares, salud, anios_disponibles } = profile;
    const aula = historial_actual?.Aula;

    return (
        <div className="min-h-full w-full bg-slate-50/50 font-sans">

            <div className=" mx-auto w-full flex flex-col gap-6">

                {/* Header & Year Selector */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200 text-slate-500"
                            title="Volver"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
                            <User className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Perfil del Estudiante</h1>
                            <p className="text-sm text-slate-500 font-medium">Expediente académico y personal</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 w-full sm:w-auto">
                        <Clock className="text-slate-400 w-4 h-4" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">Año Lectivo:</span>
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="bg-transparent border-none text-slate-700 text-sm font-bold focus:ring-0 cursor-pointer p-0 pr-8 w-full sm:w-auto"
                        >
                            {anios_disponibles && anios_disponibles.map(anio => (
                                <option key={anio.id} value={anio.id}>
                                    {anio.nombre} {anio.activo ? '(Actual)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Admin Actions */}
                    <div className="flex gap-2">
                        <button 
                            onClick={openTransferModal}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                            title="Traslado Interno"
                        >
                            <ArrowRightLeft size={20} />
                        </button>
                        <button 
                            onClick={() => setShowWithdrawModal(true)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                            title="Dar de Baja"
                        >
                            <UserX size={20} />
                        </button>
                    </div>
                </div>

                {/* Withdrawal Alert */}
                {historial_actual?.Estado === 'RETIRADO' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-4">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <UserX className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-red-800">Estudiante Retirado</h3>
                            <p className="text-red-600 mt-1">
                                Este estudiante fue dado de baja el <span className="font-semibold">{historial_actual.FechaRetiro ? new Date(historial_actual.FechaRetiro).toLocaleDateString() : 'Fecha desconocida'}</span>.
                            </p>
                            {historial_actual.MotivoRetiro && (
                                <p className="text-red-600 text-sm mt-1">
                                    <span className="font-semibold">Motivo:</span> {historial_actual.MotivoRetiro}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column: Personal Info */}
                    <div className="space-y-6">
                        
                        {/* Personal Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative h-full flex flex-col">
                            <div className="h-32 bg-gradient-to-r from-indigo-600 to-blue-500 relative shrink-0">
                                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 group cursor-pointer z-10">
                                    <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center relative">
                                        {estudiante.FotoPerfilPath ? (
                                            <img src={estudiante.FotoPerfilPath} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-2xl">
                                                {estudiante.Nombres.charAt(0)}{estudiante.Apellidos.charAt(0)}
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="text-white" size={24} />
                                        </div>
                                    </div>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handlePhotoUpload}
                                        title="Cambiar foto de perfil"
                                    />
                                </div>
                            </div>
                            
                            <div className="pt-16 pb-6 px-6 text-center flex-1 flex flex-col">
                                <h2 className="text-lg font-bold text-slate-800 uppercase leading-tight">{estudiante.Apellidos} {estudiante.Nombres}</h2>
                                <p className="text-slate-500 text-sm font-mono mt-1 bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-100">{estudiante.Cedula}</p>
                                
                                <div className="flex justify-center gap-3 mt-4">
                                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                                        {calculateAge(estudiante.FechaNacimiento)} Años
                                    </span>
                                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase border border-slate-200">
                                        {estudiante.Genero === 'M' ? 'Masculino' : 'Femenino'}
                                    </span>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-100 space-y-4 text-left flex-1">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Nacimiento</p>
                                            <p className="text-sm font-medium text-slate-700">{new Date(estudiante.FechaNacimiento).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Dirección</p>
                                            <p className="text-sm font-medium text-slate-700 uppercase leading-snug">{historial_actual?.DireccionDomicilio || 'Sin dirección'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Contacto</p>
                                            <p className="text-sm font-medium text-slate-700">{historial_actual?.TelefonoContacto || 'Sin teléfono'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Tabs & Content (2 cols wide) */}
                    <div className="lg:col-span-2 flex flex-col gap-6 h-full">
                        
                        {/* Tabs Navigation */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 flex overflow-x-auto shrink-0">
                            {[
                                { id: 'academic', label: 'Información Académica', icon: School },
                                { id: 'family', label: 'Grupo Familiar', icon: Users },
                                { id: 'health', label: 'Salud y Bienestar', icon: HeartPulse },
                                { id: 'discipline', label: 'Disciplina', icon: AlertTriangle, count: disciplineCases.length },
                                { id: 'docs', label: 'Documentación', icon: FileText },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap relative ${
                                        activeTab === tab.id 
                                        ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className="ml-1 bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full border border-red-200">
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content Area */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-1 min-h-[400px]">
                            
                            {/* ACADEMIC TAB */}
                            {activeTab === 'academic' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {historial_actual ? (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="p-5 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-100 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
                                                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide block mb-2">Ubicación Actual</span>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                                                            <School size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-lg font-bold text-slate-800 leading-none">
                                                                {aula?.Curso?.Nombre} "{aula?.Paralelo?.Nombre}"
                                                            </p>
                                                            <p className="text-xs text-slate-500 font-medium mt-1">Año Lectivo {aula?.AnioLectivo?.Nombre}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-5 bg-white border border-slate-200 rounded-xl">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-3">Tutor / Dirigente</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200">
                                                            {aula?.TutorDocente ? <UserCircle2 size={20} /> : <User size={20} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">
                                                                {aula?.TutorDocente ? `${aula.TutorDocente.Nombres} ${aula.TutorDocente.Apellidos}` : 'Sin Asignar'}
                                                            </p>
                                                            <p className="text-xs text-slate-500 font-medium">Docente Encargado</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 border border-slate-200 rounded-xl bg-slate-50/50">
                                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                                                    <GraduationCap className="w-4 h-4 text-amber-500" />
                                                    Estado Académico
                                                </h4>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                                        <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Condición</span>
                                                        <span className={`text-sm font-bold px-2 py-0.5 rounded ${historial_actual.HaRepetido ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                            {historial_actual.HaRepetido ? 'REPETIDOR' : 'REGULAR'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                                        <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo Ingreso</span>
                                                        <span className={`text-sm font-bold ${historial_actual.EsNuevo ? 'text-blue-600' : 'text-slate-700'}`}>
                                                            {historial_actual.EsNuevo ? 'NUEVO INGRESO' : 'ANTIGUO'}
                                                        </span>
                                                    </div>

                                                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                                        <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Procedencia</span>
                                                        <span className="text-sm font-bold text-slate-700 uppercase truncate block" title={historial_actual.InstitucionProcedencia}>
                                                            {historial_actual.InstitucionProcedencia || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <School size={48} className="mb-3 opacity-20" />
                                            <p className="font-medium text-sm">No hay historial académico para este año.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* FAMILY TAB */}
                            {activeTab === 'family' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {familiares && familiares.map(fam => (
                                            <div key={fam.ID} className={`p-4 rounded-xl border transition-all hover:shadow-md ${fam.EsRepresentanteLegal ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-white px-2 py-1 rounded border border-slate-100">{fam.Rol}</span>
                                                    {fam.EsRepresentanteLegal && (
                                                        <span className="bg-indigo-600 text-white text-[10px] px-2 py-1 rounded-lg font-bold shadow-sm flex items-center gap-1">
                                                            <CheckCircle2 size={10} /> REPRESENTANTE
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-bold text-slate-800 text-base uppercase leading-snug mb-1">{fam.NombresCompletos}</p>
                                                <p className="text-xs text-slate-400 font-mono mb-3">{fam.Cedula}</p>
                                                
                                                <div className="flex items-center gap-4 pt-3 border-t border-slate-100/50">
                                                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                                        <Phone size={14} className="text-indigo-400" /> 
                                                        {fam.Telefono || 'Sin teléfono'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(!familiares || familiares.length === 0) && (
                                            <div className="col-span-2 text-center py-12 text-slate-400">
                                                <Users size={48} className="mx-auto mb-4 opacity-50" />
                                                <p>No hay familiares registrados.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* HEALTH TAB */}
                            {activeTab === 'health' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    {salud ? (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                {/* Antropometría */}
                                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                                    <h4 className="font-bold text-slate-700 mb-4 text-xs uppercase tracking-wide flex items-center gap-2">
                                                        <Activity className="w-4 h-4 text-blue-500" />
                                                        Datos Antropométricos
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-slate-50 p-3 rounded-lg text-center">
                                                            <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Peso</span>
                                                            <span className="text-2xl font-black text-slate-800">{historial_actual?.Peso || 0}</span>
                                                            <span className="text-xs text-slate-400 font-medium ml-1">kg</span>
                                                        </div>
                                                        <div className="bg-slate-50 p-3 rounded-lg text-center">
                                                            <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Talla</span>
                                                            <span className="text-2xl font-black text-slate-800">{historial_actual?.Talla || 0}</span>
                                                            <span className="text-xs text-slate-400 font-medium ml-1">cm</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Discapacidad */}
                                                <div className={`p-5 rounded-xl border shadow-sm flex flex-col justify-center ${salud.Discapacidad ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={`p-2 rounded-full ${salud.Discapacidad ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                            {salud.Discapacidad ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                                                        </div>
                                                        <div>
                                                            <h4 className={`font-bold text-sm uppercase ${salud.Discapacidad ? 'text-rose-800' : 'text-emerald-800'}`}>
                                                                Condición de Discapacidad
                                                            </h4>
                                                            <p className={`text-xs font-medium ${salud.Discapacidad ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                                {salud.Discapacidad ? 'SI PRESENTA' : 'NO PRESENTA'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    {salud.Discapacidad && (
                                                        <div className="mt-3 bg-white/60 p-3 rounded-lg border border-rose-100">
                                                            <p className="text-xs text-rose-800 font-medium leading-relaxed">
                                                                {salud.DetallesDiscapacidad || "Sin detalles especificados"}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Info Adicional */}
                                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                                <h4 className="font-bold text-slate-700 mb-4 text-xs uppercase tracking-wide flex items-center gap-2">
                                                    <HeartPulse className="w-4 h-4 text-rose-500" />
                                                    Antecedentes Médicos
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Alergias Conocidas</span>
                                                        <p className="text-sm font-medium text-slate-700 bg-white p-3 rounded-lg border border-slate-100 min-h-[3rem]">
                                                            {salud.Alergias || 'Ninguna registrada'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Enfermedades Preexistentes</span>
                                                        <p className="text-sm font-medium text-slate-700 bg-white p-3 rounded-lg border border-slate-100 min-h-[3rem]">
                                                            {salud.Enfermedades || 'Ninguna registrada'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <Activity size={48} className="mb-3 opacity-20" />
                                            <p className="text-sm font-medium">No hay ficha de salud registrada.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* DISCIPLINE TAB */}
                            {activeTab === 'discipline' && (
                                <div className="animate-in fade-in duration-300 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                                            Historial Disciplinario
                                        </h3>
                                        <button 
                                            onClick={() => navigate('/dece/discipline')}
                                            className="text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors font-bold border border-orange-200"
                                        >
                                            Gestionar Casos
                                        </button>
                                    </div>

                                    {disciplineCases.length > 0 ? (
                                        <div className="space-y-3">
                                            {disciplineCases.map(c => (
                                                <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-orange-300 transition-all">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${
                                                            c.gravedad === 'LEVE' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                            c.gravedad === 'GRAVE' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                            'bg-red-100 text-red-700 border-red-200'
                                                        }`}>
                                                            {c.gravedad}
                                                        </span>
                                                        <span className="text-xs text-slate-400 font-mono">
                                                            {new Date(c.fecha).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-800 mb-2">{c.descripcion_motivo}</p>
                                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <span className={`w-2 h-2 rounded-full ${c.estado === 'CERRADO' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                            {c.estado}
                                                        </span>
                                                        {c.resolucion && (
                                                            <span className="truncate max-w-[200px]" title={c.resolucion}>
                                                                Resolución: {c.resolucion}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <CheckCircle2 size={48} className="mb-3 opacity-20 text-emerald-500" />
                                            <p className="text-sm font-medium">Sin faltas registradas.</p>
                                            <p className="text-xs">Excelente conducta.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* DOCUMENTS TAB */}
                            {activeTab === 'docs' && (
                                <div className="animate-in fade-in duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[
                                            { label: 'Croquis Domiciliario', path: historial_actual?.CroquisPath, type: 'map' },
                                            { label: 'Cédula Escaneada', path: null, type: 'id' },
                                            { label: 'Ficha de Matrícula', path: null, type: 'form' },
                                        ].map((doc, idx) => (
                                            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all group cursor-pointer">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                        {doc.type === 'map' ? <MapPin size={20} /> : <FileText size={20} />}
                                                    </div>
                                                    {doc.path ? (
                                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">DISPONIBLE</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">PENDIENTE</span>
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-slate-700 text-sm mb-1">{doc.label}</h4>
                                                <p className="text-xs text-slate-400">Documento Digital</p>
                                                
                                                {doc.path && (
                                                    <button className="mt-4 w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                                                        <Download size={14} /> Descargar
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* Transfer Modal */}
            {showTransferModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <ArrowRightLeft className="text-blue-600" size={20} />
                                Traslado Interno
                            </h3>
                            <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            Seleccione el nuevo paralelo para el estudiante en el curso actual.
                        </p>
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nuevo Paralelo</label>
                            <select 
                                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={selectedAula}
                                onChange={(e) => setSelectedAula(e.target.value)}
                            >
                                <option value="">Seleccione...</option>
                                {alternativeAulas && alternativeAulas.map(a => (
                                    <option key={a.id} value={a.id}>Paralelo {a.paralelo}</option>
                                ))}
                            </select>
                            {(!alternativeAulas || alternativeAulas.length === 0) && (
                                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                    <AlertCircle size={12} /> No hay otros paralelos disponibles.
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowTransferModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm">Cancelar</button>
                            <button 
                                onClick={handleTransfer} 
                                disabled={!selectedAula}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirmar Traslado
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                                <UserX size={20} /> Dar de Baja
                            </h3>
                            <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            Esta acción marcará al estudiante como "RETIRADO". El registro no se eliminará.
                        </p>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha de Retiro</label>
                                <input 
                                    type="date" 
                                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                    value={withdrawDate}
                                    onChange={(e) => setWithdrawDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivo</label>
                                <textarea 
                                    className="w-full p-2.5 border border-slate-200 rounded-lg h-24 resize-none text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                    placeholder="Especifique el motivo del retiro..."
                                    value={withdrawReason}
                                    onChange={(e) => setWithdrawReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowWithdrawModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm">Cancelar</button>
                            <button 
                                onClick={handleWithdraw} 
                                disabled={!withdrawReason}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirmar Baja
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentProfilePage;