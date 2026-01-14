export namespace academic {
	
	export class ActualizarPeriodoDTO {
	    id: number;
	    nombre: string;
	    fecha_inicio: string;
	    fecha_fin: string;
	
	    static createFrom(source: any = {}) {
	        return new ActualizarPeriodoDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nombre = source["nombre"];
	        this.fecha_inicio = source["fecha_inicio"];
	        this.fecha_fin = source["fecha_fin"];
	    }
	}
	export class CrearPeriodoDTO {
	    nombre: string;
	    fecha_inicio: string;
	    fecha_fin: string;
	
	    static createFrom(source: any = {}) {
	        return new CrearPeriodoDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nombre = source["nombre"];
	        this.fecha_inicio = source["fecha_inicio"];
	        this.fecha_fin = source["fecha_fin"];
	    }
	}
	export class MateriaDTO {
	    id: number;
	    nombre: string;
	    area: string;
	
	    static createFrom(source: any = {}) {
	        return new MateriaDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nombre = source["nombre"];
	        this.area = source["area"];
	    }
	}
	export class NivelEducativo {
	    id: number;
	    nombre: string;
	    nombre_completo: string;
	    orden: number;
	
	    static createFrom(source: any = {}) {
	        return new NivelEducativo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nombre = source["nombre"];
	        this.nombre_completo = source["nombre_completo"];
	        this.orden = source["orden"];
	    }
	}
	export class NivelEducativoDTO {
	    id: number;
	    nombre: string;
	    nombre_completo: string;
	    orden: number;
	
	    static createFrom(source: any = {}) {
	        return new NivelEducativoDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nombre = source["nombre"];
	        this.nombre_completo = source["nombre_completo"];
	        this.orden = source["orden"];
	    }
	}
	export class PeriodoLectivo {
	    id: number;
	    nombre: string;
	    fecha_inicio: string;
	    fecha_fin: string;
	    es_activo: boolean;
	    cerrado: boolean;
	
	    static createFrom(source: any = {}) {
	        return new PeriodoLectivo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nombre = source["nombre"];
	        this.fecha_inicio = source["fecha_inicio"];
	        this.fecha_fin = source["fecha_fin"];
	        this.es_activo = source["es_activo"];
	        this.cerrado = source["cerrado"];
	    }
	}
	export class PeriodoResponseDTO {
	    id: number;
	    nombre: string;
	    fecha_inicio: string;
	    fecha_fin: string;
	    es_activo: boolean;
	    cerrado: boolean;
	    estado: string;
	
	    static createFrom(source: any = {}) {
	        return new PeriodoResponseDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nombre = source["nombre"];
	        this.fecha_inicio = source["fecha_inicio"];
	        this.fecha_fin = source["fecha_fin"];
	        this.es_activo = source["es_activo"];
	        this.cerrado = source["cerrado"];
	        this.estado = source["estado"];
	    }
	}

}

export namespace common {
	
	export class JSONMap___dece_internal_domain_tracking_Evidencia_ {
	    Data: tracking.Evidencia[];
	
	    static createFrom(source: any = {}) {
	        return new JSONMap___dece_internal_domain_tracking_Evidencia_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Data = this.convertValues(source["Data"], tracking.Evidencia);
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
	export class JSONMap_dece_internal_domain_enrollment_Antropometria_ {
	    Data: enrollment.Antropometria;
	
	    static createFrom(source: any = {}) {
	        return new JSONMap_dece_internal_domain_enrollment_Antropometria_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Data = this.convertValues(source["Data"], enrollment.Antropometria);
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
	export class JSONMap_dece_internal_domain_enrollment_CondicionGenero_ {
	    Data: enrollment.CondicionGenero;
	
	    static createFrom(source: any = {}) {
	        return new JSONMap_dece_internal_domain_enrollment_CondicionGenero_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Data = this.convertValues(source["Data"], enrollment.CondicionGenero);
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
	export class JSONMap_dece_internal_domain_enrollment_DatosSalud_ {
	    Data: enrollment.DatosSalud;
	
	    static createFrom(source: any = {}) {
	        return new JSONMap_dece_internal_domain_enrollment_DatosSalud_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Data = this.convertValues(source["Data"], enrollment.DatosSalud);
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
	export class JSONMap_dece_internal_domain_enrollment_DatosSociales_ {
	    Data: enrollment.DatosSociales;
	
	    static createFrom(source: any = {}) {
	        return new JSONMap_dece_internal_domain_enrollment_DatosSociales_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Data = this.convertValues(source["Data"], enrollment.DatosSociales);
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
	export class JSONMap_dece_internal_domain_enrollment_HistorialAcademico_ {
	    Data: enrollment.HistorialAcademico;
	
	    static createFrom(source: any = {}) {
	        return new JSONMap_dece_internal_domain_enrollment_HistorialAcademico_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Data = this.convertValues(source["Data"], enrollment.HistorialAcademico);
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
	export class JSONMap_dece_internal_domain_management_AudienciaCapacitacion_ {
	    Data: management.AudienciaCapacitacion;
	
	    static createFrom(source: any = {}) {
	        return new JSONMap_dece_internal_domain_management_AudienciaCapacitacion_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Data = this.convertValues(source["Data"], management.AudienciaCapacitacion);
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
	export class JSONMap_dece_internal_domain_notifications_NotificacionMetadata_ {
	    Data: notifications.NotificacionMetadata;
	
	    static createFrom(source: any = {}) {
	        return new JSONMap_dece_internal_domain_notifications_NotificacionMetadata_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Data = this.convertValues(source["Data"], notifications.NotificacionMetadata);
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
	export class JSONMap_dece_internal_domain_student_DatosFamiliar_ {
	    Data: student.DatosFamiliar;
	
	    static createFrom(source: any = {}) {
	        return new JSONMap_dece_internal_domain_student_DatosFamiliar_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Data = this.convertValues(source["Data"], student.DatosFamiliar);
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
	export class JSONMap_dece_internal_domain_student_InfoNacionalidad_ {
	    Data: student.InfoNacionalidad;
	
	    static createFrom(source: any = {}) {
	        return new JSONMap_dece_internal_domain_student_InfoNacionalidad_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Data = this.convertValues(source["Data"], student.InfoNacionalidad);
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
	export class JSONMap_dece_internal_domain_tracking_DetalleSancion_ {
	    Data: tracking.DetalleSancion;
	
	    static createFrom(source: any = {}) {
	        return new JSONMap_dece_internal_domain_tracking_DetalleSancion_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Data = this.convertValues(source["Data"], tracking.DetalleSancion);
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

export namespace dashboard {
	
	export class ActividadDTO {
	    tipo: string;
	    fecha: string;
	    descripcion: string;
	    estudiante: string;
	
	    static createFrom(source: any = {}) {
	        return new ActividadDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.tipo = source["tipo"];
	        this.fecha = source["fecha"];
	        this.descripcion = source["descripcion"];
	        this.estudiante = source["estudiante"];
	    }
	}
	export class CasoPorTipoDTO {
	    tipo_caso: string;
	    cantidad: number;
	
	    static createFrom(source: any = {}) {
	        return new CasoPorTipoDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.tipo_caso = source["tipo_caso"];
	        this.cantidad = source["cantidad"];
	    }
	}
	export class CitaProximaDTO {
	    estudiante: string;
	    curso: string;
	    entidad: string;
	    motivo: string;
	    fecha_cita: string;
	    dias_alerta: number;
	
	    static createFrom(source: any = {}) {
	        return new CitaProximaDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.estudiante = source["estudiante"];
	        this.curso = source["curso"];
	        this.entidad = source["entidad"];
	        this.motivo = source["motivo"];
	        this.fecha_cita = source["fecha_cita"];
	        this.dias_alerta = source["dias_alerta"];
	    }
	}
	export class CursoConflictivoDTO {
	    curso: string;
	    cantidad_faltas: number;
	
	    static createFrom(source: any = {}) {
	        return new CursoConflictivoDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.curso = source["curso"];
	        this.cantidad_faltas = source["cantidad_faltas"];
	    }
	}
	export class GeneroDTO {
	    genero: string;
	    cantidad: number;
	
	    static createFrom(source: any = {}) {
	        return new GeneroDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.genero = source["genero"];
	        this.cantidad = source["cantidad"];
	    }
	}
	export class KPIDashboardDTO {
	    total_estudiantes: number;
	    casos_abiertos: number;
	    citas_pendientes: number;
	    sanciones_mes: number;
	
	    static createFrom(source: any = {}) {
	        return new KPIDashboardDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total_estudiantes = source["total_estudiantes"];
	        this.casos_abiertos = source["casos_abiertos"];
	        this.citas_pendientes = source["citas_pendientes"];
	        this.sanciones_mes = source["sanciones_mes"];
	    }
	}
	export class DashboardDataDTO {
	    kpi: KPIDashboardDTO;
	    citas_proximas: CitaProximaDTO[];
	    cursos_conflictivos: CursoConflictivoDTO[];
	    casos_por_tipo: CasoPorTipoDTO[];
	    estudiantes_genero: GeneroDTO[];
	    actividad_reciente: ActividadDTO[];
	
	    static createFrom(source: any = {}) {
	        return new DashboardDataDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.kpi = this.convertValues(source["kpi"], KPIDashboardDTO);
	        this.citas_proximas = this.convertValues(source["citas_proximas"], CitaProximaDTO);
	        this.cursos_conflictivos = this.convertValues(source["cursos_conflictivos"], CursoConflictivoDTO);
	        this.casos_por_tipo = this.convertValues(source["casos_por_tipo"], CasoPorTipoDTO);
	        this.estudiantes_genero = this.convertValues(source["estudiantes_genero"], GeneroDTO);
	        this.actividad_reciente = this.convertValues(source["actividad_reciente"], ActividadDTO);
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

export namespace dto {
	
	export class NotificacionDTO {
	    id: number;
	    tipo: string;
	    rol_destino: string;
	    fecha_programada: string;
	    momento: string;
	    titulo: string;
	    mensaje: string;
	    leida: boolean;
	    fecha_creacion: string;
	
	    static createFrom(source: any = {}) {
	        return new NotificacionDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.tipo = source["tipo"];
	        this.rol_destino = source["rol_destino"];
	        this.fecha_programada = source["fecha_programada"];
	        this.momento = source["momento"];
	        this.titulo = source["titulo"];
	        this.mensaje = source["mensaje"];
	        this.leida = source["leida"];
	        this.fecha_creacion = source["fecha_creacion"];
	    }
	}
	export class NotificacionesPaginadasDTO {
	    items: NotificacionDTO[];
	    total: number;
	    page: number;
	    page_size: number;
	
	    static createFrom(source: any = {}) {
	        return new NotificacionesPaginadasDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], NotificacionDTO);
	        this.total = source["total"];
	        this.page = source["page"];
	        this.page_size = source["page_size"];
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
	export class ResumenNotificacionesDTO {
	    items: NotificacionDTO[];
	    unread_count: number;
	
	    static createFrom(source: any = {}) {
	        return new ResumenNotificacionesDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], NotificacionDTO);
	        this.unread_count = source["unread_count"];
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
	    subdirector_matutina: AutoridadDTO;
	    subdirector_vespertina: AutoridadDTO;
	    inspector_general: AutoridadDTO;
	    subinspector: AutoridadDTO;
	    coordinador_dece: AutoridadDTO;
	    analista_dece_1: AutoridadDTO;
	    analista_dece_2: AutoridadDTO;
	
	    static createFrom(source: any = {}) {
	        return new AutoridadesInstitucionDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.rector = this.convertValues(source["rector"], AutoridadDTO);
	        this.subdirector_matutina = this.convertValues(source["subdirector_matutina"], AutoridadDTO);
	        this.subdirector_vespertina = this.convertValues(source["subdirector_vespertina"], AutoridadDTO);
	        this.inspector_general = this.convertValues(source["inspector_general"], AutoridadDTO);
	        this.subinspector = this.convertValues(source["subinspector"], AutoridadDTO);
	        this.coordinador_dece = this.convertValues(source["coordinador_dece"], AutoridadDTO);
	        this.analista_dece_1 = this.convertValues(source["analista_dece_1"], AutoridadDTO);
	        this.analista_dece_2 = this.convertValues(source["analista_dece_2"], AutoridadDTO);
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
	    fecha_actualizacion: string;
	
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
	        this.fecha_actualizacion = source["fecha_actualizacion"];
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
	    fecha_creacion: string;
	
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
	        this.fecha_creacion = source["fecha_creacion"];
	    }
	}

}

export namespace enrollment {
	
	export class Antropometria {
	    peso: number;
	    talla: number;
	    tipo_sangre: string;
	
	    static createFrom(source: any = {}) {
	        return new Antropometria(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.peso = source["peso"];
	        this.talla = source["talla"];
	        this.tipo_sangre = source["tipo_sangre"];
	    }
	}
	export class InfoPadresPareja {
	    nombres: string;
	    apellidos: string;
	    cedula: string;
	    telefono: string;
	    parentesco: string;
	
	    static createFrom(source: any = {}) {
	        return new InfoPadresPareja(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nombres = source["nombres"];
	        this.apellidos = source["apellidos"];
	        this.cedula = source["cedula"];
	        this.telefono = source["telefono"];
	        this.parentesco = source["parentesco"];
	    }
	}
	export class CondicionGenero {
	    esta_embarazada: boolean;
	    meses_embarazo?: number;
	    lleva_control?: boolean;
	    es_alto_riesgo?: boolean;
	    tipo_apoyo_institucion?: string;
	    nombre_padre_bebe?: string;
	    viven_juntos_padres?: boolean;
	    esta_lactando: boolean;
	    meses_lactancia?: number;
	    genero_bebe?: string;
	    dias_nacido?: number;
	    nombre_padre_lactancia?: string;
	    edad_padre_lactancia?: number;
	    es_maternidad: boolean;
	    tiempo_maternidad?: string;
	    es_padre: boolean;
	    tiempo_paternidad?: string;
	    pareja_es_estudiante: boolean;
	    pareja_id?: number;
	    nombre_pareja?: string;
	    edad_pareja?: number;
	    telefono_pareja?: string;
	    pareja_es_menor_de_edad?: boolean;
	    detalle_padres_pareja?: InfoPadresPareja;
	
	    static createFrom(source: any = {}) {
	        return new CondicionGenero(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.esta_embarazada = source["esta_embarazada"];
	        this.meses_embarazo = source["meses_embarazo"];
	        this.lleva_control = source["lleva_control"];
	        this.es_alto_riesgo = source["es_alto_riesgo"];
	        this.tipo_apoyo_institucion = source["tipo_apoyo_institucion"];
	        this.nombre_padre_bebe = source["nombre_padre_bebe"];
	        this.viven_juntos_padres = source["viven_juntos_padres"];
	        this.esta_lactando = source["esta_lactando"];
	        this.meses_lactancia = source["meses_lactancia"];
	        this.genero_bebe = source["genero_bebe"];
	        this.dias_nacido = source["dias_nacido"];
	        this.nombre_padre_lactancia = source["nombre_padre_lactancia"];
	        this.edad_padre_lactancia = source["edad_padre_lactancia"];
	        this.es_maternidad = source["es_maternidad"];
	        this.tiempo_maternidad = source["tiempo_maternidad"];
	        this.es_padre = source["es_padre"];
	        this.tiempo_paternidad = source["tiempo_paternidad"];
	        this.pareja_es_estudiante = source["pareja_es_estudiante"];
	        this.pareja_id = source["pareja_id"];
	        this.nombre_pareja = source["nombre_pareja"];
	        this.edad_pareja = source["edad_pareja"];
	        this.telefono_pareja = source["telefono_pareja"];
	        this.pareja_es_menor_de_edad = source["pareja_es_menor_de_edad"];
	        this.detalle_padres_pareja = this.convertValues(source["detalle_padres_pareja"], InfoPadresPareja);
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
	export class DatosSalud {
	    tiene_eval_psicopedagogica: boolean;
	    ruta_eval_psicopedagogica: string;
	    tiene_discapacidad: boolean;
	    detalle_discapacidad: string;
	    ha_sufrido_accidente: boolean;
	    detalle_accidente: string;
	    tiene_alergias: boolean;
	    detalle_alergia: string;
	    tiene_cirugias: boolean;
	    detalle_cirugia: string;
	    tiene_enfermedad: boolean;
	    detalle_enfermedad: string;
	
	    static createFrom(source: any = {}) {
	        return new DatosSalud(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.tiene_eval_psicopedagogica = source["tiene_eval_psicopedagogica"];
	        this.ruta_eval_psicopedagogica = source["ruta_eval_psicopedagogica"];
	        this.tiene_discapacidad = source["tiene_discapacidad"];
	        this.detalle_discapacidad = source["detalle_discapacidad"];
	        this.ha_sufrido_accidente = source["ha_sufrido_accidente"];
	        this.detalle_accidente = source["detalle_accidente"];
	        this.tiene_alergias = source["tiene_alergias"];
	        this.detalle_alergia = source["detalle_alergia"];
	        this.tiene_cirugias = source["tiene_cirugias"];
	        this.detalle_cirugia = source["detalle_cirugia"];
	        this.tiene_enfermedad = source["tiene_enfermedad"];
	        this.detalle_enfermedad = source["detalle_enfermedad"];
	    }
	}
	export class DatosSociales {
	    actividades: string[];
	    practica_actividad: boolean;
	
	    static createFrom(source: any = {}) {
	        return new DatosSociales(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.actividades = source["actividades"];
	        this.practica_actividad = source["practica_actividad"];
	    }
	}
	export class MateriaReferencia {
	    id: number;
	    nombre: string;
	
	    static createFrom(source: any = {}) {
	        return new MateriaReferencia(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nombre = source["nombre"];
	    }
	}
	export class HistorialAcademico {
	    es_nuevo_estudiante: boolean;
	    institucion_anterior: string;
	    provincia_anterior: string;
	    canton_anterior: string;
	    ha_repetido_anio: boolean;
	    detalle_anio_repetido: string;
	    materias_favoritas: MateriaReferencia[];
	    materias_menos_gustan: MateriaReferencia[];
	
	    static createFrom(source: any = {}) {
	        return new HistorialAcademico(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.es_nuevo_estudiante = source["es_nuevo_estudiante"];
	        this.institucion_anterior = source["institucion_anterior"];
	        this.provincia_anterior = source["provincia_anterior"];
	        this.canton_anterior = source["canton_anterior"];
	        this.ha_repetido_anio = source["ha_repetido_anio"];
	        this.detalle_anio_repetido = source["detalle_anio_repetido"];
	        this.materias_favoritas = this.convertValues(source["materias_favoritas"], MateriaReferencia);
	        this.materias_menos_gustan = this.convertValues(source["materias_menos_gustan"], MateriaReferencia);
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
	export class GuardarMatriculaDTO {
	    id: number;
	    estudiante_id: number;
	    curso_id: number;
	    es_repetidor: boolean;
	    antropometria: Antropometria;
	    historial_academico: HistorialAcademico;
	    datos_salud: DatosSalud;
	    datos_sociales: DatosSociales;
	    condicion_genero: CondicionGenero;
	    direccion_actual: string;
	    ruta_croquis: string;
	    ruta_consentimiento: string;
	    estado: string;
	
	    static createFrom(source: any = {}) {
	        return new GuardarMatriculaDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.estudiante_id = source["estudiante_id"];
	        this.curso_id = source["curso_id"];
	        this.es_repetidor = source["es_repetidor"];
	        this.antropometria = this.convertValues(source["antropometria"], Antropometria);
	        this.historial_academico = this.convertValues(source["historial_academico"], HistorialAcademico);
	        this.datos_salud = this.convertValues(source["datos_salud"], DatosSalud);
	        this.datos_sociales = this.convertValues(source["datos_sociales"], DatosSociales);
	        this.condicion_genero = this.convertValues(source["condicion_genero"], CondicionGenero);
	        this.direccion_actual = source["direccion_actual"];
	        this.ruta_croquis = source["ruta_croquis"];
	        this.ruta_consentimiento = source["ruta_consentimiento"];
	        this.estado = source["estado"];
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
	
	export class HistorialMatriculaDTO {
	    id: number;
	    periodo_lectivo: string;
	    curso_nombre: string;
	    estado: string;
	    fecha: string;
	
	    static createFrom(source: any = {}) {
	        return new HistorialMatriculaDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.periodo_lectivo = source["periodo_lectivo"];
	        this.curso_nombre = source["curso_nombre"];
	        this.estado = source["estado"];
	        this.fecha = source["fecha"];
	    }
	}
	
	
	export class Matricula {
	    id: number;
	    estudiante_id: number;
	    curso_id: number;
	    estado: string;
	    es_repetidor: boolean;
	    antropometria: common.JSONMap_dece_internal_domain_enrollment_Antropometria_;
	    historial_academico: common.JSONMap_dece_internal_domain_enrollment_HistorialAcademico_;
	    datos_salud: common.JSONMap_dece_internal_domain_enrollment_DatosSalud_;
	    datos_sociales: common.JSONMap_dece_internal_domain_enrollment_DatosSociales_;
	    condicion_genero: common.JSONMap_dece_internal_domain_enrollment_CondicionGenero_;
	    direccion_actual: string;
	    ruta_croquis: string;
	    ruta_consentimiento: string;
	    fecha_registro: string;
	    estudiante?: student.Estudiante;
	    curso?: faculty.Curso;
	
	    static createFrom(source: any = {}) {
	        return new Matricula(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.estudiante_id = source["estudiante_id"];
	        this.curso_id = source["curso_id"];
	        this.estado = source["estado"];
	        this.es_repetidor = source["es_repetidor"];
	        this.antropometria = this.convertValues(source["antropometria"], common.JSONMap_dece_internal_domain_enrollment_Antropometria_);
	        this.historial_academico = this.convertValues(source["historial_academico"], common.JSONMap_dece_internal_domain_enrollment_HistorialAcademico_);
	        this.datos_salud = this.convertValues(source["datos_salud"], common.JSONMap_dece_internal_domain_enrollment_DatosSalud_);
	        this.datos_sociales = this.convertValues(source["datos_sociales"], common.JSONMap_dece_internal_domain_enrollment_DatosSociales_);
	        this.condicion_genero = this.convertValues(source["condicion_genero"], common.JSONMap_dece_internal_domain_enrollment_CondicionGenero_);
	        this.direccion_actual = source["direccion_actual"];
	        this.ruta_croquis = source["ruta_croquis"];
	        this.ruta_consentimiento = source["ruta_consentimiento"];
	        this.fecha_registro = source["fecha_registro"];
	        this.estudiante = this.convertValues(source["estudiante"], student.Estudiante);
	        this.curso = this.convertValues(source["curso"], faculty.Curso);
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
	export class MatriculaResponseDTO {
	    id: number;
	    estudiante_id: number;
	    curso_id: number;
	    es_repetidor: boolean;
	    antropometria: Antropometria;
	    historial_academico: HistorialAcademico;
	    datos_salud: DatosSalud;
	    datos_sociales: DatosSociales;
	    condicion_genero: CondicionGenero;
	    direccion_actual: string;
	    ruta_croquis: string;
	    ruta_consentimiento: string;
	    estado: string;
	
	    static createFrom(source: any = {}) {
	        return new MatriculaResponseDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.estudiante_id = source["estudiante_id"];
	        this.curso_id = source["curso_id"];
	        this.es_repetidor = source["es_repetidor"];
	        this.antropometria = this.convertValues(source["antropometria"], Antropometria);
	        this.historial_academico = this.convertValues(source["historial_academico"], HistorialAcademico);
	        this.datos_salud = this.convertValues(source["datos_salud"], DatosSalud);
	        this.datos_sociales = this.convertValues(source["datos_sociales"], DatosSociales);
	        this.condicion_genero = this.convertValues(source["condicion_genero"], CondicionGenero);
	        this.direccion_actual = source["direccion_actual"];
	        this.ruta_croquis = source["ruta_croquis"];
	        this.ruta_consentimiento = source["ruta_consentimiento"];
	        this.estado = source["estado"];
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

export namespace faculty {
	
	export class AsignarDocenteDTO {
	    curso_id: number;
	    materia_id: number;
	    docente_id: number;
	
	    static createFrom(source: any = {}) {
	        return new AsignarDocenteDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.curso_id = source["curso_id"];
	        this.materia_id = source["materia_id"];
	        this.docente_id = source["docente_id"];
	    }
	}
	export class Docente {
	    id: number;
	    cedula: string;
	    nombres_completos: string;
	    telefono: string;
	    correo: string;
	    activo: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Docente(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.cedula = source["cedula"];
	        this.nombres_completos = source["nombres_completos"];
	        this.telefono = source["telefono"];
	        this.correo = source["correo"];
	        this.activo = source["activo"];
	    }
	}
	export class Curso {
	    id: number;
	    periodo_id: number;
	    nivel_id: number;
	    tutor_id?: number;
	    paralelo: string;
	    jornada: string;
	    periodo?: academic.PeriodoLectivo;
	    nivel?: academic.NivelEducativo;
	    tutor?: Docente;
	
	    static createFrom(source: any = {}) {
	        return new Curso(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.periodo_id = source["periodo_id"];
	        this.nivel_id = source["nivel_id"];
	        this.tutor_id = source["tutor_id"];
	        this.paralelo = source["paralelo"];
	        this.jornada = source["jornada"];
	        this.periodo = this.convertValues(source["periodo"], academic.PeriodoLectivo);
	        this.nivel = this.convertValues(source["nivel"], academic.NivelEducativo);
	        this.tutor = this.convertValues(source["tutor"], Docente);
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
	export class CursoResponseDTO {
	    id: number;
	    nivel_nombre: string;
	    paralelo: string;
	    jornada: string;
	    tutor_nombre: string;
	    nombre_completo: string;
	    nivel_id: number;
	    tutor_id?: number;
	
	    static createFrom(source: any = {}) {
	        return new CursoResponseDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nivel_nombre = source["nivel_nombre"];
	        this.paralelo = source["paralelo"];
	        this.jornada = source["jornada"];
	        this.tutor_nombre = source["tutor_nombre"];
	        this.nombre_completo = source["nombre_completo"];
	        this.nivel_id = source["nivel_id"];
	        this.tutor_id = source["tutor_id"];
	    }
	}
	
	export class DocenteDTO {
	    id: number;
	    cedula: string;
	    nombres_completos: string;
	    telefono: string;
	    correo: string;
	    activo: boolean;
	
	    static createFrom(source: any = {}) {
	        return new DocenteDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.cedula = source["cedula"];
	        this.nombres_completos = source["nombres_completos"];
	        this.telefono = source["telefono"];
	        this.correo = source["correo"];
	        this.activo = source["activo"];
	    }
	}
	export class GuardarCursoDTO {
	    id: number;
	    periodo_id: number;
	    nivel_id: number;
	    paralelo: string;
	    jornada: string;
	    tutor_id?: number;
	
	    static createFrom(source: any = {}) {
	        return new GuardarCursoDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.periodo_id = source["periodo_id"];
	        this.nivel_id = source["nivel_id"];
	        this.paralelo = source["paralelo"];
	        this.jornada = source["jornada"];
	        this.tutor_id = source["tutor_id"];
	    }
	}
	export class GuardarDocenteDTO {
	    id: number;
	    cedula: string;
	    nombres_completos: string;
	    telefono: string;
	    correo: string;
	
	    static createFrom(source: any = {}) {
	        return new GuardarDocenteDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.cedula = source["cedula"];
	        this.nombres_completos = source["nombres_completos"];
	        this.telefono = source["telefono"];
	        this.correo = source["correo"];
	    }
	}
	export class ItemDistributivoDTO {
	    materia_id: number;
	    materia_nombre: string;
	    area: string;
	    docente_id?: number;
	    docente_nombre: string;
	
	    static createFrom(source: any = {}) {
	        return new ItemDistributivoDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.materia_id = source["materia_id"];
	        this.materia_nombre = source["materia_nombre"];
	        this.area = source["area"];
	        this.docente_id = source["docente_id"];
	        this.docente_nombre = source["docente_nombre"];
	    }
	}

}

export namespace management {
	
	export class ActualizarCitaDTO {
	    id: number;
	    matricula_id: number;
	    entidad: string;
	    motivo: string;
	    fecha_cita: string;
	    dias_alerta: number;
	
	    static createFrom(source: any = {}) {
	        return new ActualizarCitaDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.matricula_id = source["matricula_id"];
	        this.entidad = source["entidad"];
	        this.motivo = source["motivo"];
	        this.fecha_cita = source["fecha_cita"];
	        this.dias_alerta = source["dias_alerta"];
	    }
	}
	export class AgendarCitaDTO {
	    matricula_id: number;
	    entidad: string;
	    motivo: string;
	    fecha_cita: string;
	    dias_alerta: number;
	
	    static createFrom(source: any = {}) {
	        return new AgendarCitaDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.matricula_id = source["matricula_id"];
	        this.entidad = source["entidad"];
	        this.motivo = source["motivo"];
	        this.fecha_cita = source["fecha_cita"];
	        this.dias_alerta = source["dias_alerta"];
	    }
	}
	export class AlertaDashboardDTO {
	    id: number;
	    titulo: string;
	    descripcion: string;
	    fecha_hora: string;
	    dias_restantes: number;
	    nivel_urgencia: string;
	    color: string;
	
	    static createFrom(source: any = {}) {
	        return new AlertaDashboardDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.titulo = source["titulo"];
	        this.descripcion = source["descripcion"];
	        this.fecha_hora = source["fecha_hora"];
	        this.dias_restantes = source["dias_restantes"];
	        this.nivel_urgencia = source["nivel_urgencia"];
	        this.color = source["color"];
	    }
	}
	export class AudienciaCapacitacion {
	    grupo_objetivo: string;
	    jornada_docentes: string;
	    curso_id: number;
	    cursos_ids: number[];
	    grado_especifico: string;
	    paralelo_especifico: string;
	    cantidad_beneficiarios: number;
	
	    static createFrom(source: any = {}) {
	        return new AudienciaCapacitacion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.grupo_objetivo = source["grupo_objetivo"];
	        this.jornada_docentes = source["jornada_docentes"];
	        this.curso_id = source["curso_id"];
	        this.cursos_ids = source["cursos_ids"];
	        this.grado_especifico = source["grado_especifico"];
	        this.paralelo_especifico = source["paralelo_especifico"];
	        this.cantidad_beneficiarios = source["cantidad_beneficiarios"];
	    }
	}
	export class AulaDTO {
	    id: number;
	    nombre: string;
	
	    static createFrom(source: any = {}) {
	        return new AulaDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nombre = source["nombre"];
	    }
	}
	export class Capacitacion {
	    id: number;
	    periodo_id: number;
	    tema: string;
	    fecha: string;
	    detalle_audiencia: common.JSONMap_dece_internal_domain_management_AudienciaCapacitacion_;
	    ruta_evidencia: string;
	    periodo: academic.PeriodoLectivo;
	
	    static createFrom(source: any = {}) {
	        return new Capacitacion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.periodo_id = source["periodo_id"];
	        this.tema = source["tema"];
	        this.fecha = source["fecha"];
	        this.detalle_audiencia = this.convertValues(source["detalle_audiencia"], common.JSONMap_dece_internal_domain_management_AudienciaCapacitacion_);
	        this.ruta_evidencia = source["ruta_evidencia"];
	        this.periodo = this.convertValues(source["periodo"], academic.PeriodoLectivo);
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
	export class CapacitacionResumenDTO {
	    id: number;
	    fecha: string;
	    tema: string;
	    grupo_objetivo: string;
	    cantidad_beneficiarios: number;
	    tiene_evidencia: boolean;
	    ruta_evidencia: string;
	
	    static createFrom(source: any = {}) {
	        return new CapacitacionResumenDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.fecha = source["fecha"];
	        this.tema = source["tema"];
	        this.grupo_objetivo = source["grupo_objetivo"];
	        this.cantidad_beneficiarios = source["cantidad_beneficiarios"];
	        this.tiene_evidencia = source["tiene_evidencia"];
	        this.ruta_evidencia = source["ruta_evidencia"];
	    }
	}
	export class CitaDetalleDTO {
	    id: number;
	    matricula_id: number;
	    entidad: string;
	    motivo: string;
	    fecha_cita: string;
	    dias_alerta: number;
	    completada: boolean;
	    curso: string;
	    nombres: string;
	    apellidos: string;
	    nombre_completo: string;
	
	    static createFrom(source: any = {}) {
	        return new CitaDetalleDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.matricula_id = source["matricula_id"];
	        this.entidad = source["entidad"];
	        this.motivo = source["motivo"];
	        this.fecha_cita = source["fecha_cita"];
	        this.dias_alerta = source["dias_alerta"];
	        this.completada = source["completada"];
	        this.curso = source["curso"];
	        this.nombres = source["nombres"];
	        this.apellidos = source["apellidos"];
	        this.nombre_completo = source["nombre_completo"];
	    }
	}
	export class CitaResumenDTO {
	    id: number;
	    fecha_hora: string;
	    entidad: string;
	    motivo: string;
	    estudiante_nombre: string;
	    curso: string;
	    completada: boolean;
	    alerta: boolean;
	
	    static createFrom(source: any = {}) {
	        return new CitaResumenDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.fecha_hora = source["fecha_hora"];
	        this.entidad = source["entidad"];
	        this.motivo = source["motivo"];
	        this.estudiante_nombre = source["estudiante_nombre"];
	        this.curso = source["curso"];
	        this.completada = source["completada"];
	        this.alerta = source["alerta"];
	    }
	}
	export class Convocatoria {
	    id: number;
	    matricula_id: number;
	    entidad: string;
	    motivo: string;
	    fecha_cita: string;
	    dias_alerta: number;
	    cita_completada: boolean;
	    matricula: enrollment.Matricula;
	
	    static createFrom(source: any = {}) {
	        return new Convocatoria(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.matricula_id = source["matricula_id"];
	        this.entidad = source["entidad"];
	        this.motivo = source["motivo"];
	        this.fecha_cita = source["fecha_cita"];
	        this.dias_alerta = source["dias_alerta"];
	        this.cita_completada = source["cita_completada"];
	        this.matricula = this.convertValues(source["matricula"], enrollment.Matricula);
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
	export class FiltroCitasDTO {
	    tipo: string;
	    fecha_solo: string;
	
	    static createFrom(source: any = {}) {
	        return new FiltroCitasDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.tipo = source["tipo"];
	        this.fecha_solo = source["fecha_solo"];
	    }
	}
	export class GuardarCapacitacionDTO {
	    id: number;
	    tema: string;
	    fecha: string;
	    grupo_objetivo: string;
	    jornada_docentes: string;
	    curso_id: number;
	    cursos_ids: number[];
	    grado_especifico: string;
	    paralelo_especifico: string;
	    cantidad_beneficiarios: number;
	
	    static createFrom(source: any = {}) {
	        return new GuardarCapacitacionDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.tema = source["tema"];
	        this.fecha = source["fecha"];
	        this.grupo_objetivo = source["grupo_objetivo"];
	        this.jornada_docentes = source["jornada_docentes"];
	        this.curso_id = source["curso_id"];
	        this.cursos_ids = source["cursos_ids"];
	        this.grado_especifico = source["grado_especifico"];
	        this.paralelo_especifico = source["paralelo_especifico"];
	        this.cantidad_beneficiarios = source["cantidad_beneficiarios"];
	    }
	}

}

export namespace notifications {
	
	export class CitaAlertaItem {
	    convocatoria_id: number;
	    fecha_cita: string;
	    entidad: string;
	    motivo: string;
	    estudiante: string;
	    curso: string;
	
	    static createFrom(source: any = {}) {
	        return new CitaAlertaItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.convocatoria_id = source["convocatoria_id"];
	        this.fecha_cita = source["fecha_cita"];
	        this.entidad = source["entidad"];
	        this.motivo = source["motivo"];
	        this.estudiante = source["estudiante"];
	        this.curso = source["curso"];
	    }
	}
	export class Notificacion {
	    id: number;
	    tipo: string;
	    rol_destino: string;
	    fecha_programada: string;
	    momento: string;
	    titulo: string;
	    mensaje: string;
	    leida: boolean;
	    metadata: common.JSONMap_dece_internal_domain_notifications_NotificacionMetadata_;
	    fecha_creacion: time.Time;
	
	    static createFrom(source: any = {}) {
	        return new Notificacion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.tipo = source["tipo"];
	        this.rol_destino = source["rol_destino"];
	        this.fecha_programada = source["fecha_programada"];
	        this.momento = source["momento"];
	        this.titulo = source["titulo"];
	        this.mensaje = source["mensaje"];
	        this.leida = source["leida"];
	        this.metadata = this.convertValues(source["metadata"], common.JSONMap_dece_internal_domain_notifications_NotificacionMetadata_);
	        this.fecha_creacion = this.convertValues(source["fecha_creacion"], time.Time);
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
	export class NotificacionMetadata {
	    total: number;
	    items: CitaAlertaItem[];
	
	    static createFrom(source: any = {}) {
	        return new NotificacionMetadata(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total = source["total"];
	        this.items = this.convertValues(source["items"], CitaAlertaItem);
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

export namespace search {
	
	export class GlobalSearchResultDTO {
	    type: string;
	    id: number;
	    title: string;
	    description: string;
	    route: string;
	    icon: string;
	    tiene_caso_sensible: boolean;
	    tiene_disciplina: boolean;
	
	    static createFrom(source: any = {}) {
	        return new GlobalSearchResultDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.id = source["id"];
	        this.title = source["title"];
	        this.description = source["description"];
	        this.route = source["route"];
	        this.icon = source["icon"];
	        this.tiene_caso_sensible = source["tiene_caso_sensible"];
	        this.tiene_disciplina = source["tiene_disciplina"];
	    }
	}

}

export namespace student {
	
	export class DatosFamiliar {
	    nivel_instruccion: string;
	    profesion: string;
	    lugar_trabajo: string;
	
	    static createFrom(source: any = {}) {
	        return new DatosFamiliar(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nivel_instruccion = source["nivel_instruccion"];
	        this.profesion = source["profesion"];
	        this.lugar_trabajo = source["lugar_trabajo"];
	    }
	}
	export class DatosFamiliarDTO {
	    nivel_instruccion: string;
	    profesion: string;
	    lugar_trabajo: string;
	
	    static createFrom(source: any = {}) {
	        return new DatosFamiliarDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nivel_instruccion = source["nivel_instruccion"];
	        this.profesion = source["profesion"];
	        this.lugar_trabajo = source["lugar_trabajo"];
	    }
	}
	export class Familiar {
	    id: number;
	    estudiante_id: number;
	    cedula: string;
	    nombres_completos: string;
	    parentesco: string;
	    es_representante_legal: boolean;
	    vive_con_estudiante: boolean;
	    datos_extendidos: common.JSONMap_dece_internal_domain_student_DatosFamiliar_;
	    telefono_personal: string;
	    fallecido: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Familiar(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.estudiante_id = source["estudiante_id"];
	        this.cedula = source["cedula"];
	        this.nombres_completos = source["nombres_completos"];
	        this.parentesco = source["parentesco"];
	        this.es_representante_legal = source["es_representante_legal"];
	        this.vive_con_estudiante = source["vive_con_estudiante"];
	        this.datos_extendidos = this.convertValues(source["datos_extendidos"], common.JSONMap_dece_internal_domain_student_DatosFamiliar_);
	        this.telefono_personal = source["telefono_personal"];
	        this.fallecido = source["fallecido"];
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
	export class Estudiante {
	    id: number;
	    cedula: string;
	    apellidos: string;
	    nombres: string;
	    fecha_nacimiento: string;
	    genero_nacimiento: string;
	    correo_electronico: string;
	    info_nacionalidad: common.JSONMap_dece_internal_domain_student_InfoNacionalidad_;
	    ruta_foto: string;
	    ruta_cedula: string;
	    ruta_partida_nacimiento: string;
	    familiares: Familiar[];
	    fecha_creacion: string;
	
	    static createFrom(source: any = {}) {
	        return new Estudiante(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.cedula = source["cedula"];
	        this.apellidos = source["apellidos"];
	        this.nombres = source["nombres"];
	        this.fecha_nacimiento = source["fecha_nacimiento"];
	        this.genero_nacimiento = source["genero_nacimiento"];
	        this.correo_electronico = source["correo_electronico"];
	        this.info_nacionalidad = this.convertValues(source["info_nacionalidad"], common.JSONMap_dece_internal_domain_student_InfoNacionalidad_);
	        this.ruta_foto = source["ruta_foto"];
	        this.ruta_cedula = source["ruta_cedula"];
	        this.ruta_partida_nacimiento = source["ruta_partida_nacimiento"];
	        this.familiares = this.convertValues(source["familiares"], Familiar);
	        this.fecha_creacion = source["fecha_creacion"];
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
	export class InfoNacionalidadDTO {
	    es_extranjero: boolean;
	    pais_origen: string;
	    pasaporte_odni: string;
	
	    static createFrom(source: any = {}) {
	        return new InfoNacionalidadDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.es_extranjero = source["es_extranjero"];
	        this.pais_origen = source["pais_origen"];
	        this.pasaporte_odni = source["pasaporte_odni"];
	    }
	}
	export class EstudianteListaDTO {
	    id: number;
	    cedula: string;
	    apellidos: string;
	    nombres: string;
	    ruta_foto: string;
	    ruta_cedula: string;
	    ruta_partida_nacimiento: string;
	    fecha_nacimiento: string;
	    correo_electronico: string;
	    edad: number;
	    info_nacionalidad?: InfoNacionalidadDTO;
	
	    static createFrom(source: any = {}) {
	        return new EstudianteListaDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.cedula = source["cedula"];
	        this.apellidos = source["apellidos"];
	        this.nombres = source["nombres"];
	        this.ruta_foto = source["ruta_foto"];
	        this.ruta_cedula = source["ruta_cedula"];
	        this.ruta_partida_nacimiento = source["ruta_partida_nacimiento"];
	        this.fecha_nacimiento = source["fecha_nacimiento"];
	        this.correo_electronico = source["correo_electronico"];
	        this.edad = source["edad"];
	        this.info_nacionalidad = this.convertValues(source["info_nacionalidad"], InfoNacionalidadDTO);
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
	
	export class GuardarFamiliarDTO {
	    id: number;
	    cedula: string;
	    nombres_completos: string;
	    parentesco: string;
	    es_representante_legal: boolean;
	    vive_con_estudiante: boolean;
	    telefono_personal: string;
	    fallecido: boolean;
	    datos_extendidos: DatosFamiliarDTO;
	
	    static createFrom(source: any = {}) {
	        return new GuardarFamiliarDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.cedula = source["cedula"];
	        this.nombres_completos = source["nombres_completos"];
	        this.parentesco = source["parentesco"];
	        this.es_representante_legal = source["es_representante_legal"];
	        this.vive_con_estudiante = source["vive_con_estudiante"];
	        this.telefono_personal = source["telefono_personal"];
	        this.fallecido = source["fallecido"];
	        this.datos_extendidos = this.convertValues(source["datos_extendidos"], DatosFamiliarDTO);
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
	export class GuardarEstudianteDTO {
	    id: number;
	    cedula: string;
	    apellidos: string;
	    nombres: string;
	    fecha_nacimiento: string;
	    genero_nacimiento: string;
	    correo_electronico: string;
	    ruta_foto: string;
	    ruta_cedula: string;
	    ruta_partida_nacimiento: string;
	    es_extranjero: boolean;
	    pais_origen: string;
	    pasaporte_odni: string;
	    familiares: GuardarFamiliarDTO[];
	
	    static createFrom(source: any = {}) {
	        return new GuardarEstudianteDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.cedula = source["cedula"];
	        this.apellidos = source["apellidos"];
	        this.nombres = source["nombres"];
	        this.fecha_nacimiento = source["fecha_nacimiento"];
	        this.genero_nacimiento = source["genero_nacimiento"];
	        this.correo_electronico = source["correo_electronico"];
	        this.ruta_foto = source["ruta_foto"];
	        this.ruta_cedula = source["ruta_cedula"];
	        this.ruta_partida_nacimiento = source["ruta_partida_nacimiento"];
	        this.es_extranjero = source["es_extranjero"];
	        this.pais_origen = source["pais_origen"];
	        this.pasaporte_odni = source["pasaporte_odni"];
	        this.familiares = this.convertValues(source["familiares"], GuardarFamiliarDTO);
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
	
	export class InfoNacionalidad {
	    es_extranjero: boolean;
	    pais_origen: string;
	    pasaporte_odni: string;
	
	    static createFrom(source: any = {}) {
	        return new InfoNacionalidad(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.es_extranjero = source["es_extranjero"];
	        this.pais_origen = source["pais_origen"];
	        this.pasaporte_odni = source["pasaporte_odni"];
	    }
	}

}

export namespace time {
	
	export class Time {
	
	
	    static createFrom(source: any = {}) {
	        return new Time(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}

}

export namespace tracking {
	
	export class EvidenciaDTO {
	    nombre: string;
	    ruta: string;
	
	    static createFrom(source: any = {}) {
	        return new EvidenciaDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nombre = source["nombre"];
	        this.ruta = source["ruta"];
	    }
	}
	export class CasoResumenDTO {
	    id: number;
	    codigo_caso: string;
	    tipo_caso: string;
	    fecha_deteccion: string;
	    entidad_derivacion: string;
	    entidad_derivacion_detalle: string;
	    descripcion: string;
	    estado: string;
	    total_evidencias: number;
	    rutas_evidencias: EvidenciaDTO[];
	
	    static createFrom(source: any = {}) {
	        return new CasoResumenDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.codigo_caso = source["codigo_caso"];
	        this.tipo_caso = source["tipo_caso"];
	        this.fecha_deteccion = source["fecha_deteccion"];
	        this.entidad_derivacion = source["entidad_derivacion"];
	        this.entidad_derivacion_detalle = source["entidad_derivacion_detalle"];
	        this.descripcion = source["descripcion"];
	        this.estado = source["estado"];
	        this.total_evidencias = source["total_evidencias"];
	        this.rutas_evidencias = this.convertValues(source["rutas_evidencias"], EvidenciaDTO);
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
	export class CasoSensible {
	    id: number;
	    estudiante_id: number;
	    periodo_id: number;
	    codigo_caso: string;
	    tipo_caso: string;
	    fecha_deteccion: string;
	    entidad_derivacion: string;
	    entidad_derivacion_detalle: string;
	    descripcion: string;
	    estado: string;
	    // Go type: common
	    rutas_documentos: any;
	    estudiante: student.Estudiante;
	    periodo: academic.PeriodoLectivo;
	
	    static createFrom(source: any = {}) {
	        return new CasoSensible(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.estudiante_id = source["estudiante_id"];
	        this.periodo_id = source["periodo_id"];
	        this.codigo_caso = source["codigo_caso"];
	        this.tipo_caso = source["tipo_caso"];
	        this.fecha_deteccion = source["fecha_deteccion"];
	        this.entidad_derivacion = source["entidad_derivacion"];
	        this.entidad_derivacion_detalle = source["entidad_derivacion_detalle"];
	        this.descripcion = source["descripcion"];
	        this.estado = source["estado"];
	        this.rutas_documentos = this.convertValues(source["rutas_documentos"], null);
	        this.estudiante = this.convertValues(source["estudiante"], student.Estudiante);
	        this.periodo = this.convertValues(source["periodo"], academic.PeriodoLectivo);
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
	export class DetalleSancion {
	    medida_disciplinaria: string;
	    ruta_resolucion: string;
	    cumplio_medida: boolean;
	    motivo_incumplimiento: string;
	
	    static createFrom(source: any = {}) {
	        return new DetalleSancion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.medida_disciplinaria = source["medida_disciplinaria"];
	        this.ruta_resolucion = source["ruta_resolucion"];
	        this.cumplio_medida = source["cumplio_medida"];
	        this.motivo_incumplimiento = source["motivo_incumplimiento"];
	    }
	}
	export class EstudianteDisciplinaDTO {
	    id: number;
	    cedula: string;
	    nombres: string;
	    apellidos: string;
	    ruta_foto: string;
	    matricula_id: number;
	    curso: string;
	
	    static createFrom(source: any = {}) {
	        return new EstudianteDisciplinaDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.cedula = source["cedula"];
	        this.nombres = source["nombres"];
	        this.apellidos = source["apellidos"];
	        this.ruta_foto = source["ruta_foto"];
	        this.matricula_id = source["matricula_id"];
	        this.curso = source["curso"];
	    }
	}
	export class Evidencia {
	    nombre: string;
	    ruta: string;
	
	    static createFrom(source: any = {}) {
	        return new Evidencia(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nombre = source["nombre"];
	        this.ruta = source["ruta"];
	    }
	}
	
	export class GuardarCasoDTO {
	    id: number;
	    estudiante_id: number;
	    tipo_caso: string;
	    fecha_deteccion: string;
	    entidad_derivacion: string;
	    entidad_derivacion_detalle: string;
	    descripcion: string;
	    estado: string;
	
	    static createFrom(source: any = {}) {
	        return new GuardarCasoDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.estudiante_id = source["estudiante_id"];
	        this.tipo_caso = source["tipo_caso"];
	        this.fecha_deteccion = source["fecha_deteccion"];
	        this.entidad_derivacion = source["entidad_derivacion"];
	        this.entidad_derivacion_detalle = source["entidad_derivacion_detalle"];
	        this.descripcion = source["descripcion"];
	        this.estado = source["estado"];
	    }
	}
	export class GuardarLlamadoDTO {
	    id: number;
	    matricula_id: number;
	    fecha: string;
	    motivo: string;
	    representante_notificado: boolean;
	    representante_firmo: boolean;
	    motivo_no_firma: string;
	    medida_disciplinaria: string;
	    cumplio_medida: boolean;
	    motivo_incumplimiento: string;
	    ruta_acta: string;
	    ruta_resolucion: string;
	
	    static createFrom(source: any = {}) {
	        return new GuardarLlamadoDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.matricula_id = source["matricula_id"];
	        this.fecha = source["fecha"];
	        this.motivo = source["motivo"];
	        this.representante_notificado = source["representante_notificado"];
	        this.representante_firmo = source["representante_firmo"];
	        this.motivo_no_firma = source["motivo_no_firma"];
	        this.medida_disciplinaria = source["medida_disciplinaria"];
	        this.cumplio_medida = source["cumplio_medida"];
	        this.motivo_incumplimiento = source["motivo_incumplimiento"];
	        this.ruta_acta = source["ruta_acta"];
	        this.ruta_resolucion = source["ruta_resolucion"];
	    }
	}
	export class LlamadoAtencion {
	    id: number;
	    matricula_id: number;
	    fecha: string;
	    motivo: string;
	    representante_notificado: boolean;
	    representante_firmo: boolean;
	    ruta_acta: string;
	    motivo_no_firma: string;
	    detalle_sancion: common.JSONMap_dece_internal_domain_tracking_DetalleSancion_;
	    matricula?: enrollment.Matricula;
	
	    static createFrom(source: any = {}) {
	        return new LlamadoAtencion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.matricula_id = source["matricula_id"];
	        this.fecha = source["fecha"];
	        this.motivo = source["motivo"];
	        this.representante_notificado = source["representante_notificado"];
	        this.representante_firmo = source["representante_firmo"];
	        this.ruta_acta = source["ruta_acta"];
	        this.motivo_no_firma = source["motivo_no_firma"];
	        this.detalle_sancion = this.convertValues(source["detalle_sancion"], common.JSONMap_dece_internal_domain_tracking_DetalleSancion_);
	        this.matricula = this.convertValues(source["matricula"], enrollment.Matricula);
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
	export class LlamadoResumenDTO {
	    id: number;
	    fecha: string;
	    motivo: string;
	    medida: string;
	    estado: string;
	
	    static createFrom(source: any = {}) {
	        return new LlamadoResumenDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.fecha = source["fecha"];
	        this.motivo = source["motivo"];
	        this.medida = source["medida"];
	        this.estado = source["estado"];
	    }
	}

}

