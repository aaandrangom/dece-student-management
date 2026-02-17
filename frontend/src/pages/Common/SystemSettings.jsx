import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
    Settings, Database, Download, Upload, ShieldAlert, FileArchive, Loader2,
    Shield, Lock, Eye, ToggleLeft, ToggleRight, Info, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { GenerarRespaldo, RestaurarRespaldo } from "../../../wailsjs/go/system/MaintenanceService";
import { ListarConfiguraciones, ActualizarConfiguracion } from "../../../wailsjs/go/services/SecurityConfigService";

const SystemSettings = () => {
    const [isBackupLoading, setIsBackupLoading] = useState(false);
    const [isRestoreLoading, setIsRestoreLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [securityConfigs, setSecurityConfigs] = useState([]);
    const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);
    const [togglingKey, setTogglingKey] = useState(null);

    useEffect(() => {
        cargarConfiguraciones();
    }, []);

    useEffect(() => {
        let interval;
        if ((isBackupLoading || isRestoreLoading) && progress < 90) {
            interval = setInterval(() => {
                setProgress(prev => {
                    const next = prev + Math.random() * 15;
                    return next > 90 ? 90 : next;
                });
            }, 500);
        } else if (!isBackupLoading && !isRestoreLoading) {
            setProgress(0);
        }
        return () => clearInterval(interval);
    }, [isBackupLoading, isRestoreLoading, progress]);

    const cargarConfiguraciones = async () => {
        try {
            setIsLoadingConfigs(true);
            const configs = await ListarConfiguraciones();
            setSecurityConfigs(configs || []);
        } catch (error) {
            console.error("Error al cargar configuraciones:", error);
        } finally {
            setIsLoadingConfigs(false);
        }
    };

    const handleToggleConfig = async (clave, valorActual) => {
        const nuevoValor = !valorActual;
        const accion = nuevoValor ? 'activar' : 'desactivar';

        const result = await Swal.fire({
            title: `¿${nuevoValor ? 'Activar' : 'Desactivar'} protección?`,
            html: nuevoValor
                ? 'Al activar esta opción, se <b>solicitará la contraseña</b> cada vez que se acceda al módulo protegido.'
                : 'Al desactivar esta opción, el módulo protegido será <b>accesible sin contraseña</b>.',
            icon: nuevoValor ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonColor: nuevoValor ? '#7c3aed' : '#3085d6',
            cancelButtonColor: '#64748b',
            confirmButtonText: `Sí, ${accion}`,
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        try {
            setTogglingKey(clave);
            await ActualizarConfiguracion(clave, nuevoValor);
            setSecurityConfigs(prev =>
                prev.map(c => c.clave === clave ? { ...c, valor: nuevoValor } : c)
            );
            toast.success(`Configuración ${nuevoValor ? 'activada' : 'desactivada'} correctamente`);
        } catch (error) {
            console.error("Error al actualizar configuración:", error);
            toast.error("Error al actualizar la configuración");
        } finally {
            setTogglingKey(null);
        }
    };

    const handleBackup = async () => {
        setIsBackupLoading(true);
        setProgress(0);
        try {
            const path = await GenerarRespaldo();
            if (path) {
                setProgress(100);
                setTimeout(() => {
                    toast.success("Respaldo generado exitosamente", {
                        description: `Guardado en: ${path}`
                    });
                }, 500);
            }
        } catch (error) {
            console.error("Error backup:", error);
            toast.error("Error al generar respaldo");
        } finally {
            setTimeout(() => {
                setIsBackupLoading(false);
            }, 1000);
        }
    };

    const handleRestore = async () => {
        const result = await Swal.fire({
            title: '¿Está seguro de restaurar?',
            html: "Esta acción <b>reemplazará toda la información</b> del sistema con la del respaldo seleccionado.<br/><br/>La aplicación se cerrará automáticamente para completar el proceso.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, restaurar sistema',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) {
            return;
        }

        setIsRestoreLoading(true);
        setProgress(0);
        try {
            toast.info("Iniciando restauración del sistema...");
            await RestaurarRespaldo();
        } catch (error) {
            console.error("Error restore:", error);
            toast.error("Error al restaurar respaldo");
            setIsRestoreLoading(false);
        }
    };

    const getConfigMeta = (clave) => {
        const meta = {
            'seguimiento_requiere_clave': {
                icon: Lock,
                title: 'Protección de Seguimiento DECE',
                subtitle: 'Solicitar contraseña al acceder al módulo',
                color: 'purple',
                detail: 'Cuando está activa, se requerirá la contraseña del usuario cada vez que acceda al módulo de Seguimiento DECE (Gestión Disciplinaria). Esto añade una capa extra de seguridad para proteger la información sensible de los estudiantes.'
            }
        };
        return meta[clave] || {
            icon: Shield,
            title: clave,
            subtitle: '',
            color: 'slate',
            detail: ''
        };
    };

    return (
        <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans">
            <div className="space-y-6">

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="flex items-center gap-5 z-10">
                        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-purple-600 shadow-sm">
                            <Settings className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Configuración del Sistema</h1>
                            <p className="text-slate-500 mt-1">Seguridad, respaldos y mantenimiento del sistema</p>
                        </div>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-linear-to-l from-purple-50/50 to-transparent pointer-events-none" />
                </div>

                {/* ── Sección de Seguridad ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-xl text-purple-600 border border-purple-100">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Seguridad del Sistema</h2>
                                <p className="text-sm text-slate-500 mt-0.5">Configura las políticas de acceso y protección de módulos sensibles</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        {isLoadingConfigs ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-500 mr-3" />
                                <span className="text-slate-500 font-medium">Cargando configuraciones...</span>
                            </div>
                        ) : securityConfigs.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="font-medium">No hay configuraciones disponibles</p>
                            </div>
                        ) : (
                            securityConfigs.map((config) => {
                                const meta = getConfigMeta(config.clave);
                                const IconComp = meta.icon;
                                const isToggling = togglingKey === config.clave;

                                return (
                                    <div
                                        key={config.id}
                                        className={`rounded-xl border-2 p-5 transition-all duration-300 ${config.valor
                                            ? 'border-purple-200 bg-purple-50/30 shadow-sm shadow-purple-100/50'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${config.valor
                                                    ? 'bg-purple-100 text-purple-600'
                                                    : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                    <IconComp className="w-5 h-5" />
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-slate-800">{meta.title}</h3>
                                                        {config.valor && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Activa
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-500 mt-0.5">{meta.subtitle}</p>

                                                    {meta.detail && (
                                                        <div className="mt-3 flex items-start gap-2 bg-slate-50 rounded-lg p-3 border border-slate-100">
                                                            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                                            <p className="text-xs text-slate-500 leading-relaxed">{meta.detail}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleToggleConfig(config.clave, config.valor)}
                                                disabled={isToggling}
                                                className={`shrink-0 transition-all duration-300 rounded-full p-1 ${config.valor
                                                    ? 'text-purple-600 hover:text-purple-700'
                                                    : 'text-slate-300 hover:text-slate-400'
                                                    } disabled:opacity-50`}
                                                title={config.valor ? 'Desactivar' : 'Activar'}
                                            >
                                                {isToggling ? (
                                                    <Loader2 className="w-8 h-8 animate-spin" />
                                                ) : config.valor ? (
                                                    <ToggleRight className="w-10 h-10" />
                                                ) : (
                                                    <ToggleLeft className="w-10 h-10" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ── Sección de Respaldos ── */}
                {(isBackupLoading || isRestoreLoading) && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-700">
                                {isBackupLoading ? "Generando Copia de Seguridad..." : "Restaurando Sistema..."}
                            </span>
                            <span className="text-xs font-mono text-slate-500">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-linear-to-r from-purple-500 to-indigo-500 transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-2 text-center animate-pulse">
                            Por favor no cierre la aplicación mientras el proceso está en curso.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden relative group
                        ${isBackupLoading ? 'border-purple-300 ring-2 ring-purple-100' : 'border-slate-200 hover:border-purple-200 hover:shadow-md'}
                    `}>
                        <div className="p-8 h-full flex flex-col">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                                    <Download className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Copia de Seguridad</h3>
                            </div>

                            <div className="space-y-4 flex-1">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Genera un archivo comprimido (.zip) que contiene toda la información vital del sistema:
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <Database className="w-4 h-4 text-emerald-500" />
                                        Base de datos SQLite completa
                                    </li>
                                    <li className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <FileArchive className="w-4 h-4 text-amber-500" />
                                        Documentos y archivos adjuntos
                                    </li>
                                </ul>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-50">
                                <button
                                    onClick={handleBackup}
                                    disabled={isBackupLoading || isRestoreLoading}
                                    className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200"
                                >
                                    {isBackupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    Generar Respaldo
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden relative group
                        ${isRestoreLoading ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200 hover:border-amber-200 hover:shadow-md'}
                    `}>
                        <div className="p-8 h-full flex flex-col">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Restaurar Sistema</h3>
                            </div>

                            <div className="space-y-4 flex-1">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Recupera el sistema a un estado anterior utilizando un archivo de respaldo generado previamente.
                                </p>
                                <div className="bg-amber-50/50 rounded-lg p-3 border border-amber-100">
                                    <div className="flex items-start gap-3">
                                        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-800 font-medium">
                                            Advertencia: Esta acción reemplazará todos los datos actuales. La aplicación se reiniciará automáticamente.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-50">
                                <button
                                    onClick={handleRestore}
                                    disabled={isBackupLoading || isRestoreLoading}
                                    className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group-hover:bg-amber-50 group-hover:text-amber-700 group-hover:border-amber-200"
                                >
                                    {isRestoreLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    Seleccionar Archivo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center py-8">
                    <p className="text-xs text-slate-400">
                        Sistema Integrado de Gestión DECE v1.1.0 • Módulo de Mantenimiento
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
