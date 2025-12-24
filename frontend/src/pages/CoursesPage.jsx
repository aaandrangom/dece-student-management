import React, { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, Layers, Loader2, X, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { confirmAction } from '../utils/alerts';
import {
  GetCursos, CreateCurso, UpdateCurso, DeleteCurso
} from '../../wailsjs/go/academic/CourseService';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    nivel: ''
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const data = await GetCursos();
      setCourses(data || []);
    } catch (error) {
      toast.error('Error al cargar cursos: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const nivelInt = parseInt(formData.nivel);

      if (editingCourse) {
        await UpdateCurso(editingCourse.ID, formData.nombre, nivelInt);
        toast.success('Curso actualizado exitosamente');
      } else {
        await CreateCurso(formData.nombre, nivelInt);
        toast.success('Curso creado exitosamente');
      }

      closeModal();
      loadCourses();
    } catch (error) {
      toast.error('Error al guardar: ' + error);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      nombre: course.Nombre,
      nivel: course.Nivel
    });
    setShowModal(true);
  };

  const handleDelete = async (course) => {
    const isConfirmed = await confirmAction(
      `¿Eliminar ${course.Nombre}?`,
      'Esta acción eliminará el curso. Solo es posible si NO está asignado a ninguna aula.',
      'Sí, eliminar',
      'error'
    );

    if (!isConfirmed) return;

    try {
      await DeleteCurso(course.ID);
      toast.success(`Curso ${course.Nombre} eliminado`);
      loadCourses();
    } catch (error) {
      toast.error('Error al eliminar: ' + error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCourse(null);
    setFormData({ nombre: '', nivel: '' });
  };

  return (
    <div className="min-h-full w-full bg-slate-50/50 font-sans">
      <div className="max-w-full mx-auto w-full flex flex-col gap-6">

        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
              <Layers className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Cursos y Niveles</h1>
              <p className="text-sm text-slate-500 font-medium">Catálogo de grados académicos</p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-semibold shadow-md hover:shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            Nuevo Curso
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0">
          <div className="overflow-x-auto custom-scrollbar-light max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24 text-center">Nivel</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre del Curso</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-20 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <span className="text-sm font-medium">Cargando cursos...</span>
                      </div>
                    </td>
                  </tr>
                ) : courses.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-20 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Layers className="w-10 h-10 text-slate-300" />
                        <p className="font-medium">No hay cursos registrados</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course.ID} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-sm border border-slate-200">
                          {course.Nivel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 text-sm">{course.Nombre}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(course)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 shadow-sm"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(course)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 shadow-sm"
                            title="Eliminar"
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
                <Layers className="w-5 h-5 text-indigo-600" />
                {editingCourse ? 'Editar Curso' : 'Nuevo Curso'}
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
                  Nombre del Curso
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Octavo EGB, Primero BGU"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Nivel Numérico
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    max="20"
                    placeholder="Ej: 8, 9, 10"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    value={formData.nivel}
                    onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 pl-1">
                  Se usa para ordenar los cursos (Ej: 8 para Octavo, 11 para 1ro BGU)
                </p>
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
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {editingCourse ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingCourse ? 'Guardar' : 'Crear Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;