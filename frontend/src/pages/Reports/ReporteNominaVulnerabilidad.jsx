import React, { useState } from 'react';
import {
    ClipboardList, FileText, Search, Download, Loader2, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { ObtenerReporteNominaVulnerabilidad, GenerarReporteNominaVulnerabilidadPDF, AbrirUbicacionReporte } from '../../../wailsjs/go/reports/ReportService';

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
                No hay registros disponibles para el criterio de búsqueda
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

const ReporteNominaVulnerabilidad = () => {
    const [filterText, setFilterText] = useState('');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generatingPDF, setGeneratingPDF] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const data = await ObtenerReporteNominaVulnerabilidad(filterText);
            setReportData(data);
            if (!data || data.length === 0) {
                toast.info("No se encontraron registros");
            } else {
                toast.success(`Se encontraron ${data.length} registros`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al obtener datos: " + error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        setGeneratingPDF(true);
        toast.promise(
            async () => {
                const path = await GenerarReporteNominaVulnerabilidadPDF(filterText);
                if (path) await AbrirUbicacionReporte(path);
                return path;
            },
            {
                loading: 'Generando Nómina PDF...',
                success: 'Reporte generado y guardado correctamente',
                error: (err) => `Error: ${err}`
            }
        ).finally(() => setGeneratingPDF(false));
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300 p-6 min-h-screen pb-20">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
                        <ClipboardList className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Nómina de Vulnerabilidad / NEE</h1>
                        <p className="text-slate-500 text-sm font-medium">Listado detallado para seguimiento y auditoría</p>
                    </div>
                </div>

                {reportData && reportData.length > 0 && (
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleExportPDF}
                            disabled={generatingPDF}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-bold shadow-md hover:shadow-emerald-200 active:scale-95 disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            <span>Descargar Nómina PDF</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-end gap-6 relative z-20">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Filtrar por Tipo de Caso (Opcional)</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Ej: Discapacidad, Violencia, Embarazo..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1 ml-1">Dejar vacío para ver todos los casos activos</p>
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
                                <span>Buscando...</span>
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-4 h-4" />
                                <span>Consultar Registros</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {reportData && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <SectionCard title={`Resultados de la Búsqueda (${reportData.length})`} icon={FileText}>
                        <DataTable
                            data={reportData}
                            columns={[
                                { header: 'Cédula', accessor: 'cedula' },
                                { header: 'Estudiante', accessor: 'estudiante', render: (row) => <span className="font-bold text-slate-700">{row.estudiante}</span> },
                                { header: 'Curso', accessor: 'curso' },
                                { header: 'Tipo de Caso', accessor: 'tipo_caso', render: (row) => <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-bold uppercase border border-emerald-100">{row.tipo_caso}</span> },
                                { header: 'Código', accessor: 'codigo_caso', render: (row) => <span className="font-mono text-xs">{row.codigo_caso}</span> },
                                { header: 'Estado', accessor: 'estado' },
                                { header: 'Fecha', accessor: 'fecha_deteccion' },
                            ]}
                        />
                    </SectionCard>
                </div>
            )}
        </div>
    );
};

export default ReporteNominaVulnerabilidad;
