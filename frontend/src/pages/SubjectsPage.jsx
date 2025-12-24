import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Pencil, BookOpen, Loader2, X, Filter, ToggleLeft, ToggleRight
} from 'lucide-react';
import { toast } from 'sonner';
import {
  GetMaterias, CreateMateria, UpdateMateria, ToggleMateriaState
} from '../../wailsjs/go/academic/SubjectService';

const SubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [selectedArea, setSelectedArea] = useState('Todos');
  const [formData, setFormData] = useState({
    nombre: '',
    area: ''
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setIsLoading(true);
      const data = await GetMaterias();
      setSubjects(data || []);
    } catch (error) {
      toast.error('Error al cargar materias: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const areas = useMemo(() => {
    const uniqueAreas = [...new Set(subjects.map(s => s.Area).filter(Boolean))];
    return ['Todos', ...uniqueAreas.sort()];
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    if (selectedArea === 'Todos') return subjects;
    return subjects.filter(s => s.Area === selectedArea);
  }, [subjects, selectedArea]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await UpdateMateria(editingSubject.ID, formData.nombre, formData.area);
        toast.success('Materia actualizada exitosamente');
      } else {
        await CreateMateria(formData.nombre, formData.area);
        toast.success('Materia creada exitosamente');
      }

      closeModal();
      loadSubjects();
    } catch (error) {
      toast.error('Error al guardar: ' + error);
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      nombre: subject.Nombre,
      area: subject.Area
    });
    setShowModal(true);
  };

  const handleToggleState = async (subject) => {
    try {
      await ToggleMateriaState(subject.ID);
      toast.success(`Materia ${subject.Activo ? 'desactivada' : 'activada'}`);
      loadSubjects();
    } catch (error) {
      toast.error('Error al cambiar estado: ' + error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSubject(null);
    setFormData({ nombre: '', area: '' });
  };

  return (
    <div className="min-h-full w-full bg-slate-50/50 font-sans">
      <div className="max-w-full mx-auto w-full flex flex-col gap-6">

        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 shadow-sm">
              <BookOpen className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Materias</h1>
              <p className="text-sm text-slate-500 font-medium">Catálogo de asignaturas</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative group">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 shadow-sm hover:border-slate-300 transition-all cursor-pointer">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="bg-transparent border-none outline-none cursor-pointer appearance-none pr-4"
                >
                  {areas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-sm font-semibold shadow-md hover:shadow-orange-200"
            >
              <Plus className="w-4 h-4" />
              Nueva Materia
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0">
          <div className="overflow-x-auto custom-scrollbar-light max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Área</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                        <span className="text-sm font-medium">Cargando materias...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <BookOpen className="w-10 h-10 text-slate-300" />
                        <p className="font-medium">No hay materias registradas</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((subject) => (
                    <tr key={subject.ID} className={`hover:bg-orange-50/30 transition-colors group ${!subject.Activo ? 'opacity-60 bg-slate-50' : ''}`}>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 text-sm">{subject.Nombre}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {subject.Area || 'Sin Área'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleState(subject)}
                          className={`transition-colors ${subject.Activo ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-400 hover:text-slate-500'}`}
                          title={subject.Activo ? "Desactivar" : "Activar"}
                        >
                          {subject.Activo ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(subject)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 shadow-sm"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
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
                <BookOpen className="w-5 h-5 text-orange-600" />
                {editingSubject ? 'Editar Materia' : 'Nueva Materia'}
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
                  Nombre de la Materia
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Matemáticas, Lengua y Literatura"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Área Académica
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ciencias Exactas, Humanidades"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                />
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
                  className="flex-1 px-4 py-2.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 shadow-md shadow-orange-200 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {editingSubject ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingSubject ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectsPage;
