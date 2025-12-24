import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Split, Loader2, X
} from 'lucide-react';
import { toast } from 'sonner';
import { confirmAction } from '../utils/alerts';
import { 
  GetParalelos, CreateParalelo, DeleteParalelo 
} from '../../wailsjs/go/academic/ParallelService';

const ParallelsPage = () => {
  const [parallels, setParallels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: ''
  });

  useEffect(() => {
    loadParallels();
  }, []);

  const loadParallels = async () => {
    try {
      setIsLoading(true);
      const data = await GetParalelos();
      setParallels(data || []);
    } catch (error) {
      toast.error('Error al cargar paralelos: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await CreateParalelo(formData.nombre.toUpperCase());
      toast.success('Paralelo creado exitosamente');
      closeModal();
      loadParallels();
    } catch (error) {
      toast.error('Error al guardar: ' + error);
    }
  };

  const handleDelete = async (parallel) => {
    const isConfirmed = await confirmAction(
      `¿Eliminar Paralelo ${parallel.Nombre}?`,
      'Esta acción eliminará el paralelo. Solo es posible si NO está asignado a ninguna aula.',
      'Sí, eliminar',
      'error'
    );

    if (!isConfirmed) return;

    try {
      await DeleteParalelo(parallel.ID);
      toast.success(`Paralelo ${parallel.Nombre} eliminado`);
      loadParallels();
    } catch (error) {
      toast.error('Error al eliminar: ' + error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ nombre: '' });
  };

  return (
    <div className="min-h-full w-full bg-slate-50/50 font-sans">
      <div className="max-w-full mx-auto w-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="p-3 bg-pink-50 rounded-xl border border-pink-100 shadow-sm">
              <Split className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Paralelos</h1>
              <p className="text-sm text-slate-500 font-medium">Catálogo de secciones (A, B, C...)</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all text-sm font-semibold shadow-md hover:shadow-pink-200"
          >
            <Plus className="w-4 h-4" />
            Nuevo Paralelo
          </button>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0">
          <div className="overflow-x-auto custom-scrollbar max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="2" className="px-6 py-20 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                        <span className="text-sm font-medium">Cargando paralelos...</span>
                      </div>
                    </td>
                  </tr>
                ) : parallels.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="px-6 py-20 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                         <Split className="w-10 h-10 text-slate-300" />
                         <p className="font-medium">No hay paralelos registrados</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  parallels.map((parallel) => (
                    <tr key={parallel.ID} className="hover:bg-pink-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-700 font-bold text-lg border border-slate-200 shadow-sm">
                          {parallel.Nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleDelete(parallel)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 scale-100 transform transition-all">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Split className="w-5 h-5 text-pink-600" />
                Nuevo Paralelo
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
                  Nombre (Letra)
                </label>
                <input
                  type="text"
                  required
                  maxLength="2"
                  placeholder="Ej: A, B, C"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-medium uppercase text-center"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value.toUpperCase()})}
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
                  className="flex-1 px-4 py-2.5 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 shadow-md shadow-pink-200 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParallelsPage;
