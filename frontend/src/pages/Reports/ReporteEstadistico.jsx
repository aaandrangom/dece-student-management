import React, { useState } from 'react';
import {
    BarChart2, FileText, Calendar, ShieldAlert,
    AlertTriangle, Download, Loader2, PieChart, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { ObtenerReporteEstadistico, GenerarReporteEstadisticoPDF, AbrirUbicacionReporte } from '../../../wailsjs/go/reports/ReportService';

const SectionCard = ({ title, icon: Icon, children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm text-slate-600">
                <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
        </div>
        <div className="p-0">
            {children}
        </div>
    </div>
);

const DataTable = ({ data, columns }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-slate-400 italic bg-white">
                No hay registros disponibles para el periodo seleccionado
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {columns.map((col, idx) => (
                            <th key={idx} className="px-6 py-4 whitespace-nowrap">{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            {columns.map((col, ctx) => (
                                <td key={ctx} className="px-6 py-4 text-slate-600 text-sm font-medium">
                                    {col.render ? col.render(row) : row[col.accessor]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ReporteEstadistico = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generatingPDF, setGeneratingPDF] = useState(false);

    const handleGenerate = async () => {
        if (!startDate || !endDate) {
            toast.error("Por favor seleccione ambas fechas");
            return;
        }

        setLoading(true);
        try {
            const data = await ObtenerReporteEstadistico(startDate, endDate);
            setReportData(data);
            if (!data.conteo_tipo_caso && !data.top_cursos_conflictivos && !data.derivaciones_externas) {
                toast.info("No se encontraron datos para el rango seleccionado");
            } else {
                toast.success("Datos cargados correctamente");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al obtener datos estadísticos: " + error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        if (!startDate || !endDate) return;

        setGeneratingPDF(true);
        toast.promise(
            async () => {
                const path = await GenerarReporteEstadisticoPDF(startDate, endDate);
                if (path) await AbrirUbicacionReporte(path);
                return path;
            },
            {
                loading: 'Generando PDF estadístico...',
                success: 'Reporte generado y guardado correctamente',
                error: (err) => `Error: ${err}`
            }
        ).finally(() => setGeneratingPDF(false));
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300 p-6 min-h-screen pb-20">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 shadow-sm">
                        <BarChart2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Estadístico de Problemáticas</h1>
                        <p className="text-slate-500 text-sm font-medium">Análisis cuantitativo por periodo</p>
                    </div>
                </div>

                {reportData && (
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleExportPDF}
                            disabled={generatingPDF}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-bold shadow-md hover:shadow-purple-200 active:scale-95 disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            <span>Descargar Reporte PDF</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-end gap-6 relative z-20">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha Inicio</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="date"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-slate-700"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 w-full">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha Fin</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="date"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-slate-700"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="w-full md:w-auto">
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !startDate || !endDate}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 font-bold text-sm"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Procesando...</span>
                            </>
                        ) : (
                            <>
                                <Activity className="w-4 h-4" />
                                <span>Generar Estadísticas</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {reportData && (
                <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">

                    <SectionCard title="A. Frecuencia por Tipo de Caso" icon={PieChart}>
                        <DataTable
                            data={reportData.conteo_tipo_caso || []}
                            columns={[
                                { header: 'Tipo de Caso', accessor: 'tipo_caso' },
                                { header: 'Cantidad', accessor: 'cantidad', render: (row) => <span className="font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">{row.cantidad}</span> },
                            ]}
                        />
                    </SectionCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SectionCard title="B. Top 5 Cursos Conflictivos" icon={AlertTriangle}>
                            <DataTable
                                data={reportData.top_cursos_conflictivos || []}
                                columns={[
                                    { header: 'Curso / Paralelo', accessor: 'curso' },
                                    { header: 'Reportes Disciplinarios', accessor: 'total_faltas', render: (row) => <span className="font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">{row.total_faltas}</span> },
                                ]}
                            />
                        </SectionCard>

                        <SectionCard title="C. Derivaciones Externas" icon={ShieldAlert}>
                            <DataTable
                                data={reportData.derivaciones_externas || []}
                                columns={[
                                    { header: 'Entidad', accessor: 'entidad_derivacion' },
                                    { header: 'Casos Enviados', accessor: 'cantidad', render: (row) => <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{row.cantidad}</span> },
                                ]}
                            />
                        </SectionCard>
                    </div>

                </div>
            )}
        </div>
    );
};

export default ReporteEstadistico;
