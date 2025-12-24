import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { 
    Calendar, 
    Clock, 
    MapPin, 
    Bell, 
    Plus, 
    Trash2, 
    Save, 
    X,
    CalendarDays,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { 
    GetAllCitas, 
    SaveCita, 
    DeleteCita 
} from '../../wailsjs/go/welfare/AgendaService';

const AgendaPage = () => {
    const [citas, setCitas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCita, setSelectedCita] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const emptyCita = {
        id: 0,
        fecha_cita: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
        motivo: '',
        entidad_destino: '',
        notificar_dias_antes: 1,
        estado: 'PENDIENTE'
    };

    const ENTITIES = [
        { value: 'FISCALIA', label: 'Fiscalía' },
        { value: 'DINAPEN', label: 'DINAPEN' },
        { value: 'JUNTA_PROTECCION', label: 'Junta de Protección' },
        { value: 'MIES', label: 'MIES' },
        { value: 'MINISTERIO_SALUD', label: 'Ministerio de Salud' },
        { value: 'UDAI', label: 'UDAI' },
        { value: 'REPRESENTANTE', label: 'Representante Legal' },
        { value: 'DOCENTE', label: 'Docente / Tutor' },
        { value: 'OTROS', label: 'Otros' }
    ];

    useEffect(() => {
        loadCitas();
    }, []);

    const loadCitas = async () => {
        setLoading(true);
        try {
            const data = await GetAllCitas();
            setCitas(data || []);
        } catch (err) {
            toast.error("Error cargando agenda: " + err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setSelectedCita({ ...emptyCita });
        setIsEditing(true);
    };

    const handleEdit = (cita) => {
        // Convert ISO string to datetime-local format
        const date = new Date(cita.fecha_cita);
        // Adjust for timezone offset to show correct local time in input
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        
        setSelectedCita({ 
            ...cita, 
            fecha_cita: localDate 
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!selectedCita.motivo) {
            toast.warning("El motivo es obligatorio");
            return;
        }
        if (!selectedCita.fecha_cita) {
            toast.warning("La fecha y hora son obligatorias");
            return;
        }

        try {
            const citaToSave = {
                ...selectedCita,
                fecha_cita: new Date(selectedCita.fecha_cita).toISOString(),
                notificar_dias_antes: parseInt(selectedCita.notificar_dias_antes)
            };

            await SaveCita(citaToSave);
            toast.success("Cita guardada correctamente");
            setIsEditing(false);
            setSelectedCita(null);
            loadCitas();
        } catch (err) {
            toast.error("Error al guardar: " + err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Estás seguro de eliminar esta cita?")) return;
        try {
            await DeleteCita(id);
            toast.success("Cita eliminada");
            if (selectedCita?.id === id) {
                setIsEditing(false);
                setSelectedCita(null);
            }
            loadCitas();
        } catch (err) {
            toast.error("Error al eliminar: " + err);
        }
    };

    const updateField = (field, value) => {
        setSelectedCita(prev => ({ ...prev, [field]: value }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDIENTE': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'REALIZADA': return 'bg-green-50 text-green-700 border-green-200';
            case 'CANCELADA': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="min-h-full w-full bg-slate-50/50 font-sans">
            <div className="mx-auto w-full flex flex-col gap-6">
                
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
                            <CalendarDays className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Agenda y Convocatorias</h1>
                            <p className="text-sm text-slate-500 font-medium">Gestión de citas y alertas tempranas</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleCreateNew}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Cita
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* List of Appointments */}
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Próximas Citas
                        </h3>

                        <div className="space-y-3">
                            {loading ? (
                                <div className="text-center py-8 text-slate-400">Cargando agenda...</div>
                            ) : citas.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">No hay citas programadas</p>
                                </div>
                            ) : (
                                citas.map(c => (
                                    <div 
                                        key={c.id}
                                        onClick={() => handleEdit(c)}
                                        className={`bg-white p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedCita?.id === c.id ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-slate-200 hover:border-indigo-300'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 text-lg">
                                                    {new Date(c.fecha_cita).getDate()}
                                                </span>
                                                <span className="text-xs text-slate-500 uppercase font-bold">
                                                    {new Date(c.fecha_cita).toLocaleString('es-ES', { month: 'short' })}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusColor(c.estado)}`}>
                                                {c.estado}
                                            </span>
                                        </div>
                                        
                                        <h4 className="font-bold text-slate-800 text-sm mb-1">{c.motivo}</h4>
                                        
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(c.fecha_cita).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        
                                        {c.entidad_destino && (
                                            <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                                                <MapPin className="w-3 h-3" />
                                                {c.entidad_destino}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Form / Details */}
                    <div className="lg:col-span-2">
                        {isEditing ? (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        {selectedCita.id === 0 ? <Plus className="w-4 h-4 text-indigo-500" /> : <Calendar className="w-4 h-4 text-indigo-500" />}
                                        {selectedCita.id === 0 ? 'Agendar Nueva Cita' : 'Detalles de la Cita'}
                                    </h3>
                                    {selectedCita.id !== 0 && (
                                        <button 
                                            onClick={() => handleDelete(selectedCita.id)}
                                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                            title="Eliminar cita"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                
                                <div className="p-6 space-y-6">
                                    {/* Fecha y Hora */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha y Hora</label>
                                            <input 
                                                type="datetime-local"
                                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                value={selectedCita.fecha_cita}
                                                onChange={(e) => updateField('fecha_cita', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</label>
                                            <select 
                                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                value={selectedCita.estado}
                                                onChange={(e) => updateField('estado', e.target.value)}
                                            >
                                                <option value="PENDIENTE">Pendiente</option>
                                                <option value="REALIZADA">Realizada</option>
                                                <option value="CANCELADA">Cancelada</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Motivo */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Motivo de la Cita</label>
                                        <input 
                                            type="text"
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                            placeholder="Ej: Reunión con Fiscalía, Entrevista con Padres..."
                                            value={selectedCita.motivo}
                                            onChange={(e) => updateField('motivo', e.target.value)}
                                        />
                                    </div>

                                    {/* Entidad y Alerta */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Entidad / Involucrado</label>
                                            <select 
                                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                value={selectedCita.entidad_destino}
                                                onChange={(e) => updateField('entidad_destino', e.target.value)}
                                            >
                                                <option value="">Seleccione...</option>
                                                {ENTITIES.map(e => (
                                                    <option key={e.value} value={e.value}>{e.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                <Bell className="w-3 h-3" />
                                                Alerta Temprana (Días antes)
                                            </label>
                                            <input 
                                                type="number"
                                                min="0"
                                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                value={selectedCita.notificar_dias_antes}
                                                onChange={(e) => updateField('notificar_dias_antes', e.target.value)}
                                            />
                                            <p className="text-[10px] text-slate-400">Se mostrará en el panel principal con anticipación</p>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-100 mt-4">
                                        <button 
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            onClick={handleSave}
                                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            Guardar Cita
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <Calendar className="w-16 h-16 mb-4 text-slate-300" />
                                <p className="font-medium">Selecciona una cita para ver detalles</p>
                                <p className="text-sm">o agenda una nueva reunión</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Toaster position="top-right" />
        </div>
    );
};

export default AgendaPage;