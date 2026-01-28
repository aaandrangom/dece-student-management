import React, { useState } from 'react';
import {
    ClipboardList, FileText, Calendar, Download, Loader2,
    CheckCircle2, Users, Presentation, Search, History
} from 'lucide-react';
import { toast } from 'sonner';
import { ObtenerReporteBitacoraGestion, GenerarReporteBitacoraGestionPDF, AbrirUbicacionReporte } from '../../../wailsjs/go/reports/ReportService';

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

const KPICard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-full bg-opacity-10 ${colorClass.includes('emerald') ? 'bg-emerald-500' : colorClass.includes('blue') ? 'bg-blue-500' : 'bg-purple-500'}`}>
            <Icon className={`w-8 h-8 ${colorClass}`} />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const DataTable = ({ data, columns }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-slate-400 italic bg-white">
                No se encontraron registros para el periodo seleccionado
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

const ReporteBitacoraGestion = () => {
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
            const data = await ObtenerReporteBitacoraGestion(startDate, endDate);
            setReportData(data);
            if (!data.talleres || data.talleres.length === 0) {
                toast.info("Reporte generado. No hay talleres, pero se muestran los KPIs.");
            } else {
                toast.success("Datos cargados correctamente");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al obtener datos: " + error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        if (!startDate || !endDate) return;

        setGeneratingPDF(true);
        toast.promise(
            async () => {
                const path = await GenerarReporteBitacoraGestionPDF(startDate, endDate);
                if (path) await AbrirUbicacionReporte(path);
                return path;
            },
            {
                loading: 'Generando PDF de bitácora...',
                success: 'Reporte generado y guardado correctamente',
                error: (err) => `Error al generar PDF: ${err}`
            }
        );
        setGeneratingPDF(false);
    };

    const columns = [
        { header: 'Fecha', accessor: 'fecha' },
        { header: 'Tema Capacitación', accessor: 'tema' },
        { header: 'Grupo Objetivo', accessor: 'grupo' },
        { header: 'Asistentes', accessor: 'asistentes', render: (row) => <span className="font-bold">{row.asistentes}</span> },
    ];

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300 p-6 min-h-screen pb-20">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                        <History className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Bitácora de Gestión DECE</h1>
                        <p className="text-slate-500 text-sm font-medium">Reporte de actividades de citas y capacitaciones</p>
                    </div>
                </div>

                {reportData && (
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleExportPDF}
                            disabled={generatingPDF}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-bold shadow-md hover:shadow-blue-200 active:scale-95 disabled:opacity-50"
                        >
                            {generatingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            <span>Exportar Bitácora PDF</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-end gap-6 relative z-20">
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha Inicio</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha Fin</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-auto">
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 font-bold text-sm"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Generando...</span>
                            </>
                        ) : (
                            <>
                                <FileText className="w-4 h-4" />
                                <span>Generar Reporte</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {reportData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 mb-4 px-1 border-l-4 border-blue-600 pl-3">
                            Resumen Ejecutivo
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <KPICard
                                title="Citas Realizadas"
                                value={reportData.kpis.citas_realizadas}
                                icon={CheckCircle2}
                                colorClass="text-emerald-600"
                            />
                            <KPICard
                                title="Talleres Dictados"
                                value={reportData.kpis.talleres_dictados}
                                icon={Presentation}
                                colorClass="text-blue-600"
                            />
                            <KPICard
                                title="Personas Capacitadas"
                                value={reportData.kpis.personas_capacitadas}
                                icon={Users}
                                colorClass="text-purple-600"
                            />
                        </div>
                    </div>

                    <SectionCard title="Detalle de Capacitaciones" icon={ClipboardList}>
                        <DataTable data={reportData.talleres} columns={columns} />
                    </SectionCard>
                </div>
            )}
        </div>
    );
};

export default ReporteBitacoraGestion;