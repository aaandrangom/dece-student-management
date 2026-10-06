import { useState, useEffect } from 'react';
import { CheckUpdate, DoUpdate, RestartApp, GetVersion } from "../../wailsjs/go/main/App";
import { Download, RefreshCw, CheckCircle, XCircle, Sparkles, X, ChevronRight } from 'lucide-react';
import { ReleaseNotesModal, entradaDeVersion, formatoFecha } from './ReleaseNotes';

const CLAVE_VERSION_VISTA = 'sigdece_version_vista';
const CLAVE_POSPUESTA = 'sigdece_actualizacion_pospuesta';

const leer = (storage, clave) => { try { return storage.getItem(clave); } catch { return null; } };
const guardar = (storage, clave, valor) => { try { storage.setItem(clave, valor); } catch { /* sin almacenamiento */ } };

export default function UpdateNotification() {
    const [status, setStatus] = useState('idle'); // idle, available, downloading, success, error
    const [update, setUpdate] = useState(null);    // { version, current, fecha, resumen, notas }
    const [errorMessage, setErrorMessage] = useState('');
    const [verNotasUpdate, setVerNotasUpdate] = useState(false);
    const [novedades, setNovedades] = useState(null); // entrada del changelog de la versión instalada

    useEffect(() => {
        CheckUpdate().then((result) => {
            if (!result?.available) return;
            setUpdate(result);
            // "Más tarde" oculta el aviso hasta reiniciar la app, solo para esa versión.
            if (leer(sessionStorage, CLAVE_POSPUESTA) !== result.version) setStatus('available');
        }).catch(() => { });

        // Primera vez que se abre una versión nueva: mostrar sus novedades una sola vez.
        GetVersion().then((actual) => {
            const vista = leer(localStorage, CLAVE_VERSION_VISTA);
            guardar(localStorage, CLAVE_VERSION_VISTA, actual);
            if (vista && vista !== actual) {
                const entrada = entradaDeVersion(actual);
                if (entrada) setNovedades(entrada);
            }
        }).catch(() => { });
    }, []);

    const handleUpdateClick = async () => {
        setVerNotasUpdate(false);
        setStatus('downloading');
        const result = await DoUpdate();
        if (result === "SUCCESS") {
            setStatus('success');
            // Unos segundos para leer el mensaje y reiniciar con la versión nueva.
            setTimeout(() => RestartApp(), 3000);
        } else {
            setErrorMessage(result);
            setStatus('error');
        }
    };

    const posponer = () => {
        guardar(sessionStorage, CLAVE_POSPUESTA, update?.version || '');
        setVerNotasUpdate(false);
        setStatus('idle');
    };

    const notas = update?.notas || [];
    const entradaUpdate = update ? { version: update.version, fecha: update.fecha, resumen: update.resumen, notas } : null;

    return (
        <>
            <ReleaseNotesModal
                open={!!novedades}
                onClose={() => setNovedades(null)}
                entradas={novedades ? [novedades] : []}
                titulo={`¡Bienvenido a la versión ${novedades?.version || ''}!`}
                subtitulo="Esto es lo nuevo en SIGDECE"
            />

            <ReleaseNotesModal
                open={verNotasUpdate && !!entradaUpdate}
                onClose={() => setVerNotasUpdate(false)}
                entradas={entradaUpdate ? [entradaUpdate] : []}
                titulo={`Versión ${update?.version || ''} disponible`}
                subtitulo={`Tiene instalada la versión ${update?.current || ''}`}
                acciones={
                    <button
                        onClick={handleUpdateClick}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#5b2c8a] hover:bg-[#4a1d7c] flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Actualizar ahora
                    </button>
                }
            />

            {status !== 'idle' && (
                <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-right-10 fade-in duration-500">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
                        {status === 'available' && (
                            <>
                                <div className="px-5 pt-5 pb-4 bg-linear-to-br from-[#5b2c8a] to-[#3f1d63] text-white relative">
                                    <button onClick={posponer} className="absolute top-3 right-3 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10" aria-label="Recordar más tarde">
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center ring-1 ring-white/20 shrink-0">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/70 font-medium">Actualización disponible</p>
                                            <h3 className="font-bold text-lg leading-tight">Versión {update.version}</h3>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/70 mt-3">
                                        Tiene la {update.current}{update.fecha ? ` · Publicada el ${formatoFecha(update.fecha)}` : ''}
                                    </p>
                                </div>

                                <div className="px-5 py-4">
                                    {update.resumen && <p className="text-sm font-medium text-slate-700">{update.resumen}</p>}
                                    {notas.length > 0 ? (
                                        <>
                                            <ul className="mt-2 space-y-1.5">
                                                {notas.slice(0, 3).map((n, i) => (
                                                    <li key={i} className="flex gap-2 text-xs text-slate-600 leading-relaxed">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                                                        <span className="line-clamp-2">{n.texto}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <button
                                                onClick={() => setVerNotasUpdate(true)}
                                                className="mt-2 flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-800"
                                            >
                                                Ver todas las novedades ({notas.length}) <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    ) : !update.resumen && (
                                        <p className="text-sm text-slate-500">Incluye mejoras y correcciones.</p>
                                    )}

                                    <div className="flex gap-2 mt-4">
                                        <button onClick={posponer} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">
                                            Más tarde
                                        </button>
                                        <button
                                            onClick={handleUpdateClick}
                                            className="flex-[1.4] py-2.5 rounded-xl text-sm font-bold text-white bg-[#5b2c8a] hover:bg-[#4a1d7c] flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            <Download className="w-4 h-4" /> Actualizar ahora
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-2 text-center">La aplicación se reinicia sola al terminar.</p>
                                </div>
                            </>
                        )}

                        {status === 'downloading' && (
                            <div className="flex items-center gap-4 p-5">
                                <RefreshCw className="w-8 h-8 text-violet-500 animate-spin shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-slate-800">Descargando versión {update?.version}...</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">No cierre la aplicación. Se reiniciará automáticamente.</p>
                                </div>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="flex items-center gap-4 p-5">
                                <div className="w-11 h-11 bg-green-50 rounded-full flex items-center justify-center shrink-0 border border-green-100">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">¡Actualización lista!</h3>
                                    <p className="text-sm text-green-700">Reiniciando el sistema...</p>
                                </div>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="p-5 space-y-3">
                                <div className="flex items-start gap-3">
                                    <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-slate-800">No se pudo actualizar</h3>
                                        <p className="text-sm text-red-600/80 mt-1 leading-relaxed">{errorMessage || 'Ocurrió un error inesperado.'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={posponer} className="flex-1 py-2 rounded-lg text-sm text-slate-600 border border-slate-200 hover:bg-slate-50">Cerrar</button>
                                    <button onClick={() => setStatus('available')} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700">Intentar de nuevo</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
