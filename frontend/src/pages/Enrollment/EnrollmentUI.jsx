import React, { useState } from 'react';
import { X, Plus, Search, Upload, Eye, FileText, Check } from 'lucide-react';
import { BuscarEstudiantes } from '../../../wailsjs/go/services/StudentService';
import { toast } from 'sonner';

export const SectionTitle = ({ title, icon: Icon }) => (
    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-100">
        <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-600 shadow-sm">
            {Icon && <Icon className="w-5 h-5" />}
        </div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h3>
    </div>
);

export const PreviewModal = ({ fileBase64, onClose }) => {
    if (!fileBase64) return null;
    const isPdf = fileBase64.includes('application/pdf');

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl ring-1 ring-slate-900/5 scale-100 transform transition-all">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                        <Eye className="w-5 h-5 text-indigo-600" /> Vista Previa
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 bg-slate-50/50 p-6 overflow-hidden flex justify-center items-center relative">
                    {isPdf ? (
                        <iframe
                            src={fileBase64}
                            className="w-full h-full rounded-xl border border-slate-200 bg-white shadow-sm"
                            title="PDF Preview"
                        ></iframe>
                    ) : (
                        <img
                            src={fileBase64}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export const InputGroup = ({ label, children }) => (
    <div className="mb-4 w-full">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">{label}</label>
        {children}
    </div>
);

export const BaseInput = (props) => (
    <input
        {...props}
        className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 placeholder:text-slate-400 font-medium ${props.className}`}
    />
);

export const BaseSelect = (props) => (
    <div className="relative">
        <select
            {...props}
            className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 appearance-none cursor-pointer font-medium ${props.className}`}
        >
            {props.children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
    </div>
);

export const FileUploader = ({ label, path, onSelect, onPreview }) => (
    <InputGroup label={label}>
        <div className="group border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-indigo-400 hover:bg-indigo-50/10 transition-all bg-slate-50/30">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-lg shrink-0 ${path ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                        {path ? <Check className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-700 truncate">
                            {path ? 'Archivo cargado' : 'Seleccionar archivo'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                            {path || 'Ningún archivo seleccionado'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={onSelect}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
                    >
                        Examinar
                    </button>
                    {path && (
                        <button
                            onClick={() => onPreview(path)}
                            className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                            title="Ver archivo"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    </InputGroup>
);

export const TagManager = ({ title, tags, onAdd, onRemove, placeholder, suggestions = [] }) => {
    const [inputVal, setInputVal] = useState("");
    const [selectedId, setSelectedId] = useState("");

    const handleAdd = () => {
        if (suggestions.length > 0) {
            if (!selectedId) return;
            const item = suggestions.find(s => s.id === parseInt(selectedId));
            if (item) { onAdd(item); setSelectedId(""); }
        } else {
            if (!inputVal.trim()) return;
            onAdd(inputVal.trim());
            setInputVal("");
        }
    };

    return (
        <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 pl-1">{title}</label>
            <div className="flex gap-2 mb-3">
                {suggestions.length > 0 ? (
                    <div className="flex-1">
                        <BaseSelect value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                            <option value="">Seleccione una opción...</option>
                            {suggestions.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </BaseSelect>
                    </div>
                ) : (
                    <BaseInput
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        placeholder={placeholder}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                )}
                <button
                    onClick={handleAdd}
                    className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-12 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {tags.length > 0 ? (
                    tags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-sm animate-in zoom-in-95 duration-200">
                            {typeof tag === 'object' ? tag.nombre : tag}
                            <button
                                onClick={() => onRemove(idx)}
                                className="hover:bg-red-50 hover:text-red-500 rounded-md p-0.5 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))
                ) : (
                    <span className="text-xs text-slate-400 italic py-1 self-center w-full text-center flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4 opacity-50" /> Sin elementos agregados
                    </span>
                )}
            </div>
        </div>
    );
};

export const PartnerSearch = ({ onSelect }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (query.length < 3) return toast.warning("Ingrese al menos 3 letras");
        setLoading(true);
        try {
            const data = await BuscarEstudiantes(query);
            setResults(data || []);
            if (!data || data.length === 0) toast.info("No se encontraron coincidencias");
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
            <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        placeholder="Buscar por apellido o cédula..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <button
                    onClick={handleSearch}
                    type="button"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 text-sm font-bold"
                >
                    {loading ? '...' : 'Buscar'}
                </button>
            </div>

            {results.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-sm custom-scrollbar">
                    {results.map(st => (
                        <div
                            key={st.id}
                            onClick={() => onSelect(st)}
                            className="p-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition-colors border-b border-slate-100 last:border-0 group"
                        >
                            <span className="font-bold text-slate-700 text-sm group-hover:text-indigo-700">{st.apellidos} {st.nombres}</span>
                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 group-hover:bg-white">{st.cedula}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}