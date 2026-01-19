import React, { useState } from 'react';
import { 
    Network, FileText, Calendar, Download, Loader2,
    Search, Building2, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { ObtenerReporteDerivaciones, GenerarReporteDerivacionesPDF, AbrirUbicacionReporte } from '../../../wailsjs/go/reports/ReportService';

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
                No se encontraron derivaciones en el periodo seleccionado
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

const ReporteDerivaciones = () => {
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
            const data = await ObtenerReporteDerivaciones(startDate, endDate);
            setReportData(data);
            if (!data || data.length === 0) {
                toast.info("No se encontraron derivaciones para el rango seleccionado");
            } else {
                toast.success(`Se encontraron ${data.length} derivaciones`);
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
                const path = await GenerarReporteDerivacionesPDF(startDate, endDate);
                if (path) await AbrirUbicacionReporte(path);
                return path;
            },
            {
                loading: 'Generando reporte de derivaciones...',
                success: 'Reporte generado y guardado correctamente',
                error: (err) => `Error al generar PDF: ${err}`
            }
        );
        setGeneratingPDF(false);
    };

    const columns = [
        { header: 'Fecha', accessor: 'fecha_deteccion' },
        { 
            header: 'Estudiante', 
            accessor: 'estudiante',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{row.estudiante}</span>
                    <span className="text-xs text-slate-400">{row.cedula}</span>
                </div>
            )
        },
        { header: 'Curso', accessor: 'curso' },
        { 
            header: 'Entidad Derivación', 
            accessor: 'entidad_derivacion',
            render: (row) => (
                <span className="flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                    <Building2 className="w-3 h-3" />
                    {row.entidad_derivacion}
                </span>
            )
        },
        { 
            header: 'Tipo Caso', 
            accessor: 'tipo_caso',
            render: (row) => <span className="text-xs uppercase font-semibold text-slate-500">{row.tipo_caso}</span>
        },
        { 
            header: 'Estado', 
            accessor: 'estado',
            render: (row) => (
                 <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    row.estado === 'Cerrado' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-amber-100 text-amber-700'
                }`}>
                    {row.estado}
                </span>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300 p-6 min-h-screen pb-20">
            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
                        <Network className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Articulación Interinstitucional</h1>
                        <p className="text-slate-500 text-sm font-medium">Registro de derivaciones a entidades externas</p>
                    </div>
                </div>
                
                {reportData && reportData.length > 0 && (
                     <div className="flex gap-3 w-full sm:w-auto">
                        <button 
                            onClick={handleExportPDF}
                            disabled={generatingPDF}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-bold shadow-md hover:shadow-indigo-200 active:scale-95 disabled:opacity-50"
                        >
                             {generatingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            <span>Exportar Derivaciones PDF</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Filter Card */}
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
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
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
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
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
                                <span>Consultando...</span>
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4" />
                                <span>Buscar Derivaciones</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Results */}
            {reportData && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                     <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4 flex items-center gap-3 text-indigo-800 text-sm">
                        <ExternalLink className="w-5 h-5 flex-shrink-0" />
                        <p>Listado de estudiantes derivados a organismos externos para seguimiento especializado.</p>
                    </div>

                    <SectionCard title={`Resultados de la Búsqueda (${reportData.length})`} icon={FileText} className={reportData.length > 0 ? "border-l-4 border-l-indigo-500" : ""}>
                        <DataTable data={reportData} columns={columns} />
                    </SectionCard>
                </div>
            )}
        </div>
    );
};

export default ReporteDerivaciones;
