import React, { useState } from 'react';
import {
    Search, UserMinus, Building, MapPin, Calendar, FileText, AlertTriangle, Loader2,
    Save, X, User, School
} from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { BuscarEstudiantesActivos } from '../../../wailsjs/go/services/TrackingService';
import { RegistrarRetiroCompleto } from '../../../wailsjs/go/services/EnrollmentService';

const StudentModifications = () => {
    const [query, setQuery] = useState('');
    const [students, setStudents] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        motivo: '',
        nuevaInstitucion: '',
        provinciaDestino: '',
        observaciones: ''
    });

    const handleSearch = async (e) => {
        const val = e.target.value;
        setQuery(val);
        if (val.length > 2) {
            setIsSearching(true);
            try {
                const results = await BuscarEstudiantesActivos(val);
                setStudents(results || []);
            } catch (error) {
                console.error("Error searching:", error);
            } finally {
                setIsSearching(false);
            }
        } else {
            setStudents([]);
        }
    };

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setFormData(prev => ({
            ...prev,
            fecha: new Date().toISOString().split('T')[0],
            motivo: '',
            nuevaInstitucion: '',
            provinciaDestino: '',
            observaciones: ''
        }));
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedStudent(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.motivo) {
            toast.error("El motivo es obligatorio");
            return;
        }

        const result = await Swal.fire({
            title: '¿Confirmar retiro?',
            html: `Está a punto de dar de baja al estudiante <b>${selectedStudent.apellidos} ${selectedStudent.nombres}</b>.<br/><br/>Esta acción finalizará su matrícula actual.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setIsSaving(true);
            try {
                await RegistrarRetiroCompleto(
                    selectedStudent.matricula_id,
                    formData.fecha,
                    formData.motivo,
                    formData.nuevaInstitucion,
                    formData.provinciaDestino,
                    formData.observaciones
                );

                toast.success("Estudiante dado de baja correctamente");
                handleCloseModal();
                setQuery('');
                setStudents([]);
            } catch (error) {
                console.error("Error withdrawing:", error);
                toast.error("Error al procesar el retiro: " + error);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const motivos = [
        "Cambio de Domicilio",
        "Pase a otra Institución",
        "Situación Económica",
        "Problemas de Salud",
        "Deserción / Abandono",
        "Migración",
        "Otros"
    ];

    return (
        <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans">
            <div className="space-y-6">

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="flex items-center gap-5 z-10">
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600 shadow-sm">
                            <UserMinus className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Baja de Estudiantes</h1>
                            <p className="text-slate-500 mt-1">Gestión de retiros y cambios de institución</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
                    <div className="max-w-xl">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Buscar Estudiante Activo</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={handleSearch}
                                placeholder="Cédula, Nombres o Apellidos..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-slate-700"
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border rounded-xl overflow-hidden border-slate-200">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Estudiante</th>
                                    <th className="px-6 py-4">Cédula</th>
                                    <th className="px-6 py-4">Curso Actual</th>
                                    <th className="px-6 py-4 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-slate-400">
                                            {query.length > 0 ? "No se encontraron estudiantes" : "Ingrese un criterio de búsqueda"}
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((st) => (
                                        <tr key={st.matricula_id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                                        <User size={16} />
                                                    </div>
                                                    {st.apellidos} {st.nombres}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-sm text-slate-500">{st.cedula}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-bold text-xs">
                                                    <School size={12} />
                                                    {st.curso}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleSelectStudent(st)}
                                                    className="px-3 py-1.5 bg-white border border-slate-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                                                >
                                                    Dar de Baja
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {isModalOpen && selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Procesar Retiro de Estudiante</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    {selectedStudent.apellidos} {selectedStudent.nombres} • {selectedStudent.cedula}
                                </p>
                            </div>
                            <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-800">
                                    <p className="font-bold mb-1">Advertencia</p>
                                    Este proceso cambiará el estado de la matrícula a "Retirado". Asegúrese de contar con la documentación de respaldo necesaria.
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                        Fecha de Retiro <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="date"
                                            required
                                            value={formData.fecha}
                                            onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                        Motivo <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formData.motivo}
                                        onChange={e => setFormData({ ...formData, motivo: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                    >
                                        <option value="">Seleccione motivo...</option>
                                        {motivos.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                        Institución de Destino
                                    </label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={formData.nuevaInstitucion}
                                            onChange={e => setFormData({ ...formData, nuevaInstitucion: e.target.value })}
                                            placeholder="Nombre de la nueva institución (si aplica)"
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                        Provincia / Lugar de Destino
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={formData.provinciaDestino}
                                            onChange={e => setFormData({ ...formData, provinciaDestino: e.target.value })}
                                            placeholder="Ej: Guayas, Guayaquil"
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                        Observaciones y Detalles Adicionales
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <textarea
                                            rows="3"
                                            value={formData.observaciones}
                                            onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                                            placeholder="Detalles adicionales sobre el retiro..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-5 py-2.5 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-2.5 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Confirmar Baja
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentModifications;
