import React, { useState } from 'react';
import {
    User, Loader2, AlertCircle, ShieldAlert,
    Lock, Eye, EyeOff, Shield
} from 'lucide-react';
import { VerificarClaveUsuario } from '../../wailsjs/go/services/SecurityConfigService';
import { useScreenLock } from '../context/ScreenLockContext';

const ModuleAuthGate = ({ onAuthenticated }) => {
    const { user } = useScreenLock();
    const [clave, setClave] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!clave.trim()) {
            setError('Ingrese su contraseña');
            return;
        }

        try {
            setIsVerifying(true);
            setError('');
            const valid = await VerificarClaveUsuario(user.id, clave);
            if (valid) {
                onAuthenticated();
            } else {
                setAttempts(prev => prev + 1);
                setError('Contraseña incorrecta');
                setClave('');
            }
        } catch (err) {
            setError('Error al verificar credenciales');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="min-h-full w-full bg-slate-50 font-sans flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                {/* Cabecera */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#5b2c8a]/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[#5b2c8a]/10 shadow-sm">
                        <Shield className="w-8 h-8 text-[#5b2c8a]" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Acceso Protegido</h2>
                    <p className="text-slate-500 mt-1 text-sm">
                        Verificación de identidad requerida
                    </p>
                </div>

                {/* Tarjeta de Autenticación */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">

                    {/* Usuario Actual */}
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-700 text-sm truncate">
                                {user?.nombre_completo || 'Usuario'}
                            </p>
                            <p className="text-xs text-slate-400 truncate">Ingrese su contraseña para continuar</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Contraseña
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock className="w-4 h-4 text-slate-300 group-focus-within:text-[#5b2c8a] transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={clave}
                                    onChange={(e) => { setClave(e.target.value); setError(''); }}
                                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all text-slate-700 placeholder:text-slate-300 ${error
                                            ? 'border-red-200 focus:ring-red-500/10 focus:border-red-500 bg-red-50/30'
                                            : 'border-slate-200 focus:ring-[#5b2c8a]/10 focus:border-[#5b2c8a] hover:border-slate-300'
                                        }`}
                                    placeholder="••••••••"
                                    autoFocus
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-xs font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-100/50 animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{error}</span>
                                {attempts >= 3 && (
                                    <span className="text-red-400 ml-auto font-mono">({attempts})</span>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isVerifying}
                            className="w-full py-2.5 bg-[#5b2c8a] text-white text-sm font-medium rounded-xl hover:bg-[#4a1d7c] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {isVerifying ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Lock className="w-4 h-4 opacity-80" />
                            )}
                            Verificar Identidad
                        </button>
                    </form>

                    {/* Nota informativa footer */}
                    <div className="mt-6 flex items-start gap-2.5 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                        <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            La protección de acceso puede ser desactivada desde{' '}
                            <span className="font-semibold text-slate-600">Configuración del Sistema</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModuleAuthGate;