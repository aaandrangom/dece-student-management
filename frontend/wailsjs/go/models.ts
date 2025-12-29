export namespace dtos {
	
	export class AutoridadDTO {
	    cedula: string;
	    nombres: string;
	    apellidos: string;
	    telefono: string;
	    jornada: string;
	
	    static createFrom(source: any = {}) {
	        return new AutoridadDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.cedula = source["cedula"];
	        this.nombres = source["nombres"];
	        this.apellidos = source["apellidos"];
	        this.telefono = source["telefono"];
	        this.jornada = source["jornada"];
	    }
	}
	export class AutoridadesInstitucionDTO {
	    rector: AutoridadDTO;
	    subdirector: AutoridadDTO;
	    inspector_general: AutoridadDTO;
	    responsable_dece: AutoridadDTO;
	
	    static createFrom(source: any = {}) {
	        return new AutoridadesInstitucionDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.rector = this.convertValues(source["rector"], AutoridadDTO);
	        this.subdirector = this.convertValues(source["subdirector"], AutoridadDTO);
	        this.inspector_general = this.convertValues(source["inspector_general"], AutoridadDTO);
	        this.responsable_dece = this.convertValues(source["responsable_dece"], AutoridadDTO);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DetalleUbicacionDTO {
	    provincia: string;
	    canton: string;
	    parroquia: string;
	    barrio_recinto: string;
	
	    static createFrom(source: any = {}) {
	        return new DetalleUbicacionDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.provincia = source["provincia"];
	        this.canton = source["canton"];
	        this.parroquia = source["parroquia"];
	        this.barrio_recinto = source["barrio_recinto"];
	    }
	}
	export class ConfiguracionInstitucionalDTO {
	    nombre: string;
	    codigo_amie: string;
	    distrito: string;
	    circuito: string;
	    detalle_ubicacion: DetalleUbicacionDTO;
	    autoridades: AutoridadesInstitucionDTO;
	    // Go type: time
	    fecha_actualizacion: any;
	
	    static createFrom(source: any = {}) {
	        return new ConfiguracionInstitucionalDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nombre = source["nombre"];
	        this.codigo_amie = source["codigo_amie"];
	        this.distrito = source["distrito"];
	        this.circuito = source["circuito"];
	        this.detalle_ubicacion = this.convertValues(source["detalle_ubicacion"], DetalleUbicacionDTO);
	        this.autoridades = this.convertValues(source["autoridades"], AutoridadesInstitucionDTO);
	        this.fecha_actualizacion = this.convertValues(source["fecha_actualizacion"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class UsuarioResponseDTO {
	    id: number;
	    nombre_usuario: string;
	    nombre_completo: string;
	    rol: string;
	    activo: boolean;
	    // Go type: time
	    fecha_creacion: any;
	
	    static createFrom(source: any = {}) {
	        return new UsuarioResponseDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nombre_usuario = source["nombre_usuario"];
	        this.nombre_completo = source["nombre_completo"];
	        this.rol = source["rol"];
	        this.activo = source["activo"];
	        this.fecha_creacion = this.convertValues(source["fecha_creacion"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

