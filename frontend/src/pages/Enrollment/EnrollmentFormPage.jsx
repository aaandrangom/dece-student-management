import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Save, ArrowLeft, BookOpen, Activity, HeartPulse, Users, Baby } from 'lucide-react';
import { GuardarMatricula, ObtenerMatriculaActual, SeleccionarArchivo, LeerArchivoParaVista } from '../../../wailsjs/go/services/EnrollmentService';
import { ListarCursos } from '../../../wailsjs/go/services/CourseService';
import { ListarMaterias } from '../../../wailsjs/go/academic/SubjectService';
import { ObtenerPeriodoActivo } from '../../../wailsjs/go/academic/YearService';
import { PreviewModal } from './EnrollmentUI';
import { AcademicTab, PhysicalTab, HealthTab, SocialTab, GenderTab } from './EnrollmentTabs';

export default function EnrollmentFormPage({ studentId, studentGender = 'M', onBack }) {
    const [activeTab, setActiveTab] = useState('academico');
    const [isLoading, setIsLoading] = useState(false);

    const [courses, setCourses] = useState([]);
    const [subjectsList, setSubjectsList] = useState([]);
    const [previewFile, setPreviewFile] = useState(null);

    const [formData, setFormData] = useState({
        id: 0, estudiante_id: studentId, curso_id: 0, es_repetidor: false, direccion_actual: '', ruta_croquis: '',
        antropometria: { peso: 0, talla: 0, tipo_sangre: 'O+' },
        historial_academico: { es_nuevo_estudiante: false, institucion_anterior: '', provincia_anterior: '', canton_anterior: '', ha_repetido_anio: false, detalle_anio_repetido: '', materias_favoritas: [], materias_menos_gustan: [] },
        datos_salud: { tiene_eval_psicopedagogica: false, ruta_eval_psicopedagogica: '', tiene_discapacidad: false, detalle_discapacidad: '', ha_sufrido_accidente: false, detalle_accidente: '', tiene_alergias: false, detalle_alergia: '', tiene_cirugias: false, detalle_cirugia: '', tiene_enfermedad: false, detalle_enfermedad: '' },
        datos_sociales: { actividades: [], practica_actividad: false },
        condicion_genero: {
            esta_embarazada: false, meses_embarazo: 0, lleva_control: false, es_alto_riesgo: false, tipo_apoyo_institucion: '', nombre_padre_bebe: '', viven_juntos_padres: false,
            esta_lactando: false, meses_lactancia: 0, genero_bebe: 'M', dias_nacido: 0, nombre_padre_lactancia: '', edad_padre_lactancia: 0,
            es_maternidad: false, tiempo_maternidad: '',
            es_padre: false, tiempo_paternidad: '',
            pareja_es_estudiante: false, pareja_id: 0, nombre_pareja: '', edad_pareja: 0, telefono_pareja: '', pareja_es_menor_de_edad: false,
            detalle_padres_pareja: { nombres: '', apellidos: '', cedula: '', telefono: '', parentesco: 'Padre' }
        }
    });

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const [periodo, materias] = await Promise.all([ObtenerPeriodoActivo(), ListarMaterias()]);
                if (materias) setSubjectsList(materias);
                if (periodo) {
                    const cursosData = await ListarCursos(periodo.id);
                    setCourses(cursosData || []);
                } else {
                    toast.error("Configure un periodo lectivo activo primero.");
                }

                if (studentId > 0) {
                    const data = await ObtenerMatriculaActual(studentId);
                    console.log('Loaded enrollment data:', data.ruta_croquis);
                    if (data) {
                        setFormData(prev => ({
                            ...prev,
                            id: data.id,
                            estudiante_id: data.estudiante_id,
                            curso_id: data.curso_id,
                            es_repetidor: data.es_repetidor,
                            direccion_actual: data.direccion_actual,
                            ruta_croquis: data.ruta_croquis,
                            antropometria: { ...prev.antropometria, ...(data.antropometria || {}) },
                            historial_academico: {
                                ...prev.historial_academico, ...(data.historial_academico || {}),
                                materias_favoritas: data.historial_academico?.materias_favoritas || [],
                                materias_menos_gustan: data.historial_academico?.materias_menos_gustan || []
                            },
                            datos_salud: { ...prev.datos_salud, ...(data.datos_salud || {}) },
                            datos_sociales: {
                                actividades: data.datos_sociales?.actividades || [],
                                practica_actividad: (data.datos_sociales?.actividades?.length > 0)
                            },
                            condicion_genero: {
                                ...prev.condicion_genero, ...(data.condicion_genero || {}),
                                detalle_padres_pareja: { ...prev.condicion_genero.detalle_padres_pareja, ...(data.condicion_genero?.detalle_padres_pareja || {}) }
                            }
                        }));
                    }
                }
            } catch (error) { 
                console.warn("No se encontraron datos de matrícula previos o error:", error);
            } finally { setIsLoading(false); }
        };
        loadInitialData();
    }, [studentId]);

    const updateSection = (section, newData) => setFormData(prev => ({ ...prev, [section]: newData }));
    const updateField = (section, field, value) => setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    const updateRoot = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleFileSelect = async (section, field) => {
        try {
            const path = await SeleccionarArchivo(field.includes('croquis') ? 'imagen' : 'pdf');
            if (path) {
                section ? updateField(section, field, path) : updateRoot(field, path);
                toast.success("Archivo seleccionado");
            }
        } catch (err) { toast.error("Error al seleccionar archivo"); }
    };

    const handlePreview = async (path) => {
        if (!path) return toast.info("No hay archivo");
        try {
            const base64 = await LeerArchivoParaVista(path);
            if (base64) setPreviewFile(base64);
        } catch (err) {
            console.log(err);
            toast.error("Error al previsualizar");
        }
    };

    const handleSave = async () => {
        if (!formData.curso_id) return toast.warning("Seleccione un curso");
        try {
            setIsLoading(true);
            const payload = {
                ...formData,
                curso_id: Number(formData.curso_id),
                estudiante_id: studentId,
                antropometria: { ...formData.antropometria, peso: Number(formData.antropometria.peso), talla: Number(formData.antropometria.talla) },
                condicion_genero: {
                    ...formData.condicion_genero,
                    meses_embarazo: Number(formData.condicion_genero.meses_embarazo || 0),
                    meses_lactancia: Number(formData.condicion_genero.meses_lactancia || 0),
                    dias_nacido: Number(formData.condicion_genero.dias_nacido || 0),
                    edad_padre_lactancia: Number(formData.condicion_genero.edad_padre_lactancia || 0),
                    edad_pareja: Number(formData.condicion_genero.edad_pareja || 0),
                    pareja_id: Number(formData.condicion_genero.pareja_id || 0)
                }
            };
            await GuardarMatricula(payload);
            toast.success("Guardado correctamente");
            onBack();
        } catch (err) { toast.error("Error: " + err); } finally { setIsLoading(false); }
    };

    const tabs = [
        { id: 'academico', label: 'Académico', icon: BookOpen },
        { id: 'fisico', label: 'Físico', icon: Activity },
        { id: 'salud', label: 'Salud / Psico', icon: HeartPulse },
        { id: 'social', label: 'Social', icon: Users },
        { id: 'genero', label: 'Género', icon: Baby },
    ];

    return (
        <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans">
            {previewFile && <PreviewModal fileBase64={previewFile} onClose={() => setPreviewFile(null)} />}
            <div className="">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-slate-600" /></button>
                        <div><h1 className="text-xl font-bold text-slate-800">Ficha DECE</h1><p className="text-slate-500 text-sm">Gestionando Matrícula</p></div>
                    </div>
                    <button onClick={handleSave} disabled={isLoading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-sm transition-all"><Save className="w-4 h-4" /> {isLoading ? 'Guardando...' : 'Guardar'}</button>
                </div>

                {/* Tabs Nav */}
                <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 min-h-150">
                    {activeTab === 'academico' && <AcademicTab data={formData} courses={courses} onChange={(field, val) => updateRoot(field, val)} />}
                    {activeTab === 'fisico' && <PhysicalTab data={formData.antropometria} onChange={(field, val) => updateField('antropometria', field, val)} />}
                    {activeTab === 'salud' && <HealthTab data={formData.datos_salud} onChange={(field, val) => updateField('datos_salud', field, val)} onFileSelect={handleFileSelect} onPreview={handlePreview} />}
                    {activeTab === 'social' && <SocialTab history={formData.historial_academico} social={formData.datos_sociales} rutaCroquis={formData.ruta_croquis} subjectsList={subjectsList} onChangeHistory={(field, val) => updateField('historial_academico', field, val)} onChangeSocial={(field, val) => updateField('datos_sociales', field, val)} onFileSelect={handleFileSelect} onPreview={handlePreview} />}
                    {activeTab === 'genero' && <GenderTab gender={studentGender} data={formData.condicion_genero} onChange={(newData) => updateSection('condicion_genero', newData)} />}
                </div>
            </div>
        </div>
    );
}