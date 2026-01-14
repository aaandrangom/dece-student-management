import React, { useMemo } from 'react';
import {
    Activity, HeartPulse, Users, Baby, FileText, UserCheck, School,
    MapPin, AlertCircle, Info, Calculator, CheckCircle2, User, Calendar,
    AlertTriangle
} from 'lucide-react';
import {
    SectionTitle, InputGroup, BaseInput,
    BaseSelect, FileUploader, TagManager, PartnerSearch
} from './EnrollmentUI';
import { toast } from 'sonner';


export const AcademicTab = ({ data, courses, onChange, onFileSelect, onPreview }) => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-600">
                    <School className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Asignación Académica</h3>
                    <p className="text-xs text-slate-500">Definición de curso y estado inicial</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors">
                        <InputGroup label="Curso / Paralelo Asignado">
                            <BaseSelect
                                value={data.curso_id}
                                onChange={(e) => onChange('curso_id', Number(e.target.value))}
                                className="bg-white text-lg font-medium"
                            >
                                <option value={0}>Seleccione un curso del listado...</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.nombre_completo}</option>)}
                            </BaseSelect>
                        </InputGroup>
                        <div className="mt-3 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                            <Info className="w-4 h-4 shrink-0" />
                            <p className="font-medium">Solo se muestran los cursos con cupos disponibles en el periodo activo.</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 flex flex-col gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Estado</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${data.id > 0 && data.estado === "Matriculado"
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : data.id > 0 && data.estado === "Retirado"
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${data.id > 0 && data.estado === "Matriculado" ? 'bg-emerald-500' : data.id > 0 && data.estado === "Retirado" ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                {data.id > 0 ? (data.estado || 'MATRICULADO').toUpperCase() : 'NUEVO INGRESO'}
                            </span>
                        </div>

                        <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border transition-all ${data.es_repetidor
                            ? 'bg-amber-50 border-amber-200 shadow-sm'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}>
                            <input
                                type="checkbox"
                                checked={data.es_repetidor}
                                onChange={(e) => onChange('es_repetidor', e.target.checked)}
                                className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 border-gray-300 mt-0.5"
                            />
                            <div>
                                <span className={`block text-sm font-bold ${data.es_repetidor ? 'text-amber-800' : 'text-slate-700'}`}>Estudiante Repetidor</span>
                                <span className="text-xs text-slate-500">Marca esta casilla si el estudiante está repitiendo el año escolar.</span>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
            <SectionTitle title="Documentación Legal" icon={FileText} />
            <div className="mt-6">
                 <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <h4 className="font-medium text-slate-800 mb-2">Consentimiento Informado</h4>
                    <p className="text-sm text-slate-500 mb-4">Documento firmado por el representante legal autorizando los procesos del DECE.</p>
                     
                    <FileUploader
                        label="Subir PDF (Máx 5MB)"
                        path={data.ruta_consentimiento}
                        onSelect={() => onFileSelect(null, 'ruta_consentimiento')}
                        onPreview={() => onPreview(data.ruta_consentimiento)}
                        onDelete={() => onChange('ruta_consentimiento', '')}
                    />
                 </div>
            </div>
        </div>
    </div>
);

export const PhysicalTab = ({ data, onChange }) => {
    const imc = useMemo(() => {
        const p = parseFloat(data.peso) || 0;
        const t = parseFloat(data.talla) || 0;
        return (p > 0 && t > 0) ? (p / (t * t)).toFixed(2) : "0.00";
    }, [data.peso, data.talla]);

    const getImcStatus = (valor) => {
        const v = parseFloat(valor);
        if (v <= 0) return { label: 'Pendiente', color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200' };
        if (v < 18.5) return { label: 'Bajo Peso', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
        if (v < 25) return { label: 'Peso Normal', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
        if (v < 30) return { label: 'Sobrepeso', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
        return { label: 'Obesidad', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    };

    const imcStatus = getImcStatus(imc);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <SectionTitle title="Datos Antropométricos" icon={Activity} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
                    <div className="lg:col-span-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 bg-slate-50/50 p-5 rounded-xl border border-slate-200">
                            <InputGroup label="Peso (kg)">
                                <div className="relative">
                                    <BaseInput
                                        type="number"
                                        step="0.01"
                                        value={data.peso}
                                        onChange={(e) => onChange('peso', e.target.value)}
                                        placeholder="0.00"
                                        className="pl-4 pr-8 text-lg font-bold text-slate-700"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KG</span>
                                </div>
                            </InputGroup>
                            <InputGroup label="Talla (metros)">
                                <div className="relative">
                                    <BaseInput
                                        type="number"
                                        step="0.01"
                                        value={data.talla}
                                        onChange={(e) => onChange('talla', e.target.value)}
                                        placeholder="0.00"
                                        className="pl-4 pr-8 text-lg font-bold text-slate-700"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">MT</span>
                                </div>
                            </InputGroup>
                            <InputGroup label="Tipo de Sangre">
                                <BaseSelect
                                    value={data.tipo_sangre}
                                    onChange={(e) => onChange('tipo_sangre', e.target.value)}
                                    className="font-bold text-slate-700 h-11.5"
                                >
                                    <option value="">--</option>
                                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                                </BaseSelect>
                            </InputGroup>
                        </div>
                    </div>

                    <div className="lg:col-span-4">
                        <div className={`h-full rounded-xl border p-5 flex flex-col justify-center items-center text-center transition-colors ${imcStatus.bg} ${imcStatus.border}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-md bg-white/50">
                                    <Calculator className={`w-4 h-4 ${imcStatus.color}`} />
                                </div>
                                <span className={`text-xs font-bold uppercase tracking-wider ${imcStatus.color}`}>IMC Calculado</span>
                            </div>
                            <p className={`text-4xl font-black tracking-tight ${imcStatus.color} mb-1`}>{imc}</p>
                            <span className={`text-sm font-bold px-3 py-1 rounded-full bg-white/60 ${imcStatus.color}`}>{imcStatus.label}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HealthOption = ({ label, check, text, onCheck, onText, colorClass = "blue", icon: Icon }) => {
    const colors = {
        blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', ring: 'focus:ring-blue-500' },
        red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', ring: 'focus:ring-red-500' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', ring: 'focus:ring-amber-500' },
    };
    const style = colors[colorClass];

    return (
        <div className={`p-4 rounded-xl border transition-all duration-200 w-full ${check ? `${style.bg} ${style.border} shadow-sm` : 'bg-white border-slate-200 hover:border-slate-300'}`}>
            <div className="flex items-start gap-3">
                <div className="pt-0.5">
                    <input
                        type="checkbox"
                        checked={check}
                        onChange={(e) => onCheck(e.target.checked)}
                        className={`w-5 h-5 rounded border-gray-300 cursor-pointer ${style.text} ${style.ring}`}
                    />
                </div>
                <div className="flex-1 w-full min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {Icon && <Icon className={`w-4 h-4 ${check ? style.text : 'text-slate-400'}`} />}
                        <span className={`font-bold text-sm ${check ? style.text : 'text-slate-700'}`}>{label}</span>
                    </div>

                    {check && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                            <BaseInput
                                value={text}
                                onChange={(e) => onText(e.target.value)}
                                placeholder={`Describa detalles de ${label.toLowerCase()}...`}
                                className="bg-white border-0 shadow-sm text-sm focus:ring-2 focus:ring-inset w-full"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const HealthTab = ({ data, onChange, onFileSelect, onPreview }) => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <SectionTitle title="Historial Médico y Condiciones" icon={HeartPulse} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">

                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-2">
                        <Activity className="w-3.5 h-3.5 text-rose-500" />
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Condiciones Permanentes</h4>
                    </div>

                    <div className="space-y-3">
                        <HealthOption
                            label="Discapacidad"
                            check={data.tiene_discapacidad}
                            text={data.detalle_discapacidad}
                            onCheck={(v) => onChange('tiene_discapacidad', v)}
                            onText={(v) => onChange('detalle_discapacidad', v)}
                            colorClass="red"
                            icon={Activity}
                        />
                        <HealthOption
                            label="Enfermedades Catastróficas"
                            check={data.tiene_enfermedad}
                            text={data.detalle_enfermedad}
                            onCheck={(v) => onChange('tiene_enfermedad', v)}
                            onText={(v) => onChange('detalle_enfermedad', v)}
                            colorClass="red"
                            icon={AlertCircle}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Antecedentes Clínicos</h4>
                    </div>

                    <div className="space-y-3">
                        <HealthOption
                            label="Alergias Severas"
                            check={data.tiene_alergias}
                            text={data.detalle_alergia}
                            onCheck={(v) => onChange('tiene_alergias', v)}
                            onText={(v) => onChange('detalle_alergia', v)}
                            colorClass="amber"
                            icon={AlertTriangle}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <HealthOption
                                label="Cirugías"
                                check={data.tiene_cirugias}
                                text={data.detalle_cirugia}
                                onCheck={(v) => onChange('tiene_cirugias', v)}
                                onText={(v) => onChange('detalle_cirugia', v)}
                                colorClass="blue"
                            />
                            <HealthOption
                                label="Accidentes"
                                check={data.ha_sufrido_accidente}
                                text={data.detalle_accidente}
                                onCheck={(v) => onChange('ha_sufrido_accidente', v)}
                                onText={(v) => onChange('detalle_accidente', v)}
                                colorClass="blue"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 rounded text-indigo-600 border border-indigo-100">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Evaluación Psicopedagógica</h3>
                        <p className="text-xs text-slate-500">Documentación UDAI o Externa</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className={`p-5 rounded-xl border transition-all duration-300 ${data.tiene_eval_psicopedagogica ? 'bg-indigo-50/30 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                    <label className="flex items-center gap-3 cursor-pointer w-full">
                        <input
                            type="checkbox"
                            checked={data.tiene_eval_psicopedagogica}
                            onChange={(e) => onChange('tiene_eval_psicopedagogica', e.target.checked)}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                        />
                        <span className={`font-bold ${data.tiene_eval_psicopedagogica ? 'text-indigo-900' : 'text-slate-700'}`}>
                            El estudiante cuenta con evaluación psicopedagógica
                        </span>
                    </label>

                    {data.tiene_eval_psicopedagogica && (
                        <div className="mt-5 pl-8 animate-in fade-in space-y-2">
                            <div className="p-4 bg-white rounded-xl border border-slate-200">
                                <FileUploader
                                    label="Adjuntar Informe Psicopedagógico (PDF)"
                                    path={data.ruta_eval_psicopedagogica}
                                    onSelect={() => onFileSelect('datos_salud', 'ruta_eval_psicopedagogica')}
                                    onPreview={onPreview}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
);

export const SocialTab = ({ history, social, rutaCroquis, subjectsList, onChangeHistory, onChangeSocial, onFileSelect, onPreview }) => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <SectionTitle title="Antecedentes Educativos" icon={Users} />

            <div className="mt-6">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-6">
                            <InputGroup label="Institución Educativa Anterior">
                                <BaseInput
                                    value={history.institucion_anterior}
                                    onChange={(e) => onChangeHistory('institucion_anterior', e.target.value)}
                                    placeholder="Nombre de la escuela o colegio..."
                                    className="bg-white font-medium"
                                />
                            </InputGroup>
                        </div>
                        <div className="lg:col-span-3">
                            <InputGroup label="Provincia">
                                <BaseInput value={history.provincia_anterior} onChange={(e) => onChangeHistory('provincia_anterior', e.target.value)} className="bg-white" />
                            </InputGroup>
                        </div>
                        <div className="lg:col-span-3">
                            <InputGroup label="Cantón">
                                <BaseInput value={history.canton_anterior} onChange={(e) => onChangeHistory('canton_anterior', e.target.value)} className="bg-white" />
                            </InputGroup>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className={`p-5 rounded-xl border transition-colors ${history.ha_repetido_anio ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={history.ha_repetido_anio}
                                    onChange={(e) => onChangeHistory('ha_repetido_anio', e.target.checked)}
                                    className="text-rose-600 w-5 h-5 rounded focus:ring-rose-500 border-slate-300"
                                />
                                <div>
                                    <span className={`block font-bold text-sm ${history.ha_repetido_anio ? 'text-rose-800' : 'text-slate-700'}`}>
                                        Repitencia Escolar
                                    </span>
                                    <span className="text-xs text-slate-500">¿Ha repetido algún año lectivo anteriormente?</span>
                                </div>
                            </label>
                            {history.ha_repetido_anio && (
                                <div className="mt-4 pl-8 animate-in fade-in">
                                    <BaseInput
                                        placeholder="Detalle curso, año y motivo..."
                                        className="bg-white border-rose-100 focus:border-rose-300 focus:ring-rose-200"
                                        value={history.detalle_anio_repetido}
                                        onChange={(e) => onChangeHistory('detalle_anio_repetido', e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Preferencias Académicas</h4>
                            <div className="space-y-4">
                                <TagManager
                                    title="Materias Favoritas"
                                    tags={history.materias_favoritas}
                                    suggestions={subjectsList}
                                    onAdd={(item) => onChangeHistory('materias_favoritas', [...history.materias_favoritas, item])}
                                    onRemove={(idx) => onChangeHistory('materias_favoritas', history.materias_favoritas.filter((_, i) => i !== idx))}
                                />
                                <TagManager
                                    title="Materias con Dificultad"
                                    tags={history.materias_menos_gustan}
                                    suggestions={subjectsList}
                                    onAdd={(item) => onChangeHistory('materias_menos_gustan', [...history.materias_menos_gustan, item])}
                                    onRemove={(idx) => onChangeHistory('materias_menos_gustan', history.materias_menos_gustan.filter((_, i) => i !== idx))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-xl border border-slate-200">
                            <TagManager
                                title="Actividades Extracurriculares"
                                tags={social.actividades}
                                placeholder="Ej: Fútbol, Danza, Música..."
                                onAdd={(item) => onChangeSocial('actividades', [...social.actividades, item])}
                                onRemove={(idx) => onChangeSocial('actividades', social.actividades.filter((_, i) => i !== idx))}
                            />
                        </div>

                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="w-4 h-4 text-slate-500" />
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ubicación Domiciliaria</h4>
                            </div>
                            <div className="bg-white p-4 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                <FileUploader
                                    label="Subir Croquis de la Vivienda"
                                    path={rutaCroquis}
                                    onSelect={() => onFileSelect(null, 'ruta_croquis')}
                                    onPreview={onPreview}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export const GenderTab = ({ gender, data, onChange }) => {
    const handlePartner = (field, value) => {
        const newData = { ...data, [field]: value };
        if (field === 'nombre_pareja') {
            newData.nombre_padre_bebe = value;
            newData.nombre_padre_lactancia = value;
        }
        onChange(newData);
    }

    const handleSelectStudent = (student) => {
        const birth = new Date(student.fecha_nacimiento);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;

        onChange({
            ...data,
            pareja_es_estudiante: true,
            pareja_id: student.id,
            nombre_pareja: `${student.nombres} ${student.apellidos}`,
            edad_pareja: age,
            pareja_es_menor_de_edad: false,
            telefono_pareja: '',
            nombre_padre_bebe: `${student.nombres} ${student.apellidos}`,
            nombre_padre_lactancia: `${student.nombres} ${student.apellidos}`
        });
        toast.success("Estudiante interno seleccionado");
    }

    const handleLocalChange = (field, value) => {
        const newData = { ...data, [field]: value };
        if (field === 'nombre_pareja') {
            newData.nombre_padre_bebe = value;
            newData.nombre_padre_lactancia = value;
        }
        onChange(newData);
    };

    const handleNestedChange = (field, value) => {
        onChange({
            ...data,
            detalle_padres_pareja: { ...data.detalle_padres_pareja, [field]: value }
        });
    };

    const showPartnerSection = (gender === 'F' && (data.esta_embarazada || data.esta_lactando || data.es_maternidad)) || (gender === 'M' && data.es_padre);
    const labelPareja = gender === 'M' ? 'de la Madre (Pareja)' : 'del Padre (Pareja)';

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                <div className="flex items-center justify-between">
                    <SectionTitle title="Enfoque de Género y Familia" icon={Baby} />
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-2 ${gender === 'M' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-pink-50 text-pink-700 border-pink-100'}`}>
                        <User className="w-3 h-3" />
                        Estudiante {gender === 'M' ? 'Masculino' : 'Femenino'}
                    </span>
                </div>
            </div>

            {gender === 'F' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className={`p-6 rounded-xl border transition-all h-full ${data.esta_embarazada ? 'bg-pink-50 border-pink-200 shadow-sm' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center gap-2 mb-4 text-pink-700 font-bold uppercase text-sm tracking-wide">
                            <Baby className="w-4 h-4" /> Estado de Gestación
                        </div>
                        <label className="flex items-center gap-3 mb-4 font-bold text-slate-700 cursor-pointer">
                            <input type="checkbox" checked={data.esta_embarazada} onChange={(e) => handlePartner('esta_embarazada', e.target.checked)} className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500 border-gray-300" />
                            ¿Está embarazada actualmente?
                        </label>

                        {data.esta_embarazada && (
                            <div className="space-y-4 animate-in fade-in bg-white p-4 rounded-xl border border-pink-100 shadow-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <InputGroup label="Meses de Gestación">
                                        <BaseInput type="number" value={data.meses_embarazo} onChange={(e) => handlePartner('meses_embarazo', e.target.value)} />
                                    </InputGroup>
                                    <div className="flex items-end pb-2">
                                        <label className="flex gap-2 text-sm cursor-pointer font-bold text-pink-700 bg-pink-50 px-3 py-2 rounded-lg w-full justify-center border border-pink-100 hover:bg-pink-100 transition-colors">
                                            <input type="checkbox" checked={data.lleva_control} onChange={(e) => handlePartner('lleva_control', e.target.checked)} className="rounded text-pink-600" />
                                            Lleva control médico
                                        </label>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-100">
                                    <label className="flex gap-2 text-sm text-rose-600 font-bold mb-2 cursor-pointer">
                                        <input type="checkbox" checked={data.es_alto_riesgo} onChange={(e) => handlePartner('es_alto_riesgo', e.target.checked)} className="rounded text-rose-600 focus:ring-rose-500" />
                                        Embarazo de Alto Riesgo
                                    </label>
                                    {data.es_alto_riesgo && (
                                        <BaseInput placeholder="Especifique el apoyo institucional requerido..." value={data.tipo_apoyo_institucion} onChange={(e) => handlePartner('tipo_apoyo_institucion', e.target.value)} className="text-sm mt-2" />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <HealthOption
                            label="Lactancia Materna"
                            check={data.esta_lactando}
                            text={null}
                            onCheck={(v) => handlePartner('esta_lactando', v)}
                            onText={() => { }}
                            colorClass="blue"
                            icon={HeartPulse}
                        />
                        {data.esta_lactando && (
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 -mt-4 mb-4 grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                <InputGroup label="Meses Lactancia"><BaseInput type="number" value={data.meses_lactancia} onChange={(e) => handlePartner('meses_lactancia', e.target.value)} className="bg-white" /></InputGroup>
                                <InputGroup label="Edad del Bebé (Días)"><BaseInput type="number" value={data.dias_nacido} onChange={(e) => handlePartner('dias_nacido', e.target.value)} className="bg-white" /></InputGroup>
                            </div>
                        )}

                        <HealthOption
                            label="Periodo de Maternidad"
                            check={data.es_maternidad}
                            text={data.tiempo_maternidad}
                            onCheck={(v) => handlePartner('es_maternidad', v)}
                            onText={(v) => handlePartner('tiempo_maternidad', v)}
                            colorClass="amber"
                            icon={Calendar}
                        />
                    </div>
                </div>
            )}

            {gender === 'M' && (
                <div className={`p-6 rounded-xl border transition-all mb-8 ${data.es_padre ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-2 mb-4 text-blue-800 font-bold uppercase text-sm tracking-wide">
                        <Users className="w-4 h-4" /> Paternidad Responsable
                    </div>
                    <label className="flex items-center gap-3 mb-4 font-bold text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={data.es_padre} onChange={(e) => handlePartner('es_padre', e.target.checked)} className="w-5 h-5 text-blue-600 rounded border-gray-300" />
                        ¿El estudiante es padre?
                    </label>
                    {data.es_padre && (
                        <div className="pl-6 animate-in fade-in bg-white/50 p-4 rounded-lg border border-blue-100 max-w-md">
                            <InputGroup label="Tiempo de Paternidad">
                                <BaseInput value={data.tiempo_paternidad} onChange={(e) => handlePartner('tiempo_paternidad', e.target.value)} className="bg-white" placeholder="Ej: 3 meses, 1 año..." />
                            </InputGroup>
                        </div>
                    )}
                </div>
            )}

            {showPartnerSection && (
                <div className="mt-8 pt-8 border-t-2 border-slate-100 animate-in slide-in-from-bottom-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                                <UserCheck className="w-5 h-5 text-indigo-600" />
                                Información {labelPareja}
                            </h4>
                            <p className="text-sm text-slate-500 mt-1 pl-7">Registre los datos de la pareja para el seguimiento del caso.</p>
                        </div>

                        <div className="p-6">
                            <div className="mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100 inline-flex items-center gap-4">
                                <span className="text-sm font-medium text-indigo-800">¿La pareja estudia aquí?</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.pareja_es_estudiante}
                                        onChange={(e) => onChange({ ...data, pareja_es_estudiante: e.target.checked, pareja_id: 0, nombre_pareja: '', edad_pareja: 0 })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            {data.pareja_es_estudiante ? (
                                <div className="space-y-4 max-w-2xl animate-in fade-in">
                                    <PartnerSearch onSelect={handleSelectStudent} />
                                    {data.pareja_id > 0 && (
                                        <div className="bg-white p-4 rounded-xl border border-emerald-200  flex justify-between items-center shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-100 rounded-full text-emerald-600"><CheckCircle2 className="w-5 h-5" /></div>
                                                <div>
                                                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Seleccionado</p>
                                                    <p className="text-slate-800 font-bold text-lg">{data.nombre_pareja} <span className="text-slate-500 text-sm font-normal">({data.edad_pareja} años)</span></p>
                                                </div>
                                            </div>
                                            <button onClick={() => onChange({ ...data, pareja_id: 0, nombre_pareja: '', pareja_es_estudiante: false })} className="text-xs font-bold text-red-600 hover:text-red-800 bg-white border border-red-200 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">Cambiar</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="animate-in fade-in bg-slate-50 p-6 rounded-xl border border-slate-200">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
                                        <div className="md:col-span-6">
                                            <InputGroup label="Nombres Completos">
                                                <BaseInput value={data.nombre_pareja} onChange={(e) => handleLocalChange('nombre_pareja', e.target.value)} className="bg-white" />
                                            </InputGroup>
                                        </div>
                                        <div className="md:col-span-3">
                                            <InputGroup label="Edad">
                                                <BaseInput type="number" value={data.edad_pareja} onChange={(e) => handleLocalChange('edad_pareja', parseInt(e.target.value) || 0)} className="bg-white" />
                                            </InputGroup>
                                        </div>
                                        <div className="md:col-span-3">
                                            <InputGroup label="Teléfono">
                                                <BaseInput value={data.telefono_pareja} onChange={(e) => handleLocalChange('telefono_pareja', e.target.value)} className="bg-white" />
                                            </InputGroup>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-slate-200">
                                        <label className="flex items-center gap-3 mb-6 text-sm font-bold text-slate-700 cursor-pointer w-fit p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors shadow-sm">
                                            <input type="checkbox" checked={data.pareja_es_menor_de_edad} onChange={(e) => handleLocalChange('pareja_es_menor_de_edad', e.target.checked)} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" />
                                            <span>La pareja es externa y <strong>menor de edad</strong> (Requiere representante)</span>
                                        </label>

                                        {data.pareja_es_menor_de_edad && (
                                            <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                                <h5 className="text-xs font-bold text-indigo-600 uppercase mb-4 flex items-center gap-2">
                                                    <Users className="w-4 h-4" /> Datos del Representante Legal de la Pareja
                                                </h5>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <InputGroup label="Nombres"><BaseInput value={data.detalle_padres_pareja?.nombres || ''} onChange={(e) => handleNestedChange('nombres', e.target.value)} /></InputGroup>
                                                    <InputGroup label="Apellidos"><BaseInput value={data.detalle_padres_pareja?.apellidos || ''} onChange={(e) => handleNestedChange('apellidos', e.target.value)} /></InputGroup>
                                                    <InputGroup label="Cédula"><BaseInput value={data.detalle_padres_pareja?.cedula || ''} onChange={(e) => handleNestedChange('cedula', e.target.value)} /></InputGroup>
                                                    <InputGroup label="Teléfono"><BaseInput value={data.detalle_padres_pareja?.telefono || ''} onChange={(e) => handleNestedChange('telefono', e.target.value)} /></InputGroup>
                                                    <div className="md:col-span-2">
                                                        <InputGroup label="Parentesco con la Pareja">
                                                            <BaseSelect value={data.detalle_padres_pareja?.parentesco || 'Padre'} onChange={(e) => handleNestedChange('parentesco', e.target.value)}>
                                                                <option value="Padre">Padre</option>
                                                                <option value="Madre">Madre</option>
                                                                <option value="Representante">Otro Representante</option>
                                                            </BaseSelect>
                                                        </InputGroup>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};