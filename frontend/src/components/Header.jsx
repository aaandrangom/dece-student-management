import React, { useState } from 'react';
import { Lock, User, Bell, Search, Menu, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useScreenLock } from '../context/ScreenLockContext';

const Header = () => {
  const { user, lockScreen, logout } = useScreenLock();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);

  const notifications = [
    { id: 1, text: 'Nueva actualización disponible', time: 'Hace 5 min', unread: true },
    { id: 2, text: 'Reporte mensual generado', time: 'Hace 1 hora', unread: true },
    { id: 3, text: 'Reunión programada para mañana', time: 'Hace 3 horas', unread: false }
  ];

  const roleMap = (rolString) => {
    console.log('Mapping role for:', rolString);
    switch (rolString) {
      case 'admin':
        return 'Administrador';
      case 'teacher':
        return 'Profesor';
      case 'student':
        return 'Estudiante';
      default:
        return 'Invitado';
    }
  }

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-8 w-full md:w-auto">
        <div className="relative w-full md:w-96">
          <div className={`flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 border-2 transition-all duration-200 ${searchFocus ? 'border-purple-300 bg-white shadow-lg shadow-purple-100' : 'border-transparent'
            }`}>
            <Search className={`w-4 h-4 transition-colors ${searchFocus ? 'text-purple-600' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Buscar en el sistema..."
              className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
            />
            <kbd className="hidden lg:inline-flex px-2 py-1 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        <button className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button className="md:hidden p-2.5 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all">
          <Search className="w-5 h-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 border border-transparent hover:border-purple-100"
            title="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-linear-to-r from-purple-50 to-indigo-50">
                  <h3 className="font-bold text-slate-800">Notificaciones</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{unreadCount} sin leer</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${notif.unread ? 'bg-purple-50/30' : ''
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {notif.unread && (
                          <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 shrink-0"></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 font-medium">{notif.text}</p>
                          <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-slate-50 text-center">
                  <button className="text-sm font-semibold text-purple-600 hover:text-purple-700">
                    Ver todas las notificaciones
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200"></div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 pl-4 hover:bg-slate-50 rounded-xl pr-3 py-2 transition-all duration-200 border border-transparent hover:border-slate-200"
          >
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-700 leading-none">
                {user?.nombre_completo || 'Usuario'}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                {roleMap(user.rol)}
              </span>
            </div>

            <div className="w-11 h-11 rounded-full bg-linear-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-md shadow-purple-200">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                <User className="w-6 h-6 text-purple-600" />
              </div>
            </div>

            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                <div className="p-2">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left">
                    <User className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-700 font-medium">Mi Perfil</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left">
                    <Settings className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-700 font-medium">Configuración</span>
                  </button>
                </div>

                <div className="p-2 border-t border-slate-100">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-red-50 transition-colors text-left group"
                  >
                    <LogOut className="w-4 h-4 text-slate-600 group-hover:text-red-600" />
                    <span className="text-sm text-slate-700 font-medium group-hover:text-red-600">Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200"></div>

        <button
          onClick={lockScreen}
          className="group relative p-2.5 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 border border-transparent hover:border-purple-100"
          title="Bloquear sesión"
        >
          <Lock className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="absolute right-1.5 top-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
