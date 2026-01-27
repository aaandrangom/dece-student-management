import { useState, useEffect } from 'react';
import { CheckUpdate, DoUpdate } from "../../wailsjs/go/main/App";
import { Quit } from "../../wailsjs/runtime/runtime";
import { Download, RefreshCw, CheckCircle, XCircle, Sparkles, ArrowRight } from 'lucide-react';

export default function UpdateNotification() {
    const [status, setStatus] = useState('idle'); // idle, available, downloading, success, error
    const [versionInfo, setVersionInfo] = useState({ version: '', current: '' });
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        CheckUpdate().then((result) => {
            if (result.available) {
                setVersionInfo({ version: result.version, current: result.current });
                setStatus('available');
            }
        });
    }, []);

    const handleUpdateClick = async () => {
        setStatus('downloading');
        const result = await DoUpdate();

        if (result === "SUCCESS") {
            setStatus('success');
            setTimeout(() => {
                Quit();
            }, 3000);
        } else {
            setErrorMessage(result);
            setStatus('error');
        }
    };

    if (status === 'idle') return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-right-10 fade-in duration-500">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
                {/* Decorative Background Glows */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl group-hover:bg-purple-600/30 transition-all duration-700"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    {status === 'available' && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0 border border-purple-500/30">
                                    <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-semibold text-lg leading-tight mb-1">
                                        Actualización Disponible
                                    </h3>
                                    <p className="text-slate-400 text-sm">
                                        La versión <span className="text-purple-300 font-bold">{versionInfo.version}</span> está lista.
                                        <span className="block text-xs mt-1 opacity-70">Versión actual: {versionInfo.current}</span>
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleUpdateClick}
                                className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-purple-500/25 active:scale-95 group/btn"
                            >
                                <Download className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" />
                                Actualizar Ahora
                            </button>
                        </div>
                    )}

                    {status === 'downloading' && (
                        <div className="flex flex-col items-center justify-center py-2 text-center space-y-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-purple-500 blur-lg opacity-20 animate-pulse"></div>
                                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin relative z-10" />
                            </div>
                            <div>
                                <h3 className="text-white font-medium">Descargando actualización...</h3>
                                <p className="text-slate-400 text-xs mt-1">La aplicación se cerrará automáticamente.</p>
                            </div>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex items-center gap-4 py-1">
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center shrink-0 border border-green-500/30">
                                <CheckCircle className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">¡Actualización Exitosa!</h3>
                                <p className="text-green-300/80 text-sm">Reiniciando sistema...</p>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-white font-medium">Error al actualizar</h3>
                                    <p className="text-red-300/70 text-sm mt-1 leading-relaxed">
                                        {errorMessage || "Ha ocurrido un error inesperado."}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setStatus('available')}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm py-2 rounded-lg transition-colors border border-white/5"
                            >
                                Intentar de nuevo
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}