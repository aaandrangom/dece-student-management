import React, { useState, useEffect } from 'react';
import {
  Users, AlertCircle, Calendar, ShieldAlert,
  TrendingUp, Activity, Clock, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { GetDashboardData } from '../../../wailsjs/go/dashboard/DashboardService';

const KPICard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 mt-2">{value}</h3>
        {subtitle && <p className="text-slate-400 text-xs mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const SimpleBarChart = ({ data, maxVal, labelKey, valueKey, colorClass = "bg-indigo-500" }) => (
  <div className="space-y-4">
    {data.map((item, idx) => {
      const val = item[valueKey];
      const percent = maxVal > 0 ? (val / maxVal) * 100 : 0;
      return (
        <div key={idx} className="group">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-medium text-slate-700">{item[labelKey]}</span>
            <span className="font-bold text-slate-900">{val}</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${colorClass}`}
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </div>
      );
    })}
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (typeof GetDashboardData === 'undefined') {
        throw new Error("El servicio de Dashboard no está disponible. Reinicie la aplicación.");
      }
      const dashboardData = await GetDashboardData();
      setData(dashboardData);
    } catch (err) {
      console.error(err);
      toast.error("Error cargando dashboard: " + err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Cargando indicadores...</div>;
  if (!data) return <div className="p-10 text-center text-slate-500">No hay datos disponibles</div>;

  const maxFaltas = Math.max(...(data.cursos_conflictivos?.map(c => c.cantidad_faltas) || [0]));
  const totalCasos = data.casos_por_tipo?.reduce((acc, curr) => acc + curr.cantidad, 0) || 1;

  return (
    <div className="p-6 min-h-full w-full bg-slate-50/50 font-sans animate-in fade-in duration-500">

      <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
            <Calendar className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Panel Principal</h1>
            <p className="text-sm text-slate-500 font-medium">Resumen de actividad y alertas del sistema</p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto justify-end">
          <span className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <Clock className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Estudiantes Activos"
          value={data.kpi?.total_estudiantes || 0}
          icon={Users}
          color="bg-blue-500"
          subtitle="Matriculados periodo actual"
        />
        <KPICard
          title="Casos Abiertos"
          value={data.kpi?.casos_abiertos || 0}
          icon={AlertCircle}
          color="bg-amber-500"
          subtitle="Atención prioritaria"
        />
        <KPICard
          title="Agenda Pendiente"
          value={data.kpi?.citas_pendientes || 0}
          icon={Clock}
          color="bg-violet-500"
          subtitle="Citas por realizar"
        />
        <KPICard
          title="Sanciones (Mes)"
          value={data.kpi?.sanciones_mes || 0}
          icon={ShieldAlert}
          color="bg-rose-500"
          subtitle="Llamados de atención"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-8">

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" /> Agenda Próxima
              </h3>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                {data.citas_proximas?.length || 0} pendientes
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {data.citas_proximas?.length > 0 ? (
                data.citas_proximas.map((cita, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                    <div className="bg-violet-50 text-violet-600 font-bold p-3 rounded-lg text-center min-w-15">
                      <span className="block text-lg">{new Date(cita.fecha_cita).getDate()}</span>
                      <span className="block text-xs uppercase">{new Date(cita.fecha_cita).toLocaleString('es-EC', { month: 'short' })}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800">{cita.estudiante}</h4>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{cita.curso}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1"><span className="font-medium text-slate-700">{cita.entidad}:</span> {cita.motivo}</p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(cita.fecha_cita).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm">No hay citas programadas próximamente.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" /> Actividad Reciente
              </h3>
            </div>
            <div className="p-5">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {data.actividad_reciente?.map((item, i) => {
                  const colors = {
                    'DISCIPLINA': 'bg-rose-100 text-rose-600 border-rose-200',
                    'CASO': 'bg-amber-100 text-amber-600 border-amber-200',
                    'TALLER': 'bg-blue-100 text-blue-600 border-blue-200'
                  }[item.tipo] || 'bg-slate-100 text-slate-600 border-slate-200';

                  return (
                    <div key={i} className="relative pl-8 md:pl-0">
                      <div className="mb-1 flex items-center gap-2 text-xs md:hidden">
                        <span className="font-bold text-slate-400">{new Date(item.fecha).toLocaleDateString()}</span>
                      </div>

                      <div className={`absolute left-0 top-1 h-5 w-5 rounded-full ring-4 ring-white border-2 flex items-center justify-center ${colors} bg-white z-10`} style={{ borderColor: 'currentColor' }}></div>

                      <div className="bg-slate-50 hover:bg-white rounded-lg p-3 border border-slate-200 hover:shadow-sm transition-all ml-2">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${colors.split(' ')[0]} ${colors.split(' ')[1]}`}>
                            {item.tipo}
                          </span>
                          <span className="text-xs text-slate-400">{new Date(item.fecha).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-700">{item.estudiante}</p>
                        <p className="text-sm text-slate-500">{item.descripcion}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-rose-600" /> Top Cursos (Faltas)
            </h3>
            <SimpleBarChart
              data={data.cursos_conflictivos || []}
              maxVal={maxFaltas}
              labelKey="curso"
              valueKey="cantidad_faltas"
              colorClass="bg-rose-400"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" /> Tipología Casos
            </h3>
            <div className="space-y-3">
              {data.casos_por_tipo?.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm font-medium text-slate-600 truncate max-w-[70%]">{c.tipo_caso || 'Sin especificar'}</span>
                  <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">{c.cantidad}</span>
                </div>
              ))}
              {(!data.casos_por_tipo || data.casos_por_tipo.length === 0) && <p className="text-slate-400 text-sm text-center">No hay casos registrados.</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Distribución
            </h3>
            <div className="flex items-end gap-2 h-32 px-4 pb-2 border-b border-slate-200">
              {data.estudiantes_genero?.map((g, i) => {
                const total = data.estudiantes_genero.reduce((a, b) => a + b.cantidad, 0);
                const h = total > 0 ? (g.cantidad / total) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-xs font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mb-auto">{g.cantidad}</span>
                    <div className="w-full bg-blue-100 rounded-t-lg relative group-hover:bg-blue-200 transition-colors" style={{ height: `${Math.max(h, 10)}%` }}></div>
                    <span className="text-xs font-bold text-slate-700">{g.genero}</span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;