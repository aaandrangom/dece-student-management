export namespace academic {
	
	export class AnioLectivo {
	    ID: number;
	    Nombre: string;
	    FechaInicio: time.Time;
	    FechaFin: time.Time;
	    Activo: boolean;
	    Cerrado: boolean;
	
	    static createFrom(source: any = {}) {
	        return new AnioLectivo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Nombre = source["Nombre"];
	        this.FechaInicio = this.convertValues(source["FechaInicio"], time.Time);
	        this.FechaFin = this.convertValues(source["FechaFin"], time.Time);
	        this.Activo = source["Activo"];
	        this.Cerrado = source["Cerrado"];
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
	export class Docente {
	    ID: number;
	    Cedula: string;
	    Apellidos: string;
	    Nombres: string;
	    Telefono: string;
	    Email: string;
	    Activo: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Docente(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Cedula = source["Cedula"];
	        this.Apellidos = source["Apellidos"];
	        this.Nombres = source["Nombres"];
	        this.Telefono = source["Telefono"];
	        this.Email = source["Email"];
	        this.Activo = source["Activo"];
	    }
	}
	export class Paralelo {
	    ID: number;
	    Nombre: string;
	
	    static createFrom(source: any = {}) {
	        return new Paralelo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Nombre = source["Nombre"];
	    }
	}
	export class Curso {
	    ID: number;
	    Nombre: string;
	    Nivel: number;
	
	    static createFrom(source: any = {}) {
	        return new Curso(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Nombre = source["Nombre"];
	        this.Nivel = source["Nivel"];
	    }
	}
	export class Aula {
	    ID: number;
	    AnioLectivoID: number;
	    CursoID: number;
	    ParaleloID: number;
	    TutorDocenteID?: number;
	    AnioLectivo: AnioLectivo;
	    Curso: Curso;
	    Paralelo: Paralelo;
	    TutorDocente?: Docente;
	
	    static createFrom(source: any = {}) {
	        return new Aula(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.AnioLectivoID = source["AnioLectivoID"];
	        this.CursoID = source["CursoID"];
	        this.ParaleloID = source["ParaleloID"];
	        this.TutorDocenteID = source["TutorDocenteID"];
	        this.AnioLectivo = this.convertValues(source["AnioLectivo"], AnioLectivo);
	        this.Curso = this.convertValues(source["Curso"], Curso);
	        this.Paralelo = this.convertValues(source["Paralelo"], Paralelo);
	        this.TutorDocente = this.convertValues(source["TutorDocente"], Docente);
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
	export class AulaDTO {
	    id: number;
	    anio_lectivo_id: number;
	    curso_id: number;
	    curso_nombre: string;
	    paralelo_id: number;
	    paralelo_nombre: string;
	    tutor_id?: number;
	    tutor_nombre: string;
	
	    static createFrom(source: any = {}) {
	        return new AulaDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.anio_lectivo_id = source["anio_lectivo_id"];
	        this.curso_id = source["curso_id"];
	        this.curso_nombre = source["curso_nombre"];
	        this.paralelo_id = source["paralelo_id"];
	        this.paralelo_nombre = source["paralelo_nombre"];
	        this.tutor_id = source["tutor_id"];
	        this.tutor_nombre = source["tutor_nombre"];
	    }
	}
	export class CargaHorariaDTO {
	    id: number;
	    aula_id: number;
	    materia_id: number;
	    materia_nombre: string;
	    docente_id: number;
	    docente_nombre: string;
	
	    static createFrom(source: any = {}) {
	        return new CargaHorariaDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.aula_id = source["aula_id"];
	        this.materia_id = source["materia_id"];
	        this.materia_nombre = source["materia_nombre"];
	        this.docente_id = source["docente_id"];
	        this.docente_nombre = source["docente_nombre"];
	    }
	}
	
	
	export class Materia {
	    ID: number;
	    Nombre: string;
	    Area: string;
	    Activo: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Materia(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Nombre = source["Nombre"];
	        this.Area = source["Area"];
	        this.Activo = source["Activo"];
	    }
	}

}

export namespace management {
	
	export class TrainingDTO {
	    id: number;
	    anio_lectivo_id: number;
	    tema: string;
	    fecha: time.Time;
	    publico_objetivo: string;
	    asistentes_count: number;
	    archivo_evidencia_path: string;
	
	    static createFrom(source: any = {}) {
	        return new TrainingDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.anio_lectivo_id = source["anio_lectivo_id"];
	        this.tema = source["tema"];
	        this.fecha = this.convertValues(source["fecha"], time.Time);
	        this.publico_objetivo = source["publico_objetivo"];
	        this.asistentes_count = source["asistentes_count"];
	        this.archivo_evidencia_path = source["archivo_evidencia_path"];
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

export namespace services {
	
	export class LoginResponse {
	    nombres_completos: string;
	    rol: string;
	
	    static createFrom(source: any = {}) {
	        return new LoginResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nombres_completos = source["nombres_completos"];
	        this.rol = source["rol"];
	    }
	}

}

export namespace student {
	
	export class AnioLectivoSimpleDTO {
	    id: number;
	    nombre: string;
	    activo: boolean;
	
	    static createFrom(source: any = {}) {
	        return new AnioLectivoSimpleDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nombre = source["nombre"];
	        this.activo = source["activo"];
	    }
	}
	export class AulaOptionDTO {
	    id: number;
	    paralelo: string;
	
	    static createFrom(source: any = {}) {
	        return new AulaOptionDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.paralelo = source["paralelo"];
	    }
	}
	export class FamiliarDTO {
	    cedula: string;
	    nombres: string;
	    telefono: string;
	    profesion: string;
	    lugar_trabajo: string;
	    nivel_instruccion: string;
	
	    static createFrom(source: any = {}) {
	        return new FamiliarDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.cedula = source["cedula"];
	        this.nombres = source["nombres"];
	        this.telefono = source["telefono"];
	        this.profesion = source["profesion"];
	        this.lugar_trabajo = source["lugar_trabajo"];
	        this.nivel_instruccion = source["nivel_instruccion"];
	    }
	}
	export class EnrollmentDTO {
	    cedula: string;
	    apellidos: string;
	    nombres: string;
	    fecha_nacimiento: string;
	    genero: string;
	    nacionalidad: string;
	    direccion: string;
	    telefono: string;
	    aula_id: number;
	    es_repetidor: boolean;
	    institucion_procedencia: string;
	    padre: FamiliarDTO;
	    madre: FamiliarDTO;
	    representante: FamiliarDTO;
	    representante_rol: string;
	    peso: number;
	    talla: number;
	    discapacidad: boolean;
	    detalles_discapacidad: string;
	
	    static createFrom(source: any = {}) {
	        return new EnrollmentDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.cedula = source["cedula"];
	        this.apellidos = source["apellidos"];
	        this.nombres = source["nombres"];
	        this.fecha_nacimiento = source["fecha_nacimiento"];
	        this.genero = source["genero"];
	        this.nacionalidad = source["nacionalidad"];
	        this.direccion = source["direccion"];
	        this.telefono = source["telefono"];
	        this.aula_id = source["aula_id"];
	        this.es_repetidor = source["es_repetidor"];
	        this.institucion_procedencia = source["institucion_procedencia"];
	        this.padre = this.convertValues(source["padre"], FamiliarDTO);
	        this.madre = this.convertValues(source["madre"], FamiliarDTO);
	        this.representante = this.convertValues(source["representante"], FamiliarDTO);
	        this.representante_rol = source["representante_rol"];
	        this.peso = source["peso"];
	        this.talla = source["talla"];
	        this.discapacidad = source["discapacidad"];
	        this.detalles_discapacidad = source["detalles_discapacidad"];
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
	    ID: number;
	    Cedula: string;
	    Apellidos: string;
	    Nombres: string;
	    FechaNacimiento: time.Time;
	    Genero: string;
	    Nacionalidad: string;
	    FotoPerfilPath: string;
	    FechaRegistro: time.Time;
	
	    static createFrom(source: any = {}) {
	        return new Estudiante(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Cedula = source["Cedula"];
	        this.Apellidos = source["Apellidos"];
	        this.Nombres = source["Nombres"];
	        this.FechaNacimiento = this.convertValues(source["FechaNacimiento"], time.Time);
	        this.Genero = source["Genero"];
	        this.Nacionalidad = source["Nacionalidad"];
	        this.FotoPerfilPath = source["FotoPerfilPath"];
	        this.FechaRegistro = this.convertValues(source["FechaRegistro"], time.Time);
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
	export class Familiar {
	    ID: number;
	    EstudianteID: number;
	    Rol: string;
	    Cedula: string;
	    NombresCompletos: string;
	    Telefono: string;
	    Profesion: string;
	    LugarTrabajo: string;
	    NivelInstruccion: string;
	    EsRepresentanteLegal: boolean;
	    DocumentoLegalPath: string;
	    Fallecido: boolean;
	    Estudiante: Estudiante;
	
	    static createFrom(source: any = {}) {
	        return new Familiar(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.EstudianteID = source["EstudianteID"];
	        this.Rol = source["Rol"];
	        this.Cedula = source["Cedula"];
	        this.NombresCompletos = source["NombresCompletos"];
	        this.Telefono = source["Telefono"];
	        this.Profesion = source["Profesion"];
	        this.LugarTrabajo = source["LugarTrabajo"];
	        this.NivelInstruccion = source["NivelInstruccion"];
	        this.EsRepresentanteLegal = source["EsRepresentanteLegal"];
	        this.DocumentoLegalPath = source["DocumentoLegalPath"];
	        this.Fallecido = source["Fallecido"];
	        this.Estudiante = this.convertValues(source["Estudiante"], Estudiante);
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
	
	export class HistorialAcademico {
	    ID: number;
	    EstudianteID: number;
	    AulaID: number;
	    DireccionDomicilio: string;
	    CroquisPath: string;
	    TelefonoContacto: string;
	    EsNuevo: boolean;
	    InstitucionProcedencia: string;
	    HaRepetido: boolean;
	    Peso: number;
	    Talla: number;
	    EdadCalculada: number;
	    TipoSangre: string;
	    Estado: string;
	    FechaRetiro?: time.Time;
	    MotivoRetiro: string;
	    Estudiante: Estudiante;
	    Aula: academic.Aula;
	
	    static createFrom(source: any = {}) {
	        return new HistorialAcademico(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.EstudianteID = source["EstudianteID"];
	        this.AulaID = source["AulaID"];
	        this.DireccionDomicilio = source["DireccionDomicilio"];
	        this.CroquisPath = source["CroquisPath"];
	        this.TelefonoContacto = source["TelefonoContacto"];
	        this.EsNuevo = source["EsNuevo"];
	        this.InstitucionProcedencia = source["InstitucionProcedencia"];
	        this.HaRepetido = source["HaRepetido"];
	        this.Peso = source["Peso"];
	        this.Talla = source["Talla"];
	        this.EdadCalculada = source["EdadCalculada"];
	        this.TipoSangre = source["TipoSangre"];
	        this.Estado = source["Estado"];
	        this.FechaRetiro = this.convertValues(source["FechaRetiro"], time.Time);
	        this.MotivoRetiro = source["MotivoRetiro"];
	        this.Estudiante = this.convertValues(source["Estudiante"], Estudiante);
	        this.Aula = this.convertValues(source["Aula"], academic.Aula);
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
	export class StudentListDTO {
	    id: number;
	    cedula: string;
	    apellidos: string;
	    nombres: string;
	    curso: string;
	    paralelo: string;
	    anio_lectivo: string;
	    tiene_discapacidad: boolean;
	    tiene_caso_dece: boolean;
	    es_repetidor: boolean;
	    foto_perfil: string;
	    estado: string;
	    motivo_retiro: string;
	    fecha_retiro: string;
	
	    static createFrom(source: any = {}) {
	        return new StudentListDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.cedula = source["cedula"];
	        this.apellidos = source["apellidos"];
	        this.nombres = source["nombres"];
	        this.curso = source["curso"];
	        this.paralelo = source["paralelo"];
	        this.anio_lectivo = source["anio_lectivo"];
	        this.tiene_discapacidad = source["tiene_discapacidad"];
	        this.tiene_caso_dece = source["tiene_caso_dece"];
	        this.es_repetidor = source["es_repetidor"];
	        this.foto_perfil = source["foto_perfil"];
	        this.estado = source["estado"];
	        this.motivo_retiro = source["motivo_retiro"];
	        this.fecha_retiro = source["fecha_retiro"];
	    }
	}
	export class StudentListResponse {
	    data: StudentListDTO[];
	    total: number;
	    page: number;
	
	    static createFrom(source: any = {}) {
	        return new StudentListResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.data = this.convertValues(source["data"], StudentListDTO);
	        this.total = source["total"];
	        this.page = source["page"];
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
	export class StudentProfileDTO {
	    estudiante: Estudiante;
	    historial_actual?: HistorialAcademico;
	    familiares: Familiar[];
	    salud?: welfare.SaludVulnerabilidad;
	    anios_disponibles: AnioLectivoSimpleDTO[];
	
	    static createFrom(source: any = {}) {
	        return new StudentProfileDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.estudiante = this.convertValues(source["estudiante"], Estudiante);
	        this.historial_actual = this.convertValues(source["historial_actual"], HistorialAcademico);
	        this.familiares = this.convertValues(source["familiares"], Familiar);
	        this.salud = this.convertValues(source["salud"], welfare.SaludVulnerabilidad);
	        this.anios_disponibles = this.convertValues(source["anios_disponibles"], AnioLectivoSimpleDTO);
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
	export class WithdrawnStudentDTO {
	    id: number;
	    cedula: string;
	    apellidos: string;
	    nombres: string;
	    curso: string;
	    paralelo: string;
	    fecha_retiro: time.Time;
	    motivo_retiro: string;
	    foto_perfil: string;
	
	    static createFrom(source: any = {}) {
	        return new WithdrawnStudentDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.cedula = source["cedula"];
	        this.apellidos = source["apellidos"];
	        this.nombres = source["nombres"];
	        this.curso = source["curso"];
	        this.paralelo = source["paralelo"];
	        this.fecha_retiro = this.convertValues(source["fecha_retiro"], time.Time);
	        this.motivo_retiro = source["motivo_retiro"];
	        this.foto_perfil = source["foto_perfil"];
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
	export class WithdrawnStudentListResponse {
	    data: WithdrawnStudentDTO[];
	    total: number;
	    page: number;
	
	    static createFrom(source: any = {}) {
	        return new WithdrawnStudentListResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.data = this.convertValues(source["data"], WithdrawnStudentDTO);
	        this.total = source["total"];
	        this.page = source["page"];
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

export namespace welfare {
	
	export class CitaDTO {
	    id: number;
	    historial_id: number;
	    fecha_cita: time.Time;
	    motivo: string;
	    entidad_destino: string;
	    notificar_dias_antes: number;
	    visto: boolean;
	    estado: string;
	
	    static createFrom(source: any = {}) {
	        return new CitaDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.historial_id = source["historial_id"];
	        this.fecha_cita = this.convertValues(source["fecha_cita"], time.Time);
	        this.motivo = source["motivo"];
	        this.entidad_destino = source["entidad_destino"];
	        this.notificar_dias_antes = source["notificar_dias_antes"];
	        this.visto = source["visto"];
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
	export class ConvivienteHogar {
	    ID: number;
	    HistorialID: number;
	    NombresCompletos: string;
	    Parentesco: string;
	    Edad: number;
	    Historial: student.HistorialAcademico;
	
	    static createFrom(source: any = {}) {
	        return new ConvivienteHogar(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.HistorialID = source["HistorialID"];
	        this.NombresCompletos = source["NombresCompletos"];
	        this.Parentesco = source["Parentesco"];
	        this.Edad = source["Edad"];
	        this.Historial = this.convertValues(source["Historial"], student.HistorialAcademico);
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
	export class DisciplineCaseDTO {
	    id: number;
	    historial_id: number;
	    estudiante_id: number;
	    fecha: time.Time;
	    tipo: string;
	    subtipo: string;
	    descripcion_motivo: string;
	    gravedad: string;
	    acciones_realizadas: string;
	    resolucion: string;
	    derivado_a: string;
	    fecha_derivacion?: time.Time;
	    archivo_adjunto_path: string;
	    archivo_acta_path: string;
	    estado: string;
	    notifico_representante: boolean;
	    firmo_acta: boolean;
	    motivo_no_firma: string;
	    cumplio_medida: boolean;
	
	    static createFrom(source: any = {}) {
	        return new DisciplineCaseDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.historial_id = source["historial_id"];
	        this.estudiante_id = source["estudiante_id"];
	        this.fecha = this.convertValues(source["fecha"], time.Time);
	        this.tipo = source["tipo"];
	        this.subtipo = source["subtipo"];
	        this.descripcion_motivo = source["descripcion_motivo"];
	        this.gravedad = source["gravedad"];
	        this.acciones_realizadas = source["acciones_realizadas"];
	        this.resolucion = source["resolucion"];
	        this.derivado_a = source["derivado_a"];
	        this.fecha_derivacion = this.convertValues(source["fecha_derivacion"], time.Time);
	        this.archivo_adjunto_path = source["archivo_adjunto_path"];
	        this.archivo_acta_path = source["archivo_acta_path"];
	        this.estado = source["estado"];
	        this.notifico_representante = source["notifico_representante"];
	        this.firmo_acta = source["firmo_acta"];
	        this.motivo_no_firma = source["motivo_no_firma"];
	        this.cumplio_medida = source["cumplio_medida"];
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
	export class HealthDataDTO {
	    historial_id: number;
	    estudiante_id: number;
	    nombres_completos: string;
	    genero: string;
	    discapacidad: boolean;
	    porcentaje_discapacidad: number;
	    tipo_discapacidad: string;
	    detalles_discapacidad: string;
	    evaluacion_psicopedagogica: boolean;
	    archivo_evaluacion_path: string;
	    alergias: string;
	    cirugias: string;
	    enfermedades: string;
	    situacion_genero: string;
	    meses_tiempo: number;
	    controles_salud: boolean;
	    riesgo_embarazo: boolean;
	    nombre_pareja: string;
	    edad_pareja: number;
	    convivientes: ConvivienteHogar[];
	
	    static createFrom(source: any = {}) {
	        return new HealthDataDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.historial_id = source["historial_id"];
	        this.estudiante_id = source["estudiante_id"];
	        this.nombres_completos = source["nombres_completos"];
	        this.genero = source["genero"];
	        this.discapacidad = source["discapacidad"];
	        this.porcentaje_discapacidad = source["porcentaje_discapacidad"];
	        this.tipo_discapacidad = source["tipo_discapacidad"];
	        this.detalles_discapacidad = source["detalles_discapacidad"];
	        this.evaluacion_psicopedagogica = source["evaluacion_psicopedagogica"];
	        this.archivo_evaluacion_path = source["archivo_evaluacion_path"];
	        this.alergias = source["alergias"];
	        this.cirugias = source["cirugias"];
	        this.enfermedades = source["enfermedades"];
	        this.situacion_genero = source["situacion_genero"];
	        this.meses_tiempo = source["meses_tiempo"];
	        this.controles_salud = source["controles_salud"];
	        this.riesgo_embarazo = source["riesgo_embarazo"];
	        this.nombre_pareja = source["nombre_pareja"];
	        this.edad_pareja = source["edad_pareja"];
	        this.convivientes = this.convertValues(source["convivientes"], ConvivienteHogar);
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
	export class SaludVulnerabilidad {
	    ID: number;
	    HistorialID: number;
	    Discapacidad: boolean;
	    PorcentajeDiscapacidad: number;
	    TipoDiscapacidad: string;
	    DetallesDiscapacidad: string;
	    EvaluacionPsicopedagogica: boolean;
	    ArchivoEvaluacionPath: string;
	    Alergias: string;
	    Cirugias: string;
	    Enfermedades: string;
	    SituacionGenero: string;
	    MesesTiempo: number;
	    ControlesSalud: boolean;
	    RiesgoEmbarazo: boolean;
	    NombrePareja: string;
	    EdadPareja: number;
	    Historial: student.HistorialAcademico;
	
	    static createFrom(source: any = {}) {
	        return new SaludVulnerabilidad(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.HistorialID = source["HistorialID"];
	        this.Discapacidad = source["Discapacidad"];
	        this.PorcentajeDiscapacidad = source["PorcentajeDiscapacidad"];
	        this.TipoDiscapacidad = source["TipoDiscapacidad"];
	        this.DetallesDiscapacidad = source["DetallesDiscapacidad"];
	        this.EvaluacionPsicopedagogica = source["EvaluacionPsicopedagogica"];
	        this.ArchivoEvaluacionPath = source["ArchivoEvaluacionPath"];
	        this.Alergias = source["Alergias"];
	        this.Cirugias = source["Cirugias"];
	        this.Enfermedades = source["Enfermedades"];
	        this.SituacionGenero = source["SituacionGenero"];
	        this.MesesTiempo = source["MesesTiempo"];
	        this.ControlesSalud = source["ControlesSalud"];
	        this.RiesgoEmbarazo = source["RiesgoEmbarazo"];
	        this.NombrePareja = source["NombrePareja"];
	        this.EdadPareja = source["EdadPareja"];
	        this.Historial = this.convertValues(source["Historial"], student.HistorialAcademico);
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

