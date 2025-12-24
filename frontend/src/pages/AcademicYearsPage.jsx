import React, { useState, useEffect } from 'react';
import {
  Calendar, Plus, CheckCircle2, Clock,
  Pencil, Lock, Unlock, ToggleLeft, ToggleRight,
  School, Loader2, X, Trash2, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { confirmAction } from '../utils/alerts';
import {
  GetAniosLectivos, CreateAnioLectivo,
  UpdateAnioFechas, ActivateAnioLectivo, CloseAnioLectivo,
  DeleteAnioLectivo, CloneAnioStructure
} from '../../wailsjs/go/academic/YearService';

const AcademicYearsPage = () => {
  const [years, setYears] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    fechaInicio: '',
    fechaFin: ''
  });

  useEffect(() => {
    loadYears();
  }, []);

  const loadYears = async () => {
    try {
      setIsLoading(true);
      const data = await GetAniosLectivos();
      setYears(data || []);
    } catch (error) {
      toast.error('Error al cargar años lectivos: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const start = new Date(formData.fechaInicio).toISOString();
      const end = new Date(formData.fechaFin).toISOString();

      if (editingYear) {
        await UpdateAnioFechas(editingYear.ID, start, end);
        toast.success('Fechas actualizadas exitosamente');
      } else {
        await CreateAnioLectivo(formData.nombre, start, end);
        toast.success('Año lectivo creado exitosamente');
      }

      closeModal();
      loadYears();
    } catch (error) {
      toast.error('Error al guardar: ' + error);
    }
  };

  const handleEdit = (year) => {
    setEditingYear(year);
    setFormData({
      nombre: year.Nombre,
      fechaInicio: year.FechaInicio.split('T')[0],
      fechaFin: year.FechaFin.split('T')[0]
    });
    setShowModal(true);
  };

  const handleActivate = async (year) => {
    if (year.Cerrado) return;
    try {
      await ActivateAnioLectivo(year.ID);
      toast.success(`Año ${year.Nombre} activado`);
      loadYears();
    } catch (error) {
      toast.error('Error al activar año: ' + error);
    }
  };

  const handleCloseYear = async (year) => {
    const isConfirmed = await confirmAction(
      `¿Cerrar año ${year.Nombre}?`,
      'Esta acción no se puede deshacer y finalizará el periodo académico.',
      'Sí, cerrar año',
      'warning'
    );

    if (!isConfirmed) return;

    try {
      await CloseAnioLectivo(year.ID);
      toast.success(`Año ${year.Nombre} cerrado`);
      loadYears();
    } catch (error) {
      toast.error('Error al cerrar año: ' + error);
    }
  };

  const handleDelete = async (year) => {
    const isConfirmed = await confirmAction(
      `¿Eliminar año ${year.Nombre}?`,
      'Esta acción eliminará toda la estructura académica (cursos, materias). Solo es posible si NO hay estudiantes matriculados.',
      'Sí, eliminar',
      'error'
    );

    if (!isConfirmed) return;

    try {
      await DeleteAnioLectivo(year.ID);
      toast.success(`Año ${year.Nombre} eliminado`);
      loadYears();
    } catch (error) {
      toast.error('Error al eliminar: ' + error);
    }
  };

  const handleClone = async (targetYear) => {
    const availableYears = years.filter(y => y.ID !== targetYear.ID);

    if (availableYears.length === 0) {
      toast.error('No hay otros años disponibles para clonar');
      return;
    }

    const options = {};
    availableYears.forEach(y => {
      options[y.ID] = y.Nombre;
    });

    const { value: sourceYearID } = await Swal.fire({
      title: 'Importar Estructura',
      text: `Selecciona el año desde el cual copiar cursos y materias para ${targetYear.Nombre}`,
      input: 'select',
      inputOptions: options,
      inputPlaceholder: 'Selecciona un año',
      showCancelButton: true,
      confirmButtonText: 'Importar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#9333ea',
      cancelButtonColor: '#64748b',
      inputValidator: (value) => {
        return !value && 'Debes seleccionar un año';
      }
    });

    if (sourceYearID) {
      const loadingToast = toast.loading('Clonando estructura...');
      try {
        await CloneAnioStructure(parseInt(sourceYearID), targetYear.ID);
        toast.dismiss(loadingToast);
        toast.success('Estructura importada exitosamente');
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error('Error al clonar estructura: ' + error);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingYear(null);
    setFormData({ nombre: '', fechaInicio: '', fechaFin: '' });
  };

  const getStatusBadge = (year) => {
    if (year.Cerrado) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
          <Lock className="w-3.5 h-3.5" />
          Cerrado
        </span>
      );
    }
    if (year.Activo) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Activo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <Clock className="w-3.5 h-3.5" />
        Planificación
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-full w-full bg-slate-50/50 font-sans">
      <div className="max-w-full mx-auto w-full flex flex-col gap-6">

        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 shadow-sm">
              <School className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Años Lectivos</h1>
              <p className="text-sm text-slate-500 font-medium">Gestión de períodos académicos</p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-semibold shadow-md hover:shadow-purple-200"
          >
            <Plus className="w-4 h-4" />
            Nuevo Año
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0">
          <div className="overflow-x-auto custom-scrollbar-light max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Inicio</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Fin</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                        <span className="text-sm font-medium">Cargando períodos...</span>
                      </div>
                    </td>
                  </tr>
                ) : years.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="w-10 h-10 text-slate-300" />
                        <p className="font-medium">No hay años lectivos registrados</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  years.map((year) => (
                    <tr key={year.ID} className="hover:bg-purple-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 text-sm">{year.Nombre}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        {formatDate(year.FechaInicio)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        {formatDate(year.FechaFin)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(year)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!year.Cerrado && (
                            <button
                              onClick={() => handleActivate(year)}
                              className={`p-2 rounded-lg transition-all border border-transparent shadow-sm ${year.Activo
                                ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-100'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100'
                                }`}
                              title={year.Activo ? "Año en curso" : "Activar año"}
                            >
                              {year.Activo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                            </button>
                          )}

                          {!year.Cerrado && (
                            <button
                              onClick={() => handleEdit(year)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 shadow-sm"
                              title="Editar fechas"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}

                          {!year.Cerrado ? (
                            <button
                              onClick={() => handleCloseYear(year)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 shadow-sm"
                              title="Cerrar año lectivo"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-2 text-slate-300 bg-slate-50 rounded-lg cursor-not-allowed border border-slate-100"
                              title="Año cerrado"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}

                          {!year.Cerrado && (
                            <button
                              onClick={() => handleClone(year)}
                              className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all border border-transparent hover:border-purple-100 shadow-sm"
                              title="Importar estructura (cursos/materias)"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(year)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 shadow-sm"
                            title="Eliminar año"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 scale-100 transform transition-all">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                {editingYear ? 'Editar Fechas' : 'Nuevo Año Lectivo'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Nombre del Período
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingYear}
                  placeholder="Ej: 2025-2026"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium ${editingYear
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400'
                    }`}
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    value={formData.fechaFin}
                    onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md shadow-purple-200 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {editingYear ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingYear ? 'Guardar' : 'Crear Año'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicYearsPage;