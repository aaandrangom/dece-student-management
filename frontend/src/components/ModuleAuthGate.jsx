import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Loader2, AlertCircle, ShieldCheck, Lock, Eye, EyeOff,
    ClipboardList, HeartHandshake, FileLock2, ArrowLeft, Info, ArrowBigUp
} from 'lucide-react';
import { VerificarClaveUsuario } from '../../wailsjs/go/services/SecurityConfigService';
import { ObtenerFotoPerfilBase64 } from '../../wailsjs/go/services/UserService';
import { useScreenLock } from '../context/ScreenLockContext';

const MAX_INTENTOS = 5;
const BLOQUEO_SEGUNDOS = 30;
// Tras verificar, no se vuelve a pedir la clave durante este tiempo (solo en memoria:
// se pierde al cerrar o recargar la app).
const VIGENCIA_MS = 10 * 60 * 1000;

let autorizacion = null; // { userId, hasta }

export const moduloAutorizado = (userId) =>
    !!autorizacion && autorizacion.userId === userId && Date.now() < autorizacion.hasta;

const contenidoProtegido = [
    { icon: ClipboardList, texto: 'Llamados de atención y medidas disciplinarias' },
    { icon: HeartHandshake, texto: 'Casos sensibles y derivaciones a entidades externas' },
    { icon: FileLock2, texto: 'Actas, resoluciones y evidencias adjuntas' },
];

const ModuleAuthGate = ({ onAuthenticated }) => {
    const { user } = useScreenLock();
    const navigate = useNavigate();
    const [clave, setClave] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const [intentos, setIntentos] = useState(0);
    const [bloqueadoHasta, setBloqueadoHasta] = useState(null);
    const [segundosRestantes, setSegundosRestantes] = useState(0);
    const [capsLock, setCapsLock] = useState(false);
    const [shakeKey, setShakeKey] = useState(0);
    const [foto, setFoto] = useState(null);
    const passwordRef = useRef(null);

    const bloqueado = bloqueadoHasta !== null;
    const iniciales = (user?.nombre_completo || 'U')
        .split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

    useEffect(() => {
        if (!user?.id) return;
        ObtenerFotoPerfilBase64(user.id).then(b64 => b64 && setFoto(b64)).catch(() => { });
    }, [user?.id]);

    // Cuenta regresiva del bloqueo por intentos fallidos.
    useEffect(() => {
        if (!bloqueadoHasta) return;
        const tick = () => {
            const restante = Math.ceil((bloqueadoHasta - Date.now()) / 1000);
            if (restante <= 0) {
                setBloqueadoHasta(null);
                setIntentos(0);
                setError('');
                setSegundosRestantes(0);
                setTimeout(() => passwordRef.current?.focus(), 50);
            } else {
                setSegundosRestantes(restante);
            }
        };
        tick();
        const id = setInterval(tick, 500);
        return () => clearInterval(id);
    }, [bloqueadoHasta]);

    const handleKey = (e) => setCapsLock(e.getModifierState?.('CapsLock') ?? false);

    const fallar = (mensaje) => {
        setError(mensaje);
        setShakeKey(k => k + 1);
        setTimeout(() => passwordRef.current?.focus(), 50);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (bloqueado || isVerifying) return;
        if (!clave.trim()) return fallar('Ingrese su contraseña');

        try {
            setIsVerifying(true);
            setError('');
            const valid = await VerificarClaveUsuario(user.id, clave);
            if (valid) {
                autorizacion = { userId: user.id, hasta: Date.now() + VIGENCIA_MS };
                onAuthenticated();
                return;
            }
            const nuevos = intentos + 1;
            setIntentos(nuevos);
            setClave('');
            if (nuevos >= MAX_INTENTOS) {
                setBloqueadoHasta(Date.now() + BLOQUEO_SEGUNDOS * 1000);
                fallar('Demasiados intentos fallidos.');
            } else {
                const quedan = MAX_INTENTOS - nuevos;
                fallar(`Contraseña incorrecta. ${quedan === 1 ? 'Queda 1 intento' : `Quedan ${quedan} intentos`}.`);
            }
        } catch {
            fallar('No se pudo verificar la contraseña. Intente nuevamente.');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="@container min-h-full w-full bg-slate-50 font-sans flex items-center justify-center p-6">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden grid grid-cols-1 @2xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">

                {/* Panel informativo: qué protege este acceso */}
                <div className="relative bg-linear-to-br from-[#5b2c8a] to-[#3f1d63] text-white p-8 flex flex-col justify-between gap-8 overflow-hidden">
                    <div className="absolute -right-16 -bottom-16 w-56 h-56 rounded-full bg-white/5" aria-hidden="true" />
                    <div className="absolute -right-4 top-10 w-24 h-24 rounded-full bg-white/5" aria-hidden="true" />

                    <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-5 ring-1 ring-white/20">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Área confidencial</p>
                        <h1 className="text-2xl font-bold mt-1">Seguimiento DECE</h1>
                        <p className="text-sm text-white/75 mt-2 leading-relaxed">
                            Este módulo contiene información sensible de los estudiantes. Confirme su identidad para continuar.
                        </p>
                    </div>

                    <ul className="relative space-y-3">
                        {contenidoProtegido.map(({ icon: Icon, texto }) => (
                            <li key={texto} className="flex items-start gap-3 text-sm text-white/85">
                                <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                    <Icon className="w-4 h-4" />
                                </span>
                                <span className="pt-1 leading-snug">{texto}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Formulario de verificación */}
                <div className="p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-7">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-[#5b2c8a]/10 text-[#5b2c8a] flex items-center justify-center font-bold text-lg ring-4 ring-[#5b2c8a]/5 shrink-0">
                            {foto ? <img src={foto} alt="" className="w-full h-full object-cover" /> : iniciales}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-slate-400 font-medium">Verificando como</p>
                            <p className="font-bold text-slate-800 truncate">{user?.nombre_completo || 'Usuario'}</p>
                            {user?.cargo && <p className="text-xs text-slate-500 truncate">{user.cargo}</p>}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <div key={shakeKey} className={shakeKey > 0 ? 'motion-safe:animate-shake' : ''}>
                            <label htmlFor="module-auth-password" className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Contraseña de su cuenta
                            </label>
                            <div className="relative group">
                                <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${error ? 'text-red-400' : 'text-slate-300 group-focus-within:text-[#5b2c8a]'}`} />
                                <input
                                    id="module-auth-password"
                                    ref={passwordRef}
                                    type={showPassword ? 'text' : 'password'}
                                    value={clave}
                                    onChange={(e) => { setClave(e.target.value); if (!bloqueado) setError(''); }}
                                    onKeyDown={handleKey}
                                    onKeyUp={handleKey}
                                    disabled={bloqueado}
                                    aria-invalid={!!error}
                                    aria-describedby={error ? 'module-auth-error' : undefined}
                                    className={`w-full pl-10 pr-11 py-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-4 focus:bg-white transition-all text-slate-700 placeholder:text-slate-300 disabled:opacity-60 disabled:cursor-not-allowed ${error
                                        ? 'border-red-300 focus:ring-red-500/10 focus:border-red-500'
                                        : 'border-slate-200 focus:ring-[#5b2c8a]/10 focus:border-[#5b2c8a] hover:border-slate-300'}`}
                                    placeholder="Ingrese su contraseña"
                                    autoFocus
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
                                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            {capsLock && !bloqueado && (
                                <p className="flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-700">
                                    <ArrowBigUp className="w-3.5 h-3.5" /> Bloq Mayús está activado
                                </p>
                            )}
                        </div>

                        <div aria-live="polite">
                            {error && (
                                <div id="module-auth-error" className="flex items-start gap-2 text-red-700 text-xs font-medium bg-red-50 px-3 py-2.5 rounded-lg border border-red-100">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>
                                        {error}
                                        {bloqueado && <> Intente de nuevo en <b>{segundosRestantes} s</b>.</>}
                                    </span>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isVerifying || bloqueado}
                            className="w-full py-3 bg-[#5b2c8a] text-white text-sm font-semibold rounded-xl hover:bg-[#4a1d7c] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] shadow-sm shadow-[#5b2c8a]/20"
                        >
                            {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                            {isVerifying ? 'Verificando...' : bloqueado ? `Bloqueado (${segundosRestantes} s)` : 'Verificar y entrar'}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/panel-principal')}
                            className="w-full py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Volver al panel principal
                        </button>
                    </form>

                    <p className="mt-6 flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                            El acceso se mantiene 10 minutos. Esta verificación puede desactivarse en{' '}
                            <span className="font-semibold text-slate-500">Configuración del Sistema</span>.
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ModuleAuthGate;
