
PRAGMA foreign_keys = ON;

-- Tabla: usuarios
-- Descripción: Acceso al sistema.
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_usuario TEXT NOT NULL UNIQUE, 
    clave_hash TEXT NOT NULL,            
    nombre_completo TEXT NOT NULL,
    rol TEXT DEFAULT 'dece' CHECK(rol IN ('admin', 'dece', 'rector', 'docente', 'secretaria')),
    activo INTEGER DEFAULT 1,            
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: configuracion_institucional
-- Descripción: Datos del colegio para encabezados de reportes.
CREATE TABLE IF NOT EXISTS configuracion_institucional (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    codigo_amie TEXT,
    distrito TEXT,
    circuito TEXT,
    detalle_ubicacion TEXT, 
    autoridades TEXT,     
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- [MODULO 2] CATÁLOGOS ACADÉMICOS (Infraestructura Lógica)
-- ==============================================================================

-- Tabla: periodos_lectivos
-- Descripción: Años escolares (Ej: "2024-2025").
CREATE TABLE IF NOT EXISTS periodos_lectivos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE, 
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    es_activo INTEGER DEFAULT 0,
    cerrado BOOLEAN DEFAULT 0
);

-- Tabla: niveles_educativos
-- Descripción: Grados disponibles. Ej: "8vo EGB", "1ro Bachillerato".
CREATE TABLE IF NOT EXISTS niveles_educativos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE, 
    nombre_completo TEXT NOT NULL,
    orden INTEGER NOT NULL
);

-- Tabla: materias
-- Descripción: Asignaturas generales. Ej: "Matemáticas", "Lengua".
CREATE TABLE IF NOT EXISTS materias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    area TEXT
);

-- ==============================================================================
-- [MODULO 3] PLANTA DOCENTE Y DISTRIBUTIVO
-- ==============================================================================

-- Tabla: docentes
-- Descripción: Información básica de los profesores.
CREATE TABLE IF NOT EXISTS docentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cedula TEXT UNIQUE,
    nombres_completos TEXT NOT NULL,
    telefono TEXT,
    correo TEXT,
    activo INTEGER DEFAULT 1
);

-- Tabla: cursos (Aulas Reales)
-- Descripción: Un curso existe en un tiempo y espacio (Nivel + Paralelo + Año).
CREATE TABLE IF NOT EXISTS cursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    periodo_id INTEGER NOT NULL,
    nivel_id INTEGER NOT NULL,    
    paralelo TEXT NOT NULL, 
    jornada TEXT NOT NULL CHECK(jornada IN ('Matutina', 'Vespertina', 'Nocturna')),
    tutor_id INTEGER,           
    
    FOREIGN KEY (periodo_id) REFERENCES periodos_lectivos(id),
    FOREIGN KEY (nivel_id) REFERENCES niveles_educativos(id),
    FOREIGN KEY (tutor_id) REFERENCES docentes(id),
    
    UNIQUE(periodo_id, nivel_id, paralelo, jornada)
);

-- Tabla: distributivo_materias
-- Descripción: Qué docente da qué materia en qué curso específico.
CREATE TABLE IF NOT EXISTS distributivo_materias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    curso_id INTEGER NOT NULL,
    materia_id INTEGER NOT NULL,
    docente_id INTEGER NOT NULL,
    
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES materias(id),
    FOREIGN KEY (docente_id) REFERENCES docentes(id),
    
    UNIQUE(curso_id, materia_id)
);

-- ==============================================================================
-- [MODULO 4] ESTUDIANTES Y FAMILIA (Datos Estáticos)
-- ==============================================================================

-- Tabla: estudiantes
-- Descripción: Datos permanentes del estudiante.
CREATE TABLE IF NOT EXISTS estudiantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cedula TEXT UNIQUE NOT NULL,
    apellidos TEXT NOT NULL,
    nombres TEXT NOT NULL,
    fecha_nacimiento DATE,
    genero_nacimiento TEXT CHECK(genero_nacimiento IN ('M', 'F')), 
    info_nacionalidad TEXT, 
    ruta_foto TEXT, 
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: familiares
-- Descripción: Padres, Representantes Legales y otros familiares.
CREATE TABLE IF NOT EXISTS familiares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id INTEGER NOT NULL,
    cedula TEXT,
    nombres_completos TEXT NOT NULL,
    parentesco TEXT NOT NULL,
    es_representante_legal INTEGER DEFAULT 0, 
    vive_con_estudiante INTEGER DEFAULT 0,    
    datos_extendidos TEXT, 
    telefono_personal TEXT,
    fallecido INTEGER DEFAULT 0,
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
);

-- ==============================================================================
-- [MODULO 5] MATRÍCULA Y FICHA DECE (El Corazón del Sistema)
-- ==============================================================================

-- Tabla: matriculas
-- Vincula al estudiante con un CURSO ESPECÍFICO.
-- Hereda automáticamente: Periodo, Materias, Docentes y Tutor del curso.
CREATE TABLE IF NOT EXISTS matriculas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id INTEGER NOT NULL,
    curso_id INTEGER NOT NULL,
    estado TEXT DEFAULT 'Matriculado',
    es_repetidor INTEGER DEFAULT 0,    
    antropometria TEXT,   
    historial_academico TEXT,
    datos_salud TEXT,      
    datos_sociales TEXT,          
    condicion_genero TEXT, 
    direccion_actual TEXT,    
    ruta_croquis TEXT,        
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    FOREIGN KEY (curso_id) REFERENCES cursos(id),
    UNIQUE(estudiante_id, curso_id) 
);

-- ==============================================================================
-- [MODULO 6] SEGUIMIENTO DECE (Casos)
-- ==============================================================================

-- Tabla: llamados_atencion (Disciplina)
-- Descrupción: Expediente disciplinario. Se vincula a la matrícula del año actual		
CREATE TABLE IF NOT EXISTS llamados_atencion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    motivo TEXT NOT NULL,
    representante_notificado INTEGER DEFAULT 0,
    representante_firmo INTEGER DEFAULT 0,
    ruta_acta TEXT, 
    motivo_no_firma TEXT,
    detalle_sancion TEXT,
    FOREIGN KEY (matricula_id) REFERENCES matriculas(id) ON DELETE CASCADE
);

-- Tabla: casos_sensibles (Violencia, Riesgo)
-- Se vincula al ESTUDIANTE (ID permanente) y al PERIODO (Fecha suceso)
CREATE TABLE IF NOT EXISTS casos_sensibles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id INTEGER NOT NULL, 
    periodo_id INTEGER NOT NULL,    
    codigo_caso TEXT,      
    fecha_deteccion DATE,
    fecha_derivacion DATE,
    entidad_derivacion TEXT, 
    descripcion TEXT,
    estado TEXT DEFAULT 'Abierto', 
    rutas_documentos TEXT,
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    FOREIGN KEY (periodo_id) REFERENCES periodos_lectivos(id)
);

-- ==============================================================================
-- [MODULO 7] ADMINISTRACIÓN DECE
-- ==============================================================================

-- Tabla: convocatorias (Citas externas)
-- Descripción: Citas médicas, psicológicas u otras externas.
CREATE TABLE IF NOT EXISTS convocatorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula_id INTEGER NOT NULL,
    entidad TEXT NOT NULL, 
    fecha_cita DATETIME NOT NULL,
    dias_anticipacion_alerta INTEGER DEFAULT 2, 
    cita_completada INTEGER DEFAULT 0,
    FOREIGN KEY (matricula_id) REFERENCES matriculas(id) ON DELETE CASCADE
);

-- Tabla: capacitaciones
-- Descripción: Actividades de formación organizadas por el DECE.
CREATE TABLE IF NOT EXISTS capacitaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    periodo_id INTEGER NOT NULL,
    tema TEXT NOT NULL,
    fecha DATETIME NOT NULL,
    detalle_audiencia TEXT, 
    ruta_evidencia TEXT, 
    FOREIGN KEY (periodo_id) REFERENCES periodos_lectivos(id)
);

-- Tabla: notificaciones
-- Descripción: Notificaciones persistentes (por rol). Usada para agrupar alertas diarias.
CREATE TABLE IF NOT EXISTS notificaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    rol_destino TEXT NOT NULL DEFAULT 'admin',
    fecha_programada DATE NOT NULL,
    momento TEXT NOT NULL,
    titulo TEXT NOT NULL,
    mensaje TEXT,
    leida INTEGER DEFAULT 0,
    metadata TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tipo, rol_destino, fecha_programada, momento)
);