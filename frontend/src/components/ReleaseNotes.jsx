import React, { useEffect } from 'react';
import { X, Sparkles, Wrench, Bug, Rocket } from 'lucide-react';
import changelog from '../changelog.json';

// Notas de versión: changelog.json es la fuente única. El script de release copia la
// entrada de la versión nueva a version.json para que los equipos instalados la vean
// en el aviso de actualización antes de actualizar.
export const CHANGELOG = changelog;
export const entradaDeVersion = (version) => changelog.find(e => e.version === version) || null;

const TIPOS = {
    nuevo: { label: 'Nuevo', icon: Sparkles, clase: 'bg-violet-50 text-violet-700 border-violet-100' },
    mejora: { label: 'Mejora', icon: Wrench, clase: 'bg-sky-50 text-sky-700 border-sky-100' },
    correccion: { label: 'Corrección', icon: Bug, clase: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
};
const ORDEN = ['nuevo', 'mejora', 'correccion'];

export const formatoFecha = (fecha) => {
    if (!fecha) return '';
    const d = new Date(`${fecha}T00:00`);
    return isNaN(d) ? fecha : d.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });
};

export function NotasLista({ notas = [] }) {
    if (notas.length === 0) {
        return <p className="text-sm text-slate-400">Sin detalle de cambios para esta versión.</p>;
    }
    return (
        <div className="space-y-4">
            {ORDEN.filter(t => notas.some(n => n.tipo === t)).map(tipo => {
                const { label, icon: Icon, clase } = TIPOS[tipo];
                return (
                    <div key={tipo}>
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${clase}`}>
                            <Icon className="w-3.5 h-3.5" /> {label}
                        </span>
                        <ul className="mt-2 space-y-1.5">
                            {notas.filter(n => n.tipo === tipo).map((n, i) => (
                                <li key={i} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
                                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                                    <span>{n.texto}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
}

// Modal con una o varias versiones. `acciones` permite agregar botones al pie (p. ej. "Actualizar ahora").
export function ReleaseNotesModal({ open, onClose, entradas = [], titulo = 'Notas de versión', subtitulo, acciones }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="release-notes-title"
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative px-6 py-5 bg-linear-to-br from-[#5b2c8a] to-[#3f1d63] text-white">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center ring-1 ring-white/20 shrink-0">
                            <Rocket className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h2 id="release-notes-title" className="text-lg font-bold">{titulo}</h2>
                            {subtitulo && <p className="text-sm text-white/75 mt-0.5">{subtitulo}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10" aria-label="Cerrar">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
                    {entradas.map((e, idx) => (
                        <section key={e.version}>
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                                <h3 className="text-base font-bold text-slate-800">Versión {e.version}</h3>
                                {idx === 0 && entradas.length > 1 && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700">Más reciente</span>}
                                {e.fecha && <span className="text-xs text-slate-400">{formatoFecha(e.fecha)}</span>}
                            </div>
                            {e.resumen && <p className="text-sm text-slate-500 mb-4">{e.resumen}</p>}
                            <NotasLista notas={e.notas} />
                        </section>
                    ))}
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                    {acciones}
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50">
                        {acciones ? 'Más tarde' : 'Cerrar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
