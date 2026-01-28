import React, { useState, useEffect } from 'react';
import {
    Search, FileText, User, Users, ShieldAlert,
    AlertTriangle, Download, Loader2, Printer, FileWarning
} from 'lucide-react';
import { toast } from 'sonner';
import { BuscarEstudiantes, ObtenerFotoBase64 } from '../../../wailsjs/go/services/StudentService';
import { ObtenerDatosFichaEstudiantil, GenerarReporteFichaEstudiantil, AbrirUbicacionReporte } from '../../../wailsjs/go/reports/ReportService';

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
                No hay registros disponibles
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

const FichaEstudiantilReport = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentPhoto, setStudentPhoto] = useState(null);

    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);

    useEffect(() => {
        const search = async () => {
            if (searchTerm.length < 3) {
                setStudents([]);
                return;
            }
            setLoadingSearch(true);
            try {
                const results = await BuscarEstudiantes(searchTerm);
                setStudents(results || []);
            } catch (error) {
                console.error(error);
                toast.error("Error al buscar estudiantes");
            } finally {
                setLoadingSearch(false);
            }
        };

        const timeoutId = setTimeout(search, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleSelectStudent = async (student) => {
        setSelectedStudent(student);
        setSearchTerm('');
        setStudents([]);
        setReportData(null);
        setStudentPhoto(null);

        // Load photo
        try {
            const photo = await ObtenerFotoBase64(student.id);
            if (photo) setStudentPhoto(photo);
        } catch (e) {
            console.error("Error loading photo", e);
        }
    };

    const handleGenerateReport = async () => {
        if (!selectedStudent) return;

        setLoadingReport(true);
        try {
            const data = await ObtenerDatosFichaEstudiantil(selectedStudent.cedula);
            setReportData(data);
            toast.success("Reporte generado correctamente");
        } catch (error) {
            console.error(error);
            toast.error("Error al generar el reporte: " + error);
        } finally {
            setLoadingReport(false);
        }
    };

    const handleExportPDF = async () => {
        if (!selectedStudent) return;

        toast.promise(
            async () => {
                const path = await GenerarReporteFichaEstudiantil(selectedStudent.cedula);
                if (path) await AbrirUbicacionReporte(path);
                return path;
            },
            {
                loading: 'Generando PDF profesional...',
                success: 'Reporte generado y guardado correctamente',
                error: (err) => `Error: ${err}`
            }
        );
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300 p-6 min-h-screen">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                        <FileWarning className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Ficha Acumulativa</h1>
                        <p className="text-slate-500 text-sm font-medium">Historial académico y comportamental</p>
                    </div>
                </div>

                {reportData && (
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleExportPDF}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-bold shadow-md hover:shadow-blue-200 active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            <span>Descargar PDF</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 relative z-20">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar estudiante por nombre o cédula..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {loadingSearch && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        </div>
                    )}
                </div>

                {students.length > 0 && (
                    <div className="absolute top-16 left-0 right-0 z-50 bg-white rounded-xl shadow-xl border border-slate-200 max-h-80 overflow-y-auto mx-4">
                        {students.map((student) => (
                            <div
                                key={student.id}
                                onClick={() => handleSelectStudent(student)}
                                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-none flex items-center gap-4 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 border border-slate-200">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{student.apellidos} {student.nombres}</p>
                                    <p className="text-xs text-slate-500 font-mono">C.I: {student.cedula}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedStudent && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center md:items-start gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-slate-50 shadow-inner overflow-hidden shrink-0">
                        {studentPhoto ? (
                            <img src={studentPhoto} alt="Student" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <User className="w-10 h-10" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{selectedStudent.apellidos} {selectedStudent.nombres}</h2>
                            <p className="text-slate-500 font-medium">Cédula: <span className="font-mono text-slate-700">{selectedStudent.cedula}</span></p>
                        </div>

                        <div className="pt-2 flex justify-center md:justify-start">
                            <button
                                onClick={handleGenerateReport}
                                disabled={loadingReport}
                                className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 font-bold text-sm"
                            >
                                {loadingReport ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-4 h-4" />
                                        <span>Generar Ficha</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {reportData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">

                    <SectionCard title="A. Datos Personales" icon={User}>
                        <DataTable
                            data={reportData.datos_personales ? [reportData.datos_personales] : []}
                            columns={[
                                { header: 'Estudiante', render: (row) => `${row.apellidos} ${row.nombres}` },
                                { header: 'Cédula', accessor: 'cedula' },
                                { header: 'Fecha Nacimiento', accessor: 'fecha_nacimiento' },
                                { header: 'Curso', accessor: 'curso_actual' },
                                { header: 'Dirección', accessor: 'direccion_actual' },
                                { header: 'Email', accessor: 'correo_electronico' },
                                { header: 'Jornada', accessor: 'jornada' },
                            ]}
                        />
                    </SectionCard>

                    <SectionCard title="B. Datos Familiares" icon={Users}>
                        <DataTable
                            data={reportData.familiares || []}
                            columns={[
                                { header: 'Parentesco', accessor: 'parentesco' },
                                { header: 'Nombre', accessor: 'nombres_completos' },
                                { header: 'Teléfono', accessor: 'telefono_personal' },
                                { header: 'Es Representante', render: (row) => row.es_representante_legal ? 'Sí' : 'No' },
                                { header: 'Vive con Est.', render: (row) => row.vive_con_estudiante ? 'Sí' : 'No' },
                            ]}
                        />
                    </SectionCard>

                    <SectionCard title="C. Historial Disciplinario" icon={AlertTriangle}>
                        <DataTable
                            data={reportData.disciplina || []}
                            columns={[
                                { header: 'Año Lectivo', accessor: 'periodo_lectivo' },
                                { header: 'Fecha', accessor: 'fecha' },
                                { header: 'Motivo', accessor: 'motivo' },
                                { header: 'Detalle', accessor: 'detalle_sancion' },
                                { header: 'Estado', accessor: 'estado' },
                            ]}
                        />
                    </SectionCard>

                    <SectionCard title="D. Casos Sensibles (Seguimiento)" icon={ShieldAlert}>
                        <DataTable
                            data={reportData.casos_sensibles || []}
                            columns={[
                                { header: 'Código Caso', accessor: 'codigo_caso' },
                                { header: 'Tipo', accessor: 'tipo_caso' },
                                { header: 'Estado', accessor: 'estado' },
                                { header: 'Descripción', accessor: 'descripcion' },
                                { header: 'Fecha Detección', accessor: 'fecha_deteccion' },
                                { header: 'Derivación', accessor: 'entidad_derivacion' },
                            ]}
                        />
                    </SectionCard>

                </div>
            )}
        </div>
    );
};

export default FichaEstudiantilReport;
