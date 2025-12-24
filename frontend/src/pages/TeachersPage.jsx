import React, { useState, useEffect } from 'react';
import { 
  Plus, Pencil, Briefcase, Loader2, X, Search, ToggleLeft, ToggleRight, History, User
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  GetDocentes, CreateDocente, UpdateDocente, ToggleDocenteState, GetDocenteHistory 
} from '../../wailsjs/go/academic/TeacherService';

const TeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [selectedTeacherHistory, setSelectedTeacherHistory] = useState([]);
  const [selectedTeacherName, setSelectedTeacherName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    cedula: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: ''
  });

  useEffect(() => {
    loadTeachers();
  }, [searchQuery]);

  const loadTeachers = async () => {
    try {
      setIsLoading(true);
      const data = await GetDocentes(searchQuery);
      setTeachers(data || []);
    } catch (error) {
      toast.error('Error al cargar docentes: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await UpdateDocente(
          editingTeacher.ID, 
          formData.apellidos, 
          formData.nombres, 
          formData.email, 
          formData.telefono
        );
        toast.success('Docente actualizado exitosamente');
      } else {
        await CreateDocente(
          formData.cedula, 
          formData.apellidos, 
          formData.nombres, 
          formData.email, 
          formData.telefono
        );
        toast.success('Docente registrado exitosamente');
      }
      
      closeModal();
      loadTeachers();
    } catch (error) {
      toast.error('Error al guardar: ' + error);
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      cedula: teacher.Cedula,
      nombres: teacher.Nombres,
      apellidos: teacher.Apellidos,
      email: teacher.Email,
      telefono: teacher.Telefono
    });
    setShowModal(true);
  };

  const handleToggleState = async (teacher) => {
    try {
      await ToggleDocenteState(teacher.ID);
      toast.success(`Docente ${teacher.Activo ? 'desactivado' : 'activado'}`);
      loadTeachers();
    } catch (error) {
      toast.error('Error al cambiar estado: ' + error);
    }
  };

  const handleViewHistory = async (teacher) => {
    try {
      const history = await GetDocenteHistory(teacher.ID);
      setSelectedTeacherHistory(history || []);
      setSelectedTeacherName(`${teacher.Nombres} ${teacher.Apellidos}`);
      setShowHistoryModal(true);
    } catch (error) {
      toast.error('Error al cargar historial: ' + error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTeacher(null);
    setFormData({ cedula: '', nombres: '', apellidos: '', email: '', telefono: '' });
  };

  return (
    <div className="min-h-full w-full bg-slate-50/50 font-sans">
      <div className="max-w-full mx-auto w-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 shadow-sm">
              <Briefcase className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Docentes</h1>
              <p className="text-sm text-slate-500 font-medium">Gestión de personal académico</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative group w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 sm:text-sm transition-all"
                placeholder="Buscar por cédula o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all text-sm font-semibold shadow-md hover:shadow-teal-200 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nuevo Docente
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0">
          <div className="overflow-x-auto custom-scrollbar max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Docente</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                        <span className="text-sm font-medium">Cargando docentes...</span>
                      </div>
                    </td>
                  </tr>
                ) : teachers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                         <User className="w-10 h-10 text-slate-300" />
                         <p className="font-medium">No se encontraron docentes</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher) => (
                    <tr key={teacher.ID} className={`hover:bg-teal-50/30 transition-colors group ${!teacher.Activo ? 'opacity-60 bg-slate-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">{teacher.Apellidos} {teacher.Nombres}</span>
                          <span className="text-xs text-slate-500 font-mono">{teacher.Cedula}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-slate-600">{teacher.Email || '-'}</span>
                          <span className="text-xs text-slate-500">{teacher.Telefono || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleState(teacher)}
                          className={`transition-colors ${teacher.Activo ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-400 hover:text-slate-500'}`}
                          title={teacher.Activo ? "Desactivar" : "Activar"}
                        >
                          {teacher.Activo ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleViewHistory(teacher)}
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all border border-transparent hover:border-purple-100 shadow-sm"
                            title="Ver Historial"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEdit(teacher)}
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

      {/* Modal Formulario */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 scale-100 transform transition-all">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-600" />
                {editingTeacher ? 'Editar Docente' : 'Nuevo Docente'}
              </h3>
              <button 
                onClick={closeModal}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Cédula
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="10"
                    disabled={!!editingTeacher}
                    placeholder="10 dígitos"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium ${
                      editingTeacher 
                      ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' 
                      : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400'
                    }`}
                    value={formData.cedula}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({...formData, cedula: val});
                    }}
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Celular
                  </label>
                  <input
                    type="tel"
                    placeholder="09..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Nombres
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium uppercase"
                    value={formData.nombres}
                    onChange={(e) => setFormData({...formData, nombres: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium uppercase"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({...formData, apellidos: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-md shadow-teal-200 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {editingTeacher ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingTeacher ? 'Guardar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 scale-100 transform transition-all max-h-[80vh] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl shrink-0">
              <div>
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-600" />
                  Historial Académico
                </h3>
                <p className="text-sm text-slate-500">{selectedTeacherName}</p>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {selectedTeacherHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                  <p>No hay historial de carga horaria registrado.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedTeacherHistory.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800">{item.materia}</p>
                        <p className="text-sm text-slate-500">{item.curso} - {item.paralelo}</p>
                      </div>
                      <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm">
                        {item.anio}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersPage;
