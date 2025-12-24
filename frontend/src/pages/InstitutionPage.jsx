import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { 
    Building2, 
    Save, 
    Upload, 
    MapPin, 
    Hash, 
    School,
    ImageIcon,
    Loader2
} from 'lucide-react';
import { 
    GetInstitution, 
    SaveInstitution, 
    UploadLogo, 
    GetLogo 
} from '../../wailsjs/go/institution/InstitutionService';

const InstitutionPage = () => {
    const [institution, setInstitution] = useState({
        Nombre: '',
        CodigoAmie: '',
        Distrito: '',
        Circuito: '',
        Direccion: '',
        LogoPath: ''
    });
    const [logoPreview, setLogoPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await GetInstitution();
            if (data) {
                setInstitution(data);
                if (data.LogoPath) {
                    const logo = await GetLogo();
                    setLogoPreview(logo);
                }
            }
        } catch (err) {
            toast.error("Error cargando datos: " + err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await SaveInstitution(institution);
            toast.success("Datos guardados correctamente");
        } catch (err) {
            toast.error("Error al guardar: " + err);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const base64 = e.target.result;
                await UploadLogo(base64);
                setLogoPreview(base64);
                toast.success("Logo actualizado");
            } catch (err) {
                toast.error("Error subiendo logo: " + err);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleChange = (field, value) => {
        setInstitution(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
                <p className="text-slate-500 font-medium">Cargando información...</p>
            </div>
        );
    }

    return (
        <div className="min-h-full w-full bg-slate-50/50 font-sans">
            <div className="mx-auto w-full flex flex-col gap-6">
                
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                            <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Datos de la Institución</h1>
                            <p className="text-sm text-slate-500 font-medium">Configuración general y logo</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Logo Card */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center h-full">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-6 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-blue-500" />
                                Logotipo Institucional
                            </h3>
                            
                            <div className="w-48 h-48 bg-slate-50 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center mb-6 overflow-hidden relative group transition-all hover:border-blue-400 hover:bg-blue-50/30 shadow-inner">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-300">
                                        <ImageIcon className="w-12 h-12" />
                                        <span className="text-xs font-medium">Sin imagen</span>
                                    </div>
                                )}
                                
                                <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm">
                                    <div className="p-3 bg-white/20 rounded-full mb-2 border border-white/30 backdrop-blur-md">
                                        <Upload className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-white text-xs font-bold uppercase tracking-wide">Cambiar Logo</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                </label>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 w-full max-w-60">
                                <p className="font-bold mb-1">Recomendaciones:</p>
                                <ul className="list-disc pl-4 space-y-1 text-left">
                                    <li>Formato PNG o JPG</li>
                                    <li>Fondo transparente preferible</li>
                                    <li>Resolución mín. 500x500px</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="md:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                    <School className="w-4 h-4 text-blue-500" />
                                    Información General
                                </h3>
                            </div>
                            
                            <div className="p-6 space-y-6 flex-1">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 ml-1">
                                        Nombre de la Institución
                                    </label>
                                    <input 
                                        type="text"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                                        placeholder="Ej: Unidad Educativa..."
                                        value={institution.Nombre}
                                        onChange={(e) => handleChange('Nombre', e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 ml-1">
                                            <Hash className="w-3.5 h-3.5" /> Código AMIE
                                        </label>
                                        <input 
                                            type="text"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-700"
                                            value={institution.CodigoAmie}
                                            onChange={(e) => handleChange('CodigoAmie', e.target.value)}
                                            placeholder="XXXXXX"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Distrito</label>
                                        <input 
                                            type="text"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                                            value={institution.Distrito}
                                            onChange={(e) => handleChange('Distrito', e.target.value)}
                                            placeholder="D01"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Circuito</label>
                                        <input 
                                            type="text"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                                            value={institution.Circuito}
                                            onChange={(e) => handleChange('Circuito', e.target.value)}
                                            placeholder="C01"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 ml-1">
                                            <MapPin className="w-3.5 h-3.5" /> Dirección
                                        </label>
                                        <input 
                                            type="text"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                                            value={institution.Direccion}
                                            onChange={(e) => handleChange('Direccion', e.target.value)}
                                            placeholder="Av. Principal..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-200 mt-auto flex justify-end">
                                <button 
                                    onClick={handleSave}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center gap-2 active:scale-95"
                                >
                                    <Save className="w-4 h-4" />
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstitutionPage;