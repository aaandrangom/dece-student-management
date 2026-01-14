import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    User, MapPin, Camera, Save, ArrowLeft, Users,
    FileText, Check, ChevronRight, Edit, Trash2,
    Plus, AlertCircle
} from 'lucide-react';
import {
    GuardarEstudiante, GuardarFoto, GuardarFotoBase64,
    ObtenerEstudiante, ObtenerFotoBase64, GuardarDocumentoPDF, ObtenerDocumentoPDF
} from '../../../wailsjs/go/services/StudentService';

const calculateAge = (dateString) => {
    if (!dateString) return '-';
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
};

const generateTempId = () => -Date.now();
const LS_KEY = 'student_form_backup';

export default function StudentFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const studentId = id ? parseInt(id) : 0;

    // Función helper para regresar
    const onBack = () => navigate('/estudiantes/listado-general');

    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const [tempPhotoPath, setTempPhotoPath] = useState(null);
    const [tempPhotoFile, setTempPhotoFile] = useState(null);
    const [photoChanged, setPhotoChanged] = useState(false);
    const [originalRuta, setOriginalRuta] = useState('');

    const [pdfCedulaFile, setPdfCedulaFile] = useState(null);
    const [pdfPartidaFile, setPdfPartidaFile] = useState(null);
    const [hasCedula, setHasCedula] = useState(false);
    const [hasPartida, setHasPartida] = useState(false);
    const [viewPdfUrl, setViewPdfUrl] = useState(null);

    const [isEditingFamily, setIsEditingFamily] = useState(false);
    const [familyFormData, setFamilyFormData] = useState(null);

    const steps = [
        { id: 1, label: 'Información Personal', icon: User },
        { id: 2, label: 'Núcleo Familiar', icon: Users },
        { id: 3, label: 'Resumen y Finalizar', icon: FileText }
    ];

    const initialFamilyState = {
        id: 0,
        uiId: 0,
        estudiante_id: 0,
        cedula: '',
        nombres_completos: '',
        parentesco: 'Padre',
        es_representante_legal: false,
        vive_con_estudiante: true,
        telefono_personal: '',
        fallecido: false,
        datos_extendidos: {
            nivel_instruccion: 'Bachiller',
            profesion: '',
            lugar_trabajo: ''
        }
    };

    const [formData, setFormData] = useState({
        id: 0,
        cedula: '',
        apellidos: '',
        nombres: '',
        fecha_nacimiento: '',
        genero_nacimiento: 'M',
        correo_electronico: '',
        ruta_foto: '',
        info_nacionalidad: {
            es_extranjero: false,
            pais_origen: 'Ecuador',
            pasaporte_odni: ''
        },
        familiares: []
    });

    useEffect(() => {
        if (studentId === 0) {
            const savedData = localStorage.getItem(LS_KEY);
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    if (parsed && (parsed.cedula || parsed.apellidos)) {
                        setFormData(parsed);
                        toast.info("Datos restaurados del navegador.");
                    }
                } catch (e) {
                    console.error("Error parsing local storage", e);
                }
            }
        } else {
            loadStudent(studentId);
        }
    }, [studentId]);

    useEffect(() => {
        if (studentId === 0) {
            const hasData = formData.cedula.trim() !== '' ||
                formData.apellidos.trim() !== '' ||
                formData.nombres.trim() !== '';

            if (hasData) {
                localStorage.setItem(LS_KEY, JSON.stringify(formData));
            } else {
                localStorage.removeItem(LS_KEY);
            }
        }
    }, [formData, studentId]);

    const clearLocalStorage = () => {
        localStorage.removeItem(LS_KEY);
    };

    const getImageSrc = () => {
        if (tempPhotoPath) return tempPhotoPath;
        return null;
    };

    const loadStudent = async (id) => {
        setIsLoading(true);
        try {
            const data = await ObtenerEstudiante(id);

            console.log("Datos recibidos del backend:", data);
            console.log("info_nacionalidad original:", data.info_nacionalidad);

            let infoNac = { es_extranjero: false, pais_origen: 'Ecuador', pasaporte_odni: '' };

            if (data.info_nacionalidad) {
                if (data.info_nacionalidad.Data) {
                    infoNac = data.info_nacionalidad.Data;
                }
                else if (data.info_nacionalidad.data) {
                    infoNac = data.info_nacionalidad.data;
                }
                else if (typeof data.info_nacionalidad === 'object' && data.info_nacionalidad.es_extranjero !== undefined) {
                    infoNac = data.info_nacionalidad;
                }
                else if (typeof data.info_nacionalidad === 'string') {
                    try {
                        const parsed = JSON.parse(data.info_nacionalidad);
                        infoNac = parsed.Data || parsed.data || parsed;
                    } catch (e) {
                        console.error("Error parseando info_nacionalidad:", e);
                    }
                }
            }

            data.info_nacionalidad = infoNac;
            console.log("info_nacionalidad después de procesar:", data.info_nacionalidad);

            if (!data.familiares) {
                data.familiares = [];
            } else {
                data.familiares = data.familiares.map(f => {
                    let datosExt = { nivel_instruccion: 'Bachiller', profesion: '', lugar_trabajo: '' };
                    if (f.datos_extendidos) {
                        if (f.datos_extendidos.Data) {
                            datosExt = f.datos_extendidos.Data;
                        } else if (f.datos_extendidos.data) {
                            datosExt = f.datos_extendidos.data;
                        } else if (typeof f.datos_extendidos === 'object') {
                            datosExt = f.datos_extendidos;
                        }
                    }
                    return { ...f, uiId: f.id, datos_extendidos: datosExt };
                });
            }

            setFormData(data);
            setOriginalRuta(data.ruta_foto || '');
            setHasCedula(!!data.ruta_cedula);
            setHasPartida(!!data.ruta_partida_nacimiento);

            if (data.ruta_foto) {
                try {
                    const b64 = await ObtenerFotoBase64(data.id);
                    if (b64 && b64.length > 0) {
                        setTempPhotoPath(b64);
                        setPhotoChanged(false);
                    }
                } catch (err) {
                    console.log("No se pudo cargar la imagen base64:", err);
                }
            }

        } catch (err) {
            toast.error("Error cargando datos");
            onBack();
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNacionalidadChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => ({
            ...prev,
            info_nacionalidad: { ...prev.info_nacionalidad, [name]: val }
        }));
    };

    const handlePdfSelect = (type) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.onchange = () => {
            const files = input.files;
            if (!files || files.length === 0) return;
            const file = files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB limit example
                return toast.warning("El archivo es demasiado grande (Máx 5MB)");
            }

            if (type === 'cedula') {
                setPdfCedulaFile(file);
            } else {
                setPdfPartidaFile(file);
            }
            toast.success(`PDF de ${type === 'cedula' ? 'Cédula' : 'Partida'} seleccionado`);
        };
        input.click();
    };

    const handleViewPdf = async (type, e) => {
        if (e) e.stopPropagation();

        // Prioridad: archivo recién seleccionado
        if (type === 'cedula' && pdfCedulaFile) {
            setViewPdfUrl(URL.createObjectURL(pdfCedulaFile));
            return;
        }
        if (type === 'partida' && pdfPartidaFile) {
            setViewPdfUrl(URL.createObjectURL(pdfPartidaFile));
            return;
        }

        // Si no hay archivo nuevo, intentar cargar del backend
        if (studentId > 0) {
            if ((type === 'cedula' && !hasCedula) || (type === 'partida' && !hasPartida)) {
                return toast.info("No hay documento cargado para visualizar");
            }

            try {
                toast.loading("Cargando documento...");
                const b64 = await ObtenerDocumentoPDF(studentId, type);
                toast.dismiss();
                if (b64) setViewPdfUrl(b64);
            } catch (err) {
                toast.dismiss();
                toast.error("Error cargando documento: " + err);
            }
        }
    };

    const handlePhotoSelect = async () => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.jpg,.jpeg,.png,image/*';
            input.onchange = async () => {
                const files = input.files;
                if (!files || files.length === 0) return;
                const file = files[0];

                const url = URL.createObjectURL(file);
                setTempPhotoPath(url);
                setTempPhotoFile(file);
                setPhotoChanged(true);
            };
            input.click();
        } catch (err) {
            toast.error('Error seleccionando archivo');
        }
    };

    const handleNextStep = () => {
        if (currentStep === 1) {
            if (!formData.apellidos || !formData.nombres) {
                return toast.warning("Nombres y Apellidos son requeridos");
            }
            if (!formData.info_nacionalidad.es_extranjero && (!formData.cedula || formData.cedula.length !== 10)) {
                return toast.warning("Cédula inválida");
            }

            // Validación de documentos (Al menos uno requerido)
            const cedulaPresent = hasCedula || pdfCedulaFile;
            const partidaPresent = hasPartida || pdfPartidaFile;

            if (!cedulaPresent && !partidaPresent) {
                return toast.warning("Debe subir al menos un documento (Cédula o Partida de Nacimiento)");
            }
        }
        setCurrentStep(prev => prev + 1);
    };

    const initFamilyForm = (familiar = null) => {
        if (familiar) {
            const datosExt = familiar.datos_extendidos?.data || initialFamilyState.datos_extendidos;
            setFamilyFormData({ ...familiar, datos_extendidos: datosExt });
        } else {
            setFamilyFormData({ ...initialFamilyState, estudiante_id: formData.id, uiId: generateTempId() });
        }
        setIsEditingFamily(true);
    };

    const handleFamilyInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        if (name.startsWith('ext_')) {
            const field = name.replace('ext_', '');
            setFamilyFormData(prev => ({ ...prev, datos_extendidos: { ...prev.datos_extendidos, [field]: val } }));
        } else {
            setFamilyFormData(prev => ({ ...prev, [name]: val }));
        }
    };

    const saveLocalFamiliar = () => {
        if (!familyFormData.nombres_completos || !familyFormData.parentesco) return toast.warning("Datos requeridos");

        let currentFamiliares = [...formData.familiares];
        if (familyFormData.es_representante_legal) {
            currentFamiliares = currentFamiliares.map(f => ({ ...f, es_representante_legal: false }));
        }

        const existingIndex = currentFamiliares.findIndex(f => (f.id > 0 && f.id === familyFormData.id) || (f.uiId && f.uiId === familyFormData.uiId));

        if (existingIndex >= 0) {
            currentFamiliares[existingIndex] = familyFormData;
            toast.success("Modificado");
        } else {
            currentFamiliares.push(familyFormData);
            toast.success("Agregado");
        }
        setFormData(prev => ({ ...prev, familiares: currentFamiliares }));
        setIsEditingFamily(false);
    };

    const deleteLocalFamiliar = (fam) => {
        if (!confirm("¿Eliminar?")) return;
        const newFamiliares = formData.familiares.filter(f => !((f.id > 0 && f.id === fam.id) || (f.uiId && f.uiId === fam.uiId)));
        setFormData(prev => ({ ...prev, familiares: newFamiliares }));
        toast.info("Eliminado");
    };

    const handleFinalTransaction = async () => {
        try {
            setIsLoading(true);

            const infoNac = formData.info_nacionalidad || {
                es_extranjero: false,
                pais_origen: 'Ecuador',
                pasaporte_odni: ''
            };

            const payload = {
                ...formData,
                es_extranjero: infoNac.es_extranjero,
                pais_origen: infoNac.pais_origen,
                pasaporte_odni: infoNac.pasaporte_odni
            };

            delete payload.info_nacionalidad;

            if (studentId > 0 && !photoChanged) {
                payload.ruta_foto = originalRuta || payload.ruta_foto || '';
            }

            const savedStudent = await GuardarEstudiante(payload);

            if (savedStudent.id > 0 && photoChanged) {
                if (tempPhotoFile) {
                    const b64 = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(tempPhotoFile);
                    });
                    try {
                        const newPath = await GuardarFotoBase64(savedStudent.id, b64, tempPhotoFile.name);
                        if (newPath) {
                            setOriginalRuta(newPath);
                            setFormData(prev => ({ ...prev, ruta_foto: newPath }));
                        }
                    } catch (e) {
                        console.error('Error subiendo foto base64', e);
                    }
                } else if (tempPhotoPath && !tempPhotoPath.startsWith('blob:')) {
                    try {
                        const newPath = await GuardarFoto(savedStudent.id, tempPhotoPath);
                        if (newPath) {
                            setOriginalRuta(newPath);
                            setFormData(prev => ({ ...prev, ruta_foto: newPath }));
                        }
                    } catch (e) {
                        console.error('Error subiendo foto por path', e);
                    }
                }
                setPhotoChanged(false);
                setTempPhotoFile(null);
            }

            // Subir Documentos PDF
            const uploadPdf = async (file, type) => {
                const b64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                await GuardarDocumentoPDF(savedStudent.id, type, b64);
            };

            if (pdfCedulaFile) {
                try {
                    await uploadPdf(pdfCedulaFile, 'cedula');
                } catch (e) { console.error("Error guardando cédula pdf", e); toast.error("Error guardando cédula"); }
            }
            if (pdfPartidaFile) {
                try {
                    await uploadPdf(pdfPartidaFile, 'partida');
                } catch (e) { console.error("Error guardando partida pdf", e); toast.error("Error guardando partida"); }
            }

            if (studentId === 0) clearLocalStorage();

            toast.success("¡Guardado correctamente!");
            onBack();
        } catch (err) {
            toast.error("Error: " + err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans">
            {viewPdfUrl && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full h-full max-w-6xl rounded-xl flex flex-col shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" /> Visor de Documentos
                            </h3>
                            <button
                                onClick={() => setViewPdfUrl(null)}
                                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-100 relative">
                            <iframe
                                title="Visor PDF"
                                src={viewPdfUrl}
                                className="w-full h-full absolute inset-0 border-none"
                            />
                        </div>
                    </div>
                </div>
            )}
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">
                                    {studentId > 0 ? 'Editar Estudiante' : 'Nuevo Estudiante'}
                                </h1>
                                <p className="text-slate-500 text-sm">Registro Integral</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={onBack} className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancelar</button>
                            {currentStep > 1 && (
                                <button onClick={() => setCurrentStep(prev => prev - 1)} className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium">Anterior</button>
                            )}
                            {currentStep < steps.length ? (
                                <button onClick={handleNextStep} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
                                    Siguiente <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button onClick={handleFinalTransaction} disabled={isLoading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all">
                                    <Save className="w-4 h-4" /> {isLoading ? 'Guardando...' : 'Guardar Todo'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8 p-8">
                    <div className="flex items-center w-full">
                        {steps.map((step, index) => {
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;
                            const isLast = index === steps.length - 1;
                            const StepIcon = step.icon;
                            return (
                                <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center relative z-10 min-w-30">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${isActive ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-50' : isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                                            {isCompleted ? <Check className="w-7 h-7" /> : <StepIcon className="w-6 h-6" />}
                                        </div>
                                        <span className={`mt-3 text-sm font-bold text-center ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-400'}`}>{step.label}</span>
                                    </div>
                                    {!isLast && (
                                        <div className="flex-1 h-1 mx-4 bg-slate-100 rounded mb-8">
                                            <div className={`h-full bg-green-500 transition-all duration-500 ${currentStep > step.id ? 'w-full' : 'w-0'}`} />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                    {currentStep === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-1">
                                <div className="sticky top-6">
                                    <label className="block text-sm font-bold text-slate-700 mb-3">Foto de Perfil</label>
                                    <div onClick={handlePhotoSelect} className="relative w-full aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-slate-300 bg-slate-50 hover:border-blue-500 hover:shadow-lg transition-all flex flex-col items-center justify-center group">
                                        {getImageSrc() ? (
                                            <><img src={getImageSrc()} alt="Estudiante" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><div className="bg-white/90 px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 flex items-center gap-2 shadow-sm"><Camera className="w-4 h-4" /> Cambiar</div></div></>
                                        ) : (
                                            <div className="text-center p-4"><div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:text-blue-500 transition-colors"><Camera className="w-8 h-8" /></div><p className="text-sm font-bold text-slate-600">Subir Imagen</p></div>
                                        )}
                                    </div>
                                    {studentId === 0 && <p className="text-xs text-slate-400 text-center mt-3">Guardado automático activado.</p>}

                                    <div className="mt-8 border-t border-slate-200 pt-6">
                                        <h3 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> Documentación Digital
                                        </h3>

                                        {/* Cédula */}
                                        <div className="mb-4">
                                            <label className="block text-xs font-bold text-slate-600 mb-2">Cédula de Identidad (PDF)</label>
                                            <div
                                                onClick={() => handlePdfSelect('cedula')}
                                                className={`p-3 rounded-lg border-2 border-dashed flex items-center gap-3 cursor-pointer transition-colors ${hasCedula || pdfCedulaFile ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-blue-400'}`}
                                            >
                                                <div className={`p-2 rounded-full ${hasCedula || pdfCedulaFile ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-sm font-bold text-slate-700 truncate">
                                                        {pdfCedulaFile ? pdfCedulaFile.name : (hasCedula ? 'Documento cargado' : 'Subir archivo')}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {pdfCedulaFile ? 'Listo para guardar' : (hasCedula ? 'Disponible en servidor' : 'Click para seleccionar')}
                                                    </p>
                                                </div>
                                                {(hasCedula || pdfCedulaFile) && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => handleViewPdf('cedula', e)}
                                                            className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                                            title="Ver Documento"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                        <Check className="w-5 h-5 text-green-600" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Partida */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">Partida de Nacimiento (PDF)</label>
                                            <div
                                                onClick={() => handlePdfSelect('partida')}
                                                className={`p-3 rounded-lg border-2 border-dashed flex items-center gap-3 cursor-pointer transition-colors ${hasPartida || pdfPartidaFile ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-blue-400'}`}
                                            >
                                                <div className={`p-2 rounded-full ${hasPartida || pdfPartidaFile ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-sm font-bold text-slate-700 truncate">
                                                        {pdfPartidaFile ? pdfPartidaFile.name : (hasPartida ? 'Documento cargado' : 'Subir archivo')}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {pdfPartidaFile ? 'Listo para guardar' : (hasPartida ? 'Disponible en servidor' : 'Click para seleccionar')}
                                                    </p>
                                                </div>
                                                {(hasPartida || pdfPartidaFile) && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => handleViewPdf('partida', e)}
                                                            className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                                            title="Ver Documento"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                        <Check className="w-5 h-5 text-green-600" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-400 mt-3 text-center bg-yellow-50  p-2 rounded">
                                            <AlertCircle className="w-3 h-3 inline mr-1" />
                                            Al menos uno es obligatorio.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-6">
                                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center gap-2"><MapPin className="w-4 h-4" /> Identificación</h3>
                                    <div className="mb-4">
                                        <label className="inline-flex items-center gap-2 cursor-pointer"><input type="checkbox" name="es_extranjero" checked={formData.info_nacionalidad.es_extranjero} onChange={handleNacionalidadChange} className="w-4 h-4 text-blue-600 rounded" /><span className="text-sm font-medium text-slate-700">¿Es Extranjero?</span></label>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {!formData.info_nacionalidad.es_extranjero ? (
                                            <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cédula</label><input type="text" name="cedula" value={formData.cedula} onChange={handleInputChange} maxLength={10} className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ingrese cédula" /></div>
                                        ) : (
                                            <><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pasaporte</label><input type="text" name="pasaporte_odni" value={formData.info_nacionalidad.pasaporte_odni} onChange={handleNacionalidadChange} className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">País</label><select name="pais_origen" value={formData.info_nacionalidad.pais_origen} onChange={handleNacionalidadChange} className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"><option value="">Seleccione...</option><option value="Colombia">Colombia</option><option value="Venezuela">Venezuela</option><option value="Perú">Perú</option><option value="Otro">Otro</option></select></div></>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center gap-2"><User className="w-4 h-4" /> Datos Biográficos</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Apellidos</label><input type="text" name="apellidos" value={formData.apellidos} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombres</label><input type="text" name="nombres" value={formData.nombres} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nacimiento</label>
                                            <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                            {formData.fecha_nacimiento && (
                                                <p className="text-xs text-blue-600 font-bold mt-1 text-right">
                                                    Tiene {calculateAge(formData.fecha_nacimiento)} años
                                                </p>
                                            )}
                                        </div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Género</label><div className="flex bg-white rounded-lg border border-slate-300 overflow-hidden">{['M', 'F'].map(g => (<button key={g} type="button" onClick={() => setFormData(prev => ({ ...prev, genero_nacimiento: g }))} className={`flex-1 py-2.5 text-sm font-medium transition-colors ${formData.genero_nacimiento === g ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{g === 'M' ? 'Masculino' : 'Femenino'}</button>))}</div></div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correo Electrónico</label>
                                        <input type="email" name="correo_electronico" value={formData.correo_electronico || ''} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ejemplo@correo.com" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> Listado de Familiares</h2>
                                {!isEditingFamily && (<button onClick={() => initFamilyForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2 shadow-sm"><Plus className="w-4 h-4" /> Agregar Familiar</button>)}
                            </div>
                            {!isEditingFamily && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {formData.familiares && formData.familiares.length > 0 ? (formData.familiares.map((fam, idx) => (
                                        <div key={fam.uiId || fam.id || idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div><span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded mb-2 uppercase tracking-wide">{fam.parentesco}</span>{fam.es_representante_legal && (<span className="ml-2 inline-block px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded mb-2 border border-green-200">Repr.</span>)}</div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => initFamilyForm(fam)} className="p-1 text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button><button onClick={() => deleteLocalFamiliar(fam)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div>
                                            </div>
                                            <h4 className="font-bold text-slate-800 truncate">{fam.nombres_completos}</h4>
                                            <p className="text-sm text-slate-500">{fam.cedula || 'S/N'}</p>
                                        </div>
                                    ))) : (<div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50"><p className="text-slate-500">Sin familiares</p></div>)}
                                </div>
                            )}
                            {isEditingFamily && (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                                    <h3 className="text-md font-bold text-slate-800 mb-6 pb-2 border-b border-slate-200">{familyFormData.id > 0 ? 'Editar Familiar' : 'Nuevo Familiar'}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cédula</label><input type="text" name="cedula" value={familyFormData.cedula} onChange={handleFamilyInputChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none" maxLength={10} /></div>
                                            <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombres</label><input type="text" name="nombres_completos" value={familyFormData.nombres_completos} onChange={handleFamilyInputChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none" /></div>
                                        </div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parentesco</label><select name="parentesco" value={familyFormData.parentesco} onChange={handleFamilyInputChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none"><option value="Padre">Padre</option><option value="Madre">Madre</option><option value="Abuelo/a">Abuelo/a</option><option value="Tío/a">Tío/a</option><option value="Otro">Otro</option></select></div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label><input type="text" name="telefono_personal" value={familyFormData.telefono_personal} onChange={handleFamilyInputChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none" /></div>
                                        <div className="md:col-span-2 flex flex-wrap gap-4"><label className="flex items-center gap-2"><input type="checkbox" name="es_representante_legal" checked={familyFormData.es_representante_legal} onChange={handleFamilyInputChange} /> Representante</label><label className="flex items-center gap-2"><input type="checkbox" name="vive_con_estudiante" checked={familyFormData.vive_con_estudiante} onChange={handleFamilyInputChange} /> Vive con estudiante</label></div>
                                    </div>
                                    <div className="flex justify-end gap-3"><button onClick={() => setIsEditingFamily(false)} className="px-4 py-2 text-slate-600">Cancelar</button><button onClick={saveLocalFamiliar} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Guardar</button></div>
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="animate-in fade-in duration-500">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                                <FileText className="w-6 h-6 text-blue-600" />
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Resumen y Confirmación</h2>
                                    <p className="text-sm text-slate-500">Verifique los datos. Los campos son editables.</p>
                                </div>
                            </div>

                            {studentId === 0 && (
                                <div className="mb-6 bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center gap-2 text-sm text-blue-700">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Backup local activo. Cierre seguro habilitado.</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                                <div className="lg:col-span-1">
                                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center">
                                        <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-slate-100 mb-4 shadow-sm">
                                            {getImageSrc() ? (
                                                <img src={getImageSrc()} className="w-full h-full object-cover" alt="Resumen" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400"><User className="w-12 h-12" /></div>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-lg mb-1">{formData.nombres} {formData.apellidos}</h3>
                                        <p className="text-slate-500 text-sm mb-4">
                                            {formData.info_nacionalidad?.es_extranjero
                                                ? `${formData.info_nacionalidad.pasaporte_odni || 'S/N'} (${formData.info_nacionalidad.pais_origen})`
                                                : (formData.cedula || 'S/N')
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
                                            <h4 className="font-bold text-slate-700 text-sm uppercase">Datos del Estudiante (Editable)</h4>
                                        </div>
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombres</label><input type="text" name="nombres" value={formData.nombres} onChange={handleInputChange} className="w-full border-b border-slate-300 focus:border-blue-500 outline-none py-1 bg-transparent font-medium text-slate-700" /></div>
                                            <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Apellidos</label><input type="text" name="apellidos" value={formData.apellidos} onChange={handleInputChange} className="w-full border-b border-slate-300 focus:border-blue-500 outline-none py-1 bg-transparent font-medium text-slate-700" /></div>
                                            {!formData.info_nacionalidad?.es_extranjero ? (
                                                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cédula</label><input type="text" name="cedula" value={formData.cedula} onChange={handleInputChange} className="w-full border-b border-slate-300 focus:border-blue-500 outline-none py-1 bg-transparent font-medium text-slate-700" /></div>
                                            ) : (
                                                <>
                                                    <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Pasaporte</label><input type="text" name="pasaporte_odni" value={formData.info_nacionalidad.pasaporte_odni} onChange={handleNacionalidadChange} className="w-full border-b border-slate-300 focus:border-blue-500 outline-none py-1 bg-transparent font-medium text-slate-700" /></div>
                                                    <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">País de Origen</label><input type="text" name="pais_origen" value={formData.info_nacionalidad.pais_origen} onChange={handleNacionalidadChange} className="w-full border-b border-slate-300 focus:border-blue-500 outline-none py-1 bg-transparent font-medium text-slate-700" /></div>
                                                </>
                                            )}
                                            <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha Nacimiento</label><input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleInputChange} className="w-full border-b border-slate-300 focus:border-blue-500 outline-none py-1 bg-transparent font-medium text-slate-700" /></div>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
                                            <h4 className="font-bold text-slate-700 text-sm uppercase">Núcleo Familiar</h4>
                                            <button onClick={() => setCurrentStep(2)} className="text-xs text-blue-600 hover:underline font-medium">Volver a editar</button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                                                    <tr><th className="px-6 py-3">Nombre</th><th className="px-6 py-3">Parentesco</th><th className="px-6 py-3 text-center">Legal</th></tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {formData.familiares.length > 0 ? (formData.familiares.map((fam, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50">
                                                            <td className="px-6 py-3 font-medium text-slate-700">{fam.nombres_completos}</td>
                                                            <td className="px-6 py-3 text-slate-500">{fam.parentesco}</td>
                                                            <td className="px-6 py-3 text-center">{fam.es_representante_legal && <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>}</td>
                                                        </tr>
                                                    ))) : (<tr><td colSpan="3" className="px-6 py-4 text-center text-slate-400 italic">No hay familiares</td></tr>)}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center pt-4">
                                <button onClick={handleFinalTransaction} disabled={isLoading} className="px-10 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg flex items-center gap-3 text-lg">
                                    <Save className="w-5 h-5" /> {isLoading ? 'Procesando...' : 'Confirmar y Guardar Todo'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}