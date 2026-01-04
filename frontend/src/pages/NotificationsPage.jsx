import React, { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronLeft, ChevronRight, Calendar, AlertCircle, ExternalLink } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ListarNotificacionesPaginadas, MarcarNotificacionLeida } from '../../wailsjs/go/services/NotificationsService';
import { useScreenLock } from '../context/ScreenLockContext';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const PAGE_SIZE = 20;

const NotificationsPage = () => {
  const { user } = useScreenLock();
  const role = user?.rol || 'admin';
  const navigate = useNavigate();

  const query = useQuery();
  const openId = query.get('open');

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const totalPages = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE));

  const load = async (p = page) => {
    setLoading(true);
    try {
      const res = await ListarNotificacionesPaginadas(role, p, PAGE_SIZE);
      setItems(res?.items || []);
      setTotal(res?.total || 0);
      setPage(res?.page || p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);

  }, [role]);

  useEffect(() => {
    const id = openId ? Number(openId) : null;
    if (!id || Number.isNaN(id)) return;

    (async () => {
      try {
        await MarcarNotificacionLeida(id);
        await load(page);
        const found = items.find(n => n.id === id);
        if (found) setSelectedNotification(found);
      } catch {
      }
    })();

  }, [openId]);

  const onSelectNotification = async (notification) => {
    setSelectedNotification(notification);
    if (!notification.leida) {
      try {
        await MarcarNotificacionLeida(notification.id);
        await load(page);
      } catch {
      }
    }
  };

  const parseMetadata = (metadataStr) => {
    try {
      if (!metadataStr) return null;
      return JSON.parse(metadataStr);
    } catch {
      return null;
    }
  };

  return (
    <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans">
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Bell className="w-7 h-7 text-indigo-600" /> Notificaciones
            </h1>
            <p className="text-slate-500 text-sm mt-1">Historial de notificaciones del sistema.</p>
          </div>
          <div className="hidden md:block text-right bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
            <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Total</span>
            <p className="text-xl font-bold text-indigo-700 leading-none">{total}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 220px)' }}>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="py-16 text-center text-slate-400">Cargando...</div>
              ) : items.length === 0 ? (
                <div className="py-16 text-center text-slate-400">No hay notificaciones.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {items.map(n => {
                    const isSelected = selectedNotification?.id === n.id;
                    return (
                      <div
                        key={n.id}
                        className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${isSelected ? 'bg-indigo-50 border-l-4 border-indigo-600' : n.leida ? 'bg-white' : 'bg-blue-50/30'
                          }`}
                        onClick={() => onSelectNotification(n)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${n.leida ? 'text-slate-600' : 'text-slate-900'}`}>
                              {n.titulo}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.mensaje || 'Sin descripción'}</p>
                            <p className="text-xs text-slate-400 mt-1">{n.fecha_creacion}</p>
                          </div>
                          {!n.leida && (
                            <div className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1"></div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
              <div className="text-xs text-slate-500">
                Pág. <span className="font-semibold text-slate-700">{page}</span> de <span className="font-semibold text-slate-700">{totalPages}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="inline-flex items-center px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => { const p = Math.max(1, page - 1); load(p); }}
                  disabled={page <= 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  className="inline-flex items-center px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => { const p = Math.min(totalPages, page + 1); load(p); }}
                  disabled={page >= totalPages || loading}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" style={{ maxHeight: 'calc(100vh - 220px)' }}>
            {selectedNotification ? (
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-slate-200 bg-linear-to-r from-indigo-50 to-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-slate-800 mb-2">{selectedNotification.titulo}</h2>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{selectedNotification.fecha_creacion}</span>
                        </div>
                        {selectedNotification.leida ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                            Leída
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
                            Nueva
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="prose prose-slate max-w-none">
                    {selectedNotification.mensaje && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">Resumen</h3>
                        <pre className="text-slate-600 leading-relaxed whitespace-pre-wrap font-sans text-sm">{selectedNotification.mensaje}</pre>
                      </div>
                    )}

                    {(() => {
                      const metadata = parseMetadata(selectedNotification.metadata);
                      if (!metadata || !metadata.citas || metadata.citas.length === 0) return null;

                      return (
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-indigo-600" />
                            Citas Programadas ({metadata.citas.length})
                          </h3>
                          <div className="space-y-3">
                            {metadata.citas.map((cita, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                                onClick={() => navigate(`/agenda?open=${cita.convocatoria_id}`)}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-slate-800 group-hover:text-indigo-700">{cita.estudiante_nombre}</p>
                                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">{cita.motivo}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {cita.fecha_cita}
                                      </span>
                                      <span className="text-slate-400">•</span>
                                      <span>{cita.entidad}</span>
                                      {cita.dias_para_cita !== undefined && (
                                        <>
                                          <span className="text-slate-400">•</span>
                                          <span className={`px-2 py-0.5 rounded-full font-semibold ${cita.dias_para_cita <= 1
                                            ? 'bg-red-100 text-red-700'
                                            : cita.dias_para_cita <= 3
                                              ? 'bg-yellow-100 text-yellow-700'
                                              : 'bg-green-100 text-green-700'
                                            }`}>
                                            {cita.dias_para_cita === 0 ? 'Hoy' : cita.dias_para_cita === 1 ? 'Mañana' : `En ${cita.dias_para_cita} días`}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <Bell className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg">Selecciona una notificación para ver los detalles</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;