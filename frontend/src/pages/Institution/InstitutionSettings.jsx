import React, { useState, useEffect } from 'react';
import {
    MapPin, Users, Save, Loader2, School, Hash, ChevronDown, ChevronUp, UserCog, LayoutDashboard,
    FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { ObtenerConfiguracion, GuardarConfiguracion } from "../../../wailsjs/go/services/InstitutionService";
import { GenerarReporteInstitucional, AbrirUbicacionReporte } from "../../../wailsjs/go/reports/ReportService";

const InstitutionSettings = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [config, setConfig] = useState({
        nombre: '',
        codigo_amie: '',
        distrito: '',
        circuito: '',
        detalle_ubicacion: {
            provincia: '',
            canton: '',
            parroquia: '',
            barrio_recinto: ''
        },
        autoridades: {
            rector: { nombres: '', cedula: '', jornada: '', telefono: '' },
            subdirector_matutina: { nombres: '', cedula: '', jornada: '', telefono: '' },
            subdirector_vespertina: { nombres: '', cedula: '', jornada: '', telefono: '' },
            inspector_general: { nombres: '', cedula: '', jornada: '', telefono: '' },
            subinspector: { nombres: '', cedula: '', jornada: '', telefono: '' },
            coordinador_dece: { nombres: '', cedula: '', jornada: '', telefono: '' },
            analista_dece_1: { nombres: '', cedula: '', jornada: '', telefono: '' },
            analista_dece_2: { nombres: '', cedula: '', jornada: '', telefono: '' }
        }
    });

    const [openAuthoritySection, setOpenAuthoritySection] = useState(null);

    useEffect(() => {
        cargarConfiguracion();
    }, []);

    const cargarConfiguracion = async () => {
        try {
            setIsLoading(true);
            const data = await ObtenerConfiguracion();

            if (data && data.nombre) {
                setConfig({
                    nombre: data.nombre || '',
                    codigo_amie: data.codigo_amie || '',
                    distrito: data.distrito || '',
                    circuito: data.circuito || '',
                    detalle_ubicacion: {
                        provincia: data.detalle_ubicacion?.provincia || '',
                        canton: data.detalle_ubicacion?.canton || '',
                        parroquia: data.detalle_ubicacion?.parroquia || '',
                        barrio_recinto: data.detalle_ubicacion?.barrio_recinto || ''
                    },
                    autoridades: {
                        rector: data.autoridades?.rector || { nombres: '', cedula: '', jornada: '', telefono: '' },
                        subdirector_matutina: data.autoridades?.subdirector_matutina || { nombres: '', cedula: '', jornada: '', telefono: '' },
                        subdirector_vespertina: data.autoridades?.subdirector_vespertina || { nombres: '', cedula: '', jornada: '', telefono: '' },
                        inspector_general: data.autoridades?.inspector_general || { nombres: '', cedula: '', jornada: '', telefono: '' },
                        subinspector: data.autoridades?.subinspector || { nombres: '', cedula: '', jornada: '', telefono: '' },
                        coordinador_dece: data.autoridades?.coordinador_dece || { nombres: '', cedula: '', jornada: '', telefono: '' },
                        analista_dece_1: data.autoridades?.analista_dece_1 || { nombres: '', cedula: '', jornada: '', telefono: '' },
                        analista_dece_2: data.autoridades?.analista_dece_2 || { nombres: '', cedula: '', jornada: '', telefono: '' }
                    }
                });
            }
        } catch (error) {
            console.error('Error al cargar configuración:', error);
            toast.error('Error al cargar la configuración');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleUbicacionChange = (field, value) => {
        setConfig(prev => ({
            ...prev,
            detalle_ubicacion: {
                ...prev.detalle_ubicacion,
                [field]: value
            }
        }));
    };

    const handleAutoridadChange = (autoridad, field, value) => {
        setConfig(prev => ({
            ...prev,
            autoridades: {
                ...prev.autoridades,
                [autoridad]: {
                    ...prev.autoridades[autoridad],
                    [field]: value
                }
            }
        }));
    };

    const toggleAuthority = (key) => {
        setOpenAuthoritySection(openAuthoritySection === key ? null : key);
    };

    const handleGenerateReport = async () => {
        try {
            setIsGeneratingReport(true);
            const path = await GenerarReporteInstitucional();
            toast.success('Reporte generado exitosamente', {
                action: {
                    label: 'Abrir',
                    onClick: () => AbrirUbicacionReporte(path)
                }
            });
        } catch (error) {
            console.error('Error al generar reporte:', error);
            toast.error('Error al generar el reporte');
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleSubmit = async () => {
        if (!config.nombre || !config.codigo_amie) {
            toast.error('Por favor completa los campos obligatorios (Nombre y AMIE)');
            return;
        }

        try {
            setIsSaving(true);
            await GuardarConfiguracion(config);
            toast.success('Configuración guardada exitosamente');
        } catch (error) {
            console.error('Error al guardar:', error);
            toast.error('Error al guardar la configuración');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-center flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
                    <p className="text-slate-500 font-medium">Cargando configuración...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full w-full bg-slate-50 font-sans p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-purple-600 shadow-sm">
                            <LayoutDashboard className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">Configuración Institucional</h1>
                            <p className="text-sm text-slate-500">Gestión centralizada de datos</p>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleGenerateReport}
                            disabled={isGeneratingReport || isSaving}
                            id="inst-settings-reporte-btn"
                            className="px-4 py-2.5 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-purple-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            title="Generar Reporte PDF"
                        >
                            {isGeneratingReport ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <FileText className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">Reporte</span>
                        </button>

                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            id="inst-settings-guardar-btn"
                            className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Guardar Cambios</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">

                    <div className="p-8">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">

                            <div className="space-y-6" id="inst-settings-general">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                                    <School className="w-5 h-5 text-purple-500" />
                                    <h2 className="text-lg font-bold text-slate-800">Datos Generales</h2>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                            Nombre de la Institución <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={config.nombre}
                                            onChange={(e) => handleInputChange('nombre', e.target.value)}
                                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400"
                                            placeholder="Ej: Unidad Educativa..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                                Código AMIE <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={config.codigo_amie}
                                                    onChange={(e) => handleInputChange('codigo_amie', e.target.value)}
                                                    className="block w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                                    placeholder="00H00000"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Distrito</label>
                                            <input
                                                type="text"
                                                value={config.distrito}
                                                onChange={(e) => handleInputChange('distrito', e.target.value)}
                                                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                                placeholder="D01"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Circuito</label>
                                        <input
                                            type="text"
                                            value={config.circuito}
                                            onChange={(e) => handleInputChange('circuito', e.target.value)}
                                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                            placeholder="C01"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6" id="inst-settings-ubicacion">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                                    <MapPin className="w-5 h-5 text-indigo-500" />
                                    <h2 className="text-lg font-bold text-slate-800">Ubicación Geográfica</h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Provincia</label>
                                        <input
                                            type="text"
                                            value={config.detalle_ubicacion.provincia}
                                            onChange={(e) => handleUbicacionChange('provincia', e.target.value)}
                                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            placeholder="Ej: Pichincha"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Cantón</label>
                                        <input
                                            type="text"
                                            value={config.detalle_ubicacion.canton}
                                            onChange={(e) => handleUbicacionChange('canton', e.target.value)}
                                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            placeholder="Ej: Quito"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Parroquia</label>
                                        <input
                                            type="text"
                                            value={config.detalle_ubicacion.parroquia}
                                            onChange={(e) => handleUbicacionChange('parroquia', e.target.value)}
                                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            placeholder="Ej: Iñaquito"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Barrio / Recinto</label>
                                        <input
                                            type="text"
                                            value={config.detalle_ubicacion.barrio_recinto}
                                            onChange={(e) => handleUbicacionChange('barrio_recinto', e.target.value)}
                                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            placeholder="Ej: Centro Norte"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50/30 border-t border-slate-100" id="inst-settings-autoridades">
                        <div className="flex items-center gap-2 mb-6">
                            <Users className="w-5 h-5 text-emerald-500" />
                            <h2 className="text-lg font-bold text-slate-800">Autoridades Institucionales</h2>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                            <div className="flex flex-col gap-8">

                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 border-b border-slate-100 px-4 py-3">
                                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Dirección</h3>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        <AutoridadForm
                                            titulo="Director/a"
                                            color="purple"
                                            autoridad={config.autoridades.rector}
                                            onChange={(field, value) => handleAutoridadChange('rector', field, value)}
                                            isOpen={openAuthoritySection === 'rector'}
                                            onToggle={() => toggleAuthority('rector')}
                                        />
                                        <AutoridadForm
                                            titulo="Jornada Matutina"
                                            color="blue"
                                            fixedJornada="Matutina"
                                            autoridad={config.autoridades.subdirector_matutina}
                                            onChange={(field, value) => handleAutoridadChange('subdirector_matutina', field, value)}
                                            isOpen={openAuthoritySection === 'subdirector_matutina'}
                                            onToggle={() => toggleAuthority('subdirector_matutina')}
                                        />
                                        <AutoridadForm
                                            titulo="Jornada Vespertina"
                                            color="blue"
                                            fixedJornada="Vespertina"
                                            autoridad={config.autoridades.subdirector_vespertina}
                                            onChange={(field, value) => handleAutoridadChange('subdirector_vespertina', field, value)}
                                            isOpen={openAuthoritySection === 'subdirector_vespertina'}
                                            onToggle={() => toggleAuthority('subdirector_vespertina')}
                                        />
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 border-b border-slate-100 px-4 py-3">
                                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Inspección</h3>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        <AutoridadForm
                                            titulo="Inspector General"
                                            color="indigo"
                                            autoridad={config.autoridades.inspector_general}
                                            onChange={(field, value) => handleAutoridadChange('inspector_general', field, value)}
                                            isOpen={openAuthoritySection === 'inspector_general'}
                                            onToggle={() => toggleAuthority('inspector_general')}
                                        />
                                        <AutoridadForm
                                            titulo="Subinspector"
                                            color="indigo"
                                            autoridad={config.autoridades.subinspector}
                                            onChange={(field, value) => handleAutoridadChange('subinspector', field, value)}
                                            isOpen={openAuthoritySection === 'subinspector'}
                                            onToggle={() => toggleAuthority('subinspector')}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-8">
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-full">
                                    <div className="bg-slate-50 border-b border-slate-100 px-4 py-3">
                                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Departamento de Consejería Estudiantil (DECE)</h3>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        <AutoridadForm
                                            titulo="Coordinador/a DECE"
                                            color="emerald"
                                            autoridad={config.autoridades.coordinador_dece}
                                            onChange={(field, value) => handleAutoridadChange('coordinador_dece', field, value)}
                                            isOpen={openAuthoritySection === 'coordinador_dece'}
                                            onToggle={() => toggleAuthority('coordinador_dece')}
                                        />
                                        <div className="bg-emerald-50/30 px-4 py-2 border-l-4 border-emerald-500 flex items-center gap-2">
                                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Equipo de Analistas</span>
                                        </div>
                                        <AutoridadForm
                                            titulo="Analista DECE 1"
                                            color="emerald"
                                            autoridad={config.autoridades.analista_dece_1}
                                            onChange={(field, value) => handleAutoridadChange('analista_dece_1', field, value)}
                                            isOpen={openAuthoritySection === 'analista_dece_1'}
                                            onToggle={() => toggleAuthority('analista_dece_1')}
                                        />
                                        <AutoridadForm
                                            titulo="Analista DECE 2"
                                            color="emerald"
                                            autoridad={config.autoridades.analista_dece_2}
                                            onChange={(field, value) => handleAutoridadChange('analista_dece_2', field, value)}
                                            isOpen={openAuthoritySection === 'analista_dece_2'}
                                            onToggle={() => toggleAuthority('analista_dece_2')}
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const AutoridadForm = ({ titulo, autoridad, onChange, isOpen, onToggle, color = 'purple', fixedJornada }) => {
    useEffect(() => {
        if (fixedJornada && autoridad.jornada !== fixedJornada) {
            onChange('jornada', fixedJornada);
        }
    }, [fixedJornada, autoridad.jornada, onChange]);

    const colorClasses = {
        purple: { border: 'border-l-purple-500', bgOpen: 'bg-purple-50/20', icon: 'text-purple-600' },
        blue: { border: 'border-l-blue-500', bgOpen: 'bg-blue-50/20', icon: 'text-blue-600' },
        indigo: { border: 'border-l-indigo-500', bgOpen: 'bg-indigo-50/20', icon: 'text-indigo-600' },
        emerald: { border: 'border-l-emerald-500', bgOpen: 'bg-emerald-50/20', icon: 'text-emerald-600' },
    };

    const currentStyle = colorClasses[color] || colorClasses.purple;

    return (
        <div className={`transition-colors duration-200 ${isOpen ? currentStyle.bgOpen : 'hover:bg-slate-50'}`}>
            <button
                onClick={onToggle}
                className={`w-full flex items-center justify-between p-4 text-left border-l-4 ${isOpen ? currentStyle.border : 'border-transparent hover:border-slate-300'} transition-all`}
            >
                <div className="flex items-center gap-3">
                    <UserCog className={`w-5 h-5 ${currentStyle.icon} opacity-90`} />
                    <span className="font-semibold text-slate-700 text-sm">{titulo}</span>
                    {!autoridad.nombres && (
                        <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-bold">Incompleto</span>
                    )}
                </div>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-medium truncate max-w-37.5">
                            {autoridad.nombres || 'Sin asignar'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                )}
            </button>

            {isOpen && (
                <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-12">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={autoridad.nombres}
                                    onChange={(e) => onChange('nombres', e.target.value)}
                                    className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition-all placeholder:text-slate-300"
                                    placeholder="Nombres y Apellidos"
                                />
                            </div>
                            <div className="col-span-12 sm:col-span-6">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Cédula</label>
                                <input
                                    type="text"
                                    value={autoridad.cedula}
                                    onChange={(e) => onChange('cedula', e.target.value)}
                                    className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition-all font-mono"
                                    placeholder="0000000000"
                                    maxLength={10}
                                />
                            </div>
                            <div className="col-span-12 sm:col-span-6">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Teléfono</label>
                                <input
                                    type="tel"
                                    value={autoridad.telefono}
                                    onChange={(e) => onChange('telefono', e.target.value)}
                                    className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition-all"
                                    placeholder="099..."
                                />
                            </div>
                            <div className="col-span-12">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Jornada</label>
                                <select
                                    value={fixedJornada || autoridad.jornada}
                                    onChange={(e) => onChange('jornada', e.target.value)}
                                    disabled={!!fixedJornada}
                                    className={`block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition-all ${fixedJornada ? 'bg-slate-50 text-slate-500' : ''
                                        }`}
                                >
                                    <option value="">Seleccione jornada</option>
                                    <option value="Matutina">Matutina</option>
                                    <option value="Vespertina">Vespertina</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstitutionSettings;