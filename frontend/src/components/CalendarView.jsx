import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, List } from 'lucide-react';

// Calendario mensual reutilizable (Convocatorias, Capacitaciones).
// events: [{ id, fecha: 'AAAA-MM-DD HH:MM' | 'AAAA-MM-DDTHH:MM', titulo, detalle, tono }]
// tono: clave de TONOS. onEventClick(evento). onDayCreate(fechaISO) opcional: crear en ese día.

export const TONOS = {
    indigo: { chip: 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100', dot: 'bg-indigo-500' },
    green: { chip: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100', dot: 'bg-emerald-500' },
    amber: { chip: 'bg-amber-50 text-amber-800 border-amber-100 hover:bg-amber-100', dot: 'bg-amber-500' },
    red: { chip: 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100', dot: 'bg-red-500' },
    sky: { chip: 'bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100', dot: 'bg-sky-500' },
    pink: { chip: 'bg-pink-50 text-pink-700 border-pink-100 hover:bg-pink-100', dot: 'bg-pink-500' },
    slate: { chip: 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200', dot: 'bg-slate-400' },
};

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MAX_POR_CELDA = 3;

const pad = (n) => String(n).padStart(2, '0');
const isoDia = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hora = (fecha) => (fecha || '').replace('T', ' ').slice(11, 16);

export function ViewToggle({ value, onChange }) {
    const opciones = [
        { id: 'lista', label: 'Lista', icon: List },
        { id: 'calendario', label: 'Calendario', icon: CalendarDays },
    ];
    return (
        <div className="inline-flex p-1 bg-slate-100 rounded-lg" role="tablist" aria-label="Tipo de vista">
            {opciones.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={value === id}
                    onClick={() => onChange(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${value === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Icon className="w-4 h-4" /> {label}
                </button>
            ))}
        </div>
    );
}

// Recuerda la vista elegida por pantalla (solo comodidad del usuario en este equipo).
export function useVistaGuardada(clave) {
    const [vista, setVista] = useState(() => {
        try { return localStorage.getItem(clave) || 'lista'; } catch { return 'lista'; }
    });
    const cambiar = (v) => {
        setVista(v);
        try { localStorage.setItem(clave, v); } catch { /* sin almacenamiento: solo en memoria */ }
    };
    return [vista, cambiar];
}

export default function CalendarView({ events, onEventClick, onDayCreate, leyenda = [], vacio = 'Sin eventos este mes' }) {
    const hoy = isoDia(new Date());
    const [mes, setMes] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const [diaSeleccionado, setDiaSeleccionado] = useState(null);

    const porDia = useMemo(() => {
        const mapa = {};
        for (const ev of events) {
            const dia = (ev.fecha || '').slice(0, 10);
            if (!dia) continue;
            (mapa[dia] ||= []).push(ev);
        }
        Object.values(mapa).forEach(lista => lista.sort((a, b) => hora(a.fecha).localeCompare(hora(b.fecha))));
        return mapa;
    }, [events]);

    // 6 semanas desde el lunes anterior (o igual) al día 1 del mes.
    const celdas = useMemo(() => {
        const inicio = new Date(mes);
        inicio.setDate(1 - ((mes.getDay() + 6) % 7));
        return Array.from({ length: 42 }, (_, i) => {
            const d = new Date(inicio);
            d.setDate(inicio.getDate() + i);
            return d;
        });
    }, [mes]);

    const totalMes = useMemo(() => {
        const prefijo = `${mes.getFullYear()}-${pad(mes.getMonth() + 1)}`;
        return events.filter(ev => (ev.fecha || '').startsWith(prefijo)).length;
    }, [events, mes]);

    const moverMes = (delta) => { setMes(new Date(mes.getFullYear(), mes.getMonth() + delta, 1)); setDiaSeleccionado(null); };
    const irHoy = () => { const d = new Date(); setMes(new Date(d.getFullYear(), d.getMonth(), 1)); setDiaSeleccionado(hoy); };

    const titulo = mes.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
    const eventosDia = diaSeleccionado ? porDia[diaSeleccionado] || [] : [];
    const puedeCrear = (dia) => onDayCreate && dia >= hoy;

    const Chip = ({ ev }) => (
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEventClick?.(ev); }}
            className={`w-full text-left text-[11px] leading-tight px-1.5 py-1 rounded-md border truncate transition-colors ${(TONOS[ev.tono] || TONOS.indigo).chip}`}
            title={`${hora(ev.fecha)} · ${ev.titulo}${ev.detalle ? ` — ${ev.detalle}` : ''}`}
        >
            <span className="font-bold">{hora(ev.fecha)}</span> {ev.titulo}
        </button>
    );

    return (
        <div className="@container bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Barra superior */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => moverMes(-1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Mes anterior"><ChevronLeft className="w-4 h-4" /></button>
                    <h2 className="text-base font-bold text-slate-800 capitalize min-w-36 text-center">{titulo}</h2>
                    <button type="button" onClick={() => moverMes(1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Mes siguiente"><ChevronRight className="w-4 h-4" /></button>
                    <button type="button" onClick={irHoy} className="ml-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Hoy</button>
                    <span className="ml-2 text-xs text-slate-400 font-medium">{totalMes} en el mes</span>
                </div>
                {leyenda.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3">
                        {leyenda.map(({ tono, label }) => (
                            <span key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
                                <span className={`w-2.5 h-2.5 rounded-full ${(TONOS[tono] || TONOS.indigo).dot}`} /> {label}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 @4xl:grid-cols-[minmax(0,1fr)_18rem]">
                {/* Cuadrícula del mes */}
                <div className="min-w-0">
                    <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                        {DIAS.map(d => (
                            <div key={d} className="px-2 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {celdas.map((d) => {
                            const dia = isoDia(d);
                            const delMes = d.getMonth() === mes.getMonth();
                            const lista = porDia[dia] || [];
                            const esHoy = dia === hoy;
                            const seleccionado = dia === diaSeleccionado;
                            return (
                                <div
                                    key={dia}
                                    onClick={() => setDiaSeleccionado(dia)}
                                    className={`group relative min-h-24 @2xl:min-h-28 p-1.5 border-b border-r border-slate-100 cursor-pointer transition-colors ${delMes ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/60 text-slate-300'} ${seleccionado ? 'ring-2 ring-inset ring-indigo-400' : ''}`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${esHoy ? 'bg-indigo-600 text-white' : delMes ? 'text-slate-600' : 'text-slate-300'}`}>
                                            {d.getDate()}
                                        </span>
                                        {puedeCrear(dia) && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); onDayCreate(dia); }}
                                                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-0.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-opacity"
                                                aria-label={`Agregar el ${dia}`}
                                                title="Agregar en este día"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Celda angosta: puntos. Celda amplia: chips con hora y título. */}
                                    <div className="flex flex-wrap gap-1 @2xl:hidden">
                                        {lista.slice(0, 6).map(ev => (
                                            <span key={ev.id} className={`w-2 h-2 rounded-full ${(TONOS[ev.tono] || TONOS.indigo).dot}`} />
                                        ))}
                                    </div>
                                    <div className="hidden @2xl:flex flex-col gap-1">
                                        {lista.slice(0, MAX_POR_CELDA).map(ev => <Chip key={ev.id} ev={ev} />)}
                                        {lista.length > MAX_POR_CELDA && (
                                            <span className="text-[11px] font-semibold text-slate-500 px-1">+{lista.length - MAX_POR_CELDA} más</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Detalle del día seleccionado */}
                <aside className="border-t @4xl:border-t-0 @4xl:border-l border-slate-200 p-4 bg-slate-50/50">
                    {!diaSeleccionado ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-8 text-slate-400">
                            <CalendarDays className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm font-medium">{totalMes === 0 ? vacio : 'Seleccione un día para ver el detalle'}</p>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-slate-700 capitalize">
                                    {new Date(`${diaSeleccionado}T00:00`).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </h3>
                                {puedeCrear(diaSeleccionado) && (
                                    <button
                                        type="button"
                                        onClick={() => onDayCreate(diaSeleccionado)}
                                        className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-indigo-700 rounded-md hover:bg-indigo-50"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Agregar
                                    </button>
                                )}
                            </div>
                            {eventosDia.length === 0 ? (
                                <p className="text-sm text-slate-400 py-4">Sin registros este día.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {eventosDia.map(ev => (
                                        <li key={ev.id}>
                                            <button
                                                type="button"
                                                onClick={() => onEventClick?.(ev)}
                                                className="w-full text-left bg-white border border-slate-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-sm transition-all"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${(TONOS[ev.tono] || TONOS.indigo).dot}`} />
                                                    <span className="text-xs font-bold text-slate-500">{hora(ev.fecha)}</span>
                                                    {ev.etiqueta && <span className="ml-auto text-[10px] font-bold uppercase text-slate-400">{ev.etiqueta}</span>}
                                                </div>
                                                <p className="text-sm font-semibold text-slate-800 leading-snug">{ev.titulo}</p>
                                                {ev.detalle && <p className="text-xs text-slate-500 mt-0.5 leading-snug">{ev.detalle}</p>}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
