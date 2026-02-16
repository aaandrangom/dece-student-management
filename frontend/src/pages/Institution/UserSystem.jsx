import {
    Users, Save, Key, Eye, EyeOff, Shield,
    CheckCircle2, XCircle, Loader2, X, UserCog, Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { ListarUsuarios, CambiarMiClave, ActualizarUsuario } from "../../../wailsjs/go/services/UserService";
import { useState, useEffect } from 'react';

const UserSystem = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserToEdit, setCurrentUserToEdit] = useState(null);

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const cargarUsuarios = async () => {
        try {
            setIsLoading(true);
            const data = await ListarUsuarios();
            setUsuarios(data || []);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            toast.error('Error al cargar los usuarios');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenPasswordModal = (userId) => {
        setCurrentUserId(userId);
        setShowPasswordModal(true);
    };

    const handleOpenUserModal = (user) => {
        setCurrentUserToEdit(user);
        setShowUserModal(true);
    };

    const handleUserUpdated = () => {
        cargarUsuarios();
        setShowUserModal(false);
        setCurrentUserToEdit(null);
    };

    const getRolBadge = (rol) => {
        const styles = {
            admin: 'bg-purple-50 text-purple-700 border-purple-200',
            usuario: 'bg-blue-50 text-blue-700 border-blue-200',
            default: 'bg-slate-50 text-slate-700 border-slate-200'
        };

        const label = rol ? rol.charAt(0).toUpperCase() + rol.slice(1) : 'Desconocido';
        const style = styles[rol?.toLowerCase()] || styles.default;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${style}`}>
                <Shield className="w-3 h-3" />
                {label}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-3" />
                <p className="text-slate-500 font-medium">Cargando usuarios...</p>
            </div>
        );
    }

    return (
        <div className="min-h-full w-full bg-slate-50 font-sans p-6">
            <div className=" mx-auto w-full flex flex-col gap-6">

                <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 shadow-sm">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Gestión de Usuarios</h1>
                            <p className="text-sm text-slate-500 font-medium">Administra los accesos al sistema</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    {usuarios.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                            <Users className="w-12 h-12 mb-3 opacity-20" />
                            <p className="font-medium text-slate-600">No hay usuarios registrados</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rol</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Registro</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {usuarios.map((user) => (
                                        <tr key={user.id} className="hover:bg-purple-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 shadow-sm">
                                                        {user.nombre_completo.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{user.nombre_completo}</p>
                                                        <p className="text-xs text-slate-500">@{user.nombre_usuario}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getRolBadge(user.rol)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${user.activo
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-red-50 text-red-700 border-red-200'
                                                    }`}>
                                                    {user.activo ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    {user.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                                                {new Date(user.fecha_creacion).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenUserModal(user)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-lg transition-colors text-xs font-bold shadow-sm"
                                                        title="Editar datos"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenPasswordModal(user.id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-purple-600 hover:border-purple-200 rounded-lg transition-colors text-xs font-bold shadow-sm"
                                                        title="Cambiar clave"
                                                    >
                                                        <Key className="w-3.5 h-3.5" />
                                                        Clave
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showUserModal && (
                <UserEditModal
                    user={currentUserToEdit}
                    onClose={() => {
                        setShowUserModal(false);
                        setCurrentUserToEdit(null);
                    }}
                    onSuccess={handleUserUpdated}
                />
            )}

            {showPasswordModal && (
                <PasswordChangeModal
                    userId={currentUserId}
                    onClose={() => {
                        setShowPasswordModal(false);
                        setCurrentUserId(null);
                    }}
                />
            )}
        </div>
    );
};

const UserEditModal = ({ user, onClose, onSuccess }) => {
    const [nombreCompleto, setNombreCompleto] = useState(user?.nombre_completo || '');
    const [nombreUsuario, setNombreUsuario] = useState(user?.nombre_usuario || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        if (!nombreCompleto.trim() || !nombreUsuario.trim()) {
            toast.error('Todos los campos son obligatorios');
            return;
        }

        try {
            setIsSaving(true);
            await ActualizarUsuario(user.id, nombreUsuario, nombreCompleto);
            toast.success('Usuario actualizado correctamente');
            onSuccess();
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            toast.error(typeof error === 'string' ? error : 'Error al actualizar usuario');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 scale-100 transform transition-all">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                            <UserCog className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Editar Usuario</h2>
                            <p className="text-xs text-slate-500">Actualizar información básica</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre Completo</label>
                        <input
                            type="text"
                            value={nombreCompleto}
                            onChange={(e) => setNombreCompleto(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                            placeholder="Ej: Juan Pérez"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Usuario (Login)</label>
                        <input
                            type="text"
                            value={nombreUsuario}
                            onChange={(e) => setNombreUsuario(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                            placeholder="Ej: jperez"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-8 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

const PasswordChangeModal = ({ userId, onClose }) => {
    const [claveActual, setClaveActual] = useState('');
    const [claveNueva, setClaveNueva] = useState('');
    const [confirmarClave, setConfirmarClave] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isChanging, setIsChanging] = useState(false);

    const handleSubmit = async () => {
        if (!claveActual || !claveNueva || !confirmarClave) {
            toast.error('Por favor completa todos los campos');
            return;
        }

        if (claveNueva !== confirmarClave) {
            toast.error('Las contraseñas nuevas no coinciden');
            return;
        }

        if (claveNueva.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            setIsChanging(true);
            await CambiarMiClave(userId, claveActual, claveNueva);
            toast.success('Contraseña cambiada exitosamente');
            onClose();
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            toast.error(typeof error === 'string' ? error : 'Error al cambiar la contraseña');
        } finally {
            setIsChanging(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 scale-100 transform transition-all">

                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600 border border-purple-100">
                            <UserCog className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Cambiar Contraseña</h2>
                            <p className="text-xs text-slate-500">Actualizar credenciales de acceso</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Contraseña Actual</label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={claveActual}
                                onChange={(e) => setClaveActual(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all pr-10"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Nueva Contraseña</label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={claveNueva}
                                onChange={(e) => setClaveNueva(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all pr-10"
                                placeholder="Mínimo 6 caracteres"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Confirmar Contraseña</label>
                        <input
                            type={showNewPassword ? "text" : "password"}
                            value={confirmarClave}
                            onChange={(e) => setConfirmarClave(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                            placeholder="Repita la nueva contraseña"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isChanging}
                        className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md shadow-purple-200 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isChanging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Actualizar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserSystem;