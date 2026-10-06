import React, { useEffect, useRef, useState } from 'react';
import { CalendarRange, ChevronDown, Check, Lock, Eye, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { ListarPeriodos } from '../../wailsjs/go/academic/YearService';
import usePeriodoVista, { cambiarPeriodoVista } from '../hooks/usePeriodoVista';

// Selector del año que se está viendo. Cambiarlo no modifica el año de trabajo (periodo activo).
export function PeriodSelector() {
    const { periodo, esConsulta } = usePeriodoVista();
    const [open, setOpen] = useState(false);
    const [periodos, setPeriodos] = useState([]);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        ListarPeriodos().then((data) => setPeriodos(data || [])).catch(() => toast.error('Error al cargar los periodos'));
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    const seleccionar = async (p) => {
        setOpen(false);
        if (p.id === periodo?.id) return;
        try {
            await cambiarPeriodoVista(p.es_activo ? 0 : p.id);
        } catch (err) {
            toast.error(String(err));
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${esConsulta
                    ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                title="Año lectivo que se está viendo"
            >
                <CalendarRange className="w-4 h-4" />
                <span className="hidden sm:inline">Año:</span>
                {periodo ? periodo.nombre : 'Sin periodo'}
                <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Ver datos del año</p>
                    {periodos.length === 0 && <p className="px-4 py-2 text-sm text-slate-400">No hay periodos registrados</p>}
                    {periodos.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => seleccionar(p)}
                            className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left hover:bg-slate-50 ${p.id === periodo?.id ? 'font-bold text-purple-700' : 'text-slate-700'}`}
                        >
                            <span className="flex items-center gap-2">
                                {p.id === periodo?.id ? <Check className="w-4 h-4" /> : <span className="w-4" />}
                                {p.nombre}
                            </span>
                            {p.es_activo ? (
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700">Año de trabajo</span>
                            ) : p.cerrado ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500"><Lock className="w-3 h-3" />Cerrado</span>
                            ) : null}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Franja visible en toda la app cuando no se puede modificar el año que se está viendo.
export function PeriodBanner() {
    const { periodo, esConsulta, soloLectura } = usePeriodoVista();
    if (!periodo || !soloLectura) return null;

    if (esConsulta) {
        return (
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
                <span className="flex items-center gap-2 font-medium">
                    <Eye className="w-4 h-4 text-amber-600" />
                    Consultando el año <b>{periodo.nombre}</b> · Solo lectura
                </span>
                <button
                    type="button"
                    onClick={() => cambiarPeriodoVista(0).catch((err) => toast.error(String(err)))}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-amber-300 font-bold hover:bg-amber-100 transition-colors"
                >
                    <Undo2 className="w-4 h-4" /> Volver al año de trabajo
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 border-b border-slate-200 text-slate-700 text-sm">
            <Lock className="w-4 h-4 text-slate-500" />
            El año de trabajo <b>{periodo.nombre}</b> está cerrado · Solo lectura. Active el nuevo año en Periodos Lectivos para registrar datos.
        </div>
    );
}
