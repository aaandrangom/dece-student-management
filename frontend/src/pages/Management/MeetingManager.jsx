import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { useLocation } from 'react-router-dom';
import {
    Clock, CheckCircle, Trash2,
    Plus, Search, User, Filter, Loader2, X, Edit2, MoreVertical,
    CalendarDays, MapPin, Bell, AlignLeft, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
    AgendarCita, ListarCitas, MarcarCompletada,
    EliminarCita, ObtenerCita, ActualizarCita
} from '../../../wailsjs/go/services/ManagementService';
import { BuscarEstudiantesActivos } from '../../../wailsjs/go/services/TrackingService';

function useQuery() {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
}

export default function MeetingManager() {
    const query = useQuery();
    const openCitaId = query.get('open');

    const [meetings, setMeetings] = useState([]);
    const [stats, setStats] = useState({ pendientes: 0, total: 0 });
    const [activeFilter, setActiveFilter] = useState('pendientes');
    const [dateFilter, setDateFilter] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [studentQuery, setStudentQuery] = useState('');
    const [studentResults, setStudentResults] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openActions, setOpenActions] = useState(null);

    const initialForm = {
        id: 0,
        entidad: 'Representante',
        motivo: '',
        fecha_cita: '',
        dias_alerta: 2
    };

    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        loadMeetings();
        setCurrentPage(1);
    }, [activeFilter, dateFilter]);

    useEffect(() => {
        const onMouseDown = (event) => {
            if (event.target.closest('[data-actions-anchor="true"]')) return;
            if (event.target.closest('[data-actions-flyout="true"]')) return;
            setOpenActions(null);
        };

        const onRepositionOrClose = () => {
            setOpenActions(null);
        };

        document.addEventListener('mousedown', onMouseDown);
        window.addEventListener('scroll', onRepositionOrClose, true);
        window.addEventListener('resize', onRepositionOrClose);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('scroll', onRepositionOrClose, true);
            window.removeEventListener('resize', onRepositionOrClose);
        };
    }, []);

    const loadMeetings = async () => {
        try {
            const filtroDTO = { tipo: activeFilter, fecha_solo: dateFilter };
            const data = await ListarCitas(filtroDTO);
            setMeetings(data || []);
            if (data) {
                setStats({
                    total: data.length,
                    pendientes: data.filter(c => !c.completada).length
                });
            }
        } catch (error) { toast.error("Error al cargar agenda"); }
    };

    const handleToggleComplete = async (id, currentStatus) => {
        const willComplete = !currentStatus;
        const result = await Swal.fire({
            title: willComplete ? '¿Marcar como realizada?' : '¿Marcar como pendiente?',
            text: willComplete
                ? 'La cita se marcará como realizada.'
                : 'La cita volverá al estado pendiente.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: willComplete ? 'Sí, marcar' : 'Sí, cambiar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        setOpenActions(null);

        try {
            await MarcarCompletada(id, willComplete);
            toast.success('Estado actualizado');
            loadMeetings();
        } catch (error) {
            toast.error('Error al actualizar');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar esta cita?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        setOpenActions(null);

        try {
            await EliminarCita(id);
            toast.success('Eliminada');
            loadMeetings();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (studentQuery.length >= 3) {
                setIsSearching(true);
                try {
                    const res = await BuscarEstudiantesActivos(studentQuery);
                    setStudentResults(res || []);
                } catch (e) { } finally { setIsSearching(false); }
            } else { setStudentResults([]); }
        }, 400);
        return () => clearTimeout(timeoutId);
    }, [studentQuery]);

    useEffect(() => {
        const id = openCitaId ? Number(openCitaId) : null;
        if (!id || Number.isNaN(id)) return;

        if (meetings.length > 0) {
            handleEdit(id);
        }

    }, [openCitaId, meetings.length]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedStudent) return toast.error("Seleccione un estudiante");

        setIsSubmitting(true);
        try {
            const fechaFormateada = formData.fecha_cita.replace('T', ' ');
            const basePayload = {
                matricula_id: selectedStudent.matricula_id,
                entidad: formData.entidad,
                motivo: formData.motivo,
                fecha_cita: fechaFormateada,
                dias_alerta: parseInt(formData.dias_alerta)
            };

            if (formData.id && formData.id > 0) {
                await ActualizarCita({ id: formData.id, ...basePayload });
                toast.success("Cita actualizada");
            } else {
                await AgendarCita(basePayload);
                toast.success("Cita agendada");
            }
            setIsModalOpen(false);
            resetForm();
            loadMeetings();
        } catch (error) { toast.error("Error: " + error); }
        finally { setIsSubmitting(false); }
    };

    const resetForm = () => {
        setFormData(initialForm);
        setSelectedStudent(null);
        setStudentQuery('');
        setStudentResults([]);
    };

    const handleEdit = async (id) => {
        try {
            setOpenActions(null);
            const data = await ObtenerCita(id);
            setFormData({
                id: data.id,
                entidad: data.entidad || 'Representante',
                motivo: data.motivo || '',
                fecha_cita: (data.fecha_cita || '').replace(' ', 'T'),
                dias_alerta: data.dias_alerta ?? 2,
            });

            setSelectedStudent({
                matricula_id: data.matricula_id,
                nombres: data.nombres || '',
                apellidos: data.apellidos || '',
                curso: data.curso || '',
            });

            setIsModalOpen(true);
        } catch (e) {
            toast.error('No se pudo cargar la cita');
        }
    };

    const toggleActionsMenu = (citaId, anchorEl) => {
        if (!anchorEl) return;
        if (openActions?.id === citaId) {
            setOpenActions(null);
            return;
        }

        const rect = anchorEl.getBoundingClientRect();
        const menuEstimatedHeight = 132; // ~3 items
        const openUp = rect.bottom + menuEstimatedHeight > window.innerHeight - 8;

        setOpenActions({ id: citaId, rect, openUp });
    };

    const renderActionsMenu = () => {
        if (!openActions) return null;

        const cita = meetings.find(m => m.id === openActions.id);
        if (!cita) return null;

        const menuWidth = 192;
        const gap = 8;

        const left = Math.max(8, Math.min(openActions.rect.right - menuWidth, window.innerWidth - menuWidth - 8));
        const top = openActions.openUp
            ? Math.max(8, openActions.rect.top - gap)
            : Math.min(openActions.rect.bottom + gap, window.innerHeight - 8);

        return createPortal(
            <div
                data-actions-flyout="true"
                className="fixed z-9999"
                style={{ left, top, transform: openActions.openUp ? 'translateY(-100%)' : 'translateY(0)' }}
            >
                <div className="w-48 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <button
                        type="button"
                        onClick={() => handleEdit(cita.id)}
                        className="w-full px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <Edit2 className="w-4 h-4" />
                        Ver / Editar
                    </button>
                    <button
                        type="button"
                        onClick={() => handleToggleComplete(cita.id, cita.completada)}
                        className="w-full px-3 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-colors flex items-center gap-2"
                    >
                        <CheckCircle className="w-4 h-4" />
                        {cita.completada ? 'Marcar pendiente' : 'Marcar realizada'}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDelete(cita.id)}
                        className="w-full px-3 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                    </button>
                </div>
            </div>,
            document.body
        );
    };

    const formatFechaVista = (fechaStr) => {
        const date = new Date(fechaStr);
        try {
            return date.toLocaleString('es-EC', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return date.toString();
        }
    };

    const totalPages = Math.max(1, Math.ceil(meetings.length / rowsPerPage));
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedMeetings = meetings.slice(startIndex, endIndex);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleRowsPerPageChange = (newSize) => {
        setRowsPerPage(newSize);
        setCurrentPage(1);
    };

    return (
        <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans animate-in fade-in duration-300">
            <div className="flex flex-col gap-6">

                <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <CalendarDays className="w-7 h-7 text-indigo-600" /> Agenda de Citas
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Gestiona reuniones con representantes y entidades externas.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                        <div className="hidden md:block text-right bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                            <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Pendientes</span>
                            <p className="text-xl font-bold text-indigo-700 leading-none">{stats.pendientes}</p>
                        </div>
                        <button
                            onClick={() => { resetForm(); setIsModalOpen(true); }}
                            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus className="w-5 h-5" /> Nueva Cita
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex gap-1 w-full md:w-auto">
                        <button
                            onClick={() => setActiveFilter('pendientes')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 md:flex-none ${activeFilter === 'pendientes' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            Pendientes
                        </button>
                        <button
                            onClick={() => setActiveFilter('todas')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 md:flex-none ${activeFilter === 'todas' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            Histórico
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto justify-between md:justify-start">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600 font-medium">Fecha</span>
                        </div>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => { setDateFilter(e.target.value); setActiveFilter('rango'); }}
                            className="bg-transparent text-sm text-slate-700 outline-none font-medium cursor-pointer"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Fecha y hora</th>
                                    <th className="px-6 py-4">Entidad</th>
                                    <th className="px-6 py-4">Motivo</th>
                                    <th className="px-6 py-4">Estudiante</th>
                                    <th className="px-6 py-4">Curso</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {meetings.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-center text-slate-400">No hay citas programadas.</td>
                                    </tr>
                                ) : (
                                    paginatedMeetings.map((cita) => (
                                        <tr key={cita.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-700">{formatFechaVista(cita.fecha_hora)}</td>
                                            <td className="px-6 py-4 text-sm text-slate-700 font-medium">{cita.entidad}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{cita.motivo || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-slate-800 font-bold">{cita.estudiante_nombre}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{cita.curso}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${cita.completada ? 'bg-green-100 text-green-700' : cita.alerta ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>
                                                    {cita.completada ? 'Realizada' : cita.alerta ? 'Próxima' : 'Programada'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex" data-actions-anchor="true">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => toggleActionsMenu(cita.id, e.currentTarget)}
                                                        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="Opciones"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {meetings.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-white gap-4">
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-slate-500">
                                    Mostrando <span className="font-semibold text-slate-700">{startIndex + 1}</span> a <span className="font-semibold text-slate-700">{Math.min(endIndex, meetings.length)}</span> de <span className="font-semibold text-slate-700">{meetings.length}</span> resultados
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-600">Filas:</span>
                                    <select
                                        value={rowsPerPage}
                                        onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                                        className="border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Anterior
                                </button>
                                <span className="text-sm text-slate-600">
                                    Página <span className="font-semibold text-slate-700">{currentPage}</span> de <span className="font-semibold text-slate-700">{totalPages}</span>
                                </span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Siguiente <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {renderActionsMenu()}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">

                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    {formData.id > 0 ? (
                                        <>
                                            <Edit2 className="w-5 h-5 text-indigo-600" /> Editar Cita
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5 text-indigo-600" /> Agendar Nueva Cita
                                        </>
                                    )}
                                </h3>
                                <p className="text-xs text-slate-500">Programación de reuniones y notificaciones.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto bg-slate-50/50">
                            <form onSubmit={handleSave} className="space-y-6">

                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <User className="w-3 h-3" /> Estudiante
                                    </label>

                                    {!selectedStudent ? (
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar por apellido o cédula..."
                                                value={studentQuery}
                                                onChange={(e) => setStudentQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                                                autoFocus
                                            />
                                            {isSearching && <Loader2 className="absolute right-3 top-3 w-4 h-4 text-indigo-500 animate-spin" />}

                                            {studentResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                                                    {studentResults.map(est => (
                                                        <div key={est.id} onClick={() => { setSelectedStudent(est); setStudentQuery(''); setStudentResults([]); }} className="p-3 hover:bg-indigo-50 cursor-pointer transition-colors group">
                                                            <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700">{est.apellidos} {est.nombres}</p>
                                                            <p className="text-xs text-slate-500">{est.curso}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-3 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                                    {selectedStudent.nombres.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-indigo-900 text-sm">{selectedStudent.apellidos} {selectedStudent.nombres}</p>
                                                    <p className="text-xs text-indigo-600">{selectedStudent.curso}</p>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => setSelectedStudent(null)} className="text-xs bg-white border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded hover:bg-indigo-600 hover:text-white transition-all font-medium">
                                                Cambiar
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className={`grid grid-cols-1 md:grid-cols-12 gap-5 transition-opacity duration-300 ${!selectedStudent ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>

                                    <div className="md:col-span-7 space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Fecha y Hora</label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="datetime-local"
                                                    required
                                                    value={formData.fecha_cita}
                                                    onChange={(e) => setFormData({ ...formData, fecha_cita: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Entidad</label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                                    <select
                                                        value={formData.entidad}
                                                        onChange={(e) => setFormData({ ...formData, entidad: e.target.value })}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm appearance-none"
                                                    >
                                                        <option value="Representante">Representante</option>
                                                        <option value="Fiscalía">Fiscalía</option>
                                                        <option value="UDAI">UDAI</option>
                                                        <option value="MSP">MSP (Salud)</option>
                                                        <option value="Rectorado">Rectorado</option>
                                                        <option value="Otro">Otro</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Días Alerta</label>
                                                <div className="relative">
                                                    <Bell className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="30"
                                                        value={formData.dias_alerta}
                                                        onChange={(e) => setFormData({ ...formData, dias_alerta: e.target.value })}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-5 flex flex-col">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Motivo de la Cita</label>
                                        <div className="relative flex-1">
                                            <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                            <textarea
                                                rows="5"
                                                placeholder="Describa brevemente el propósito de la reunión..."
                                                value={formData.motivo}
                                                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm h-full resize-none"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={isSubmitting || !selectedStudent} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 shadow-sm hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {formData.id > 0 ? 'Actualizar Cita' : 'Agendar Cita'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}