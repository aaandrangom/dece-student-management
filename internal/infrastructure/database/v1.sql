-- Habilitar Foreign Keys
PRAGMA foreign_keys = ON;

-- ==========================================
-- 1. CONFIGURACIÓN Y ACCESO (ADMIN)
-- ==========================================

CREATE TABLE institucion (
    id INTEGER PRIMARY KEY,
    nombre TEXT,
    codigo_amie TEXT,
    distrito TEXT,
    circuito TEXT,
    direccion TEXT,
    logo_path TEXT
);

CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT UNIQUE NOT NULL -- 'ADMIN', 'RECTOR', 'DECE', 'SECRETARIA'
);

CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombres_completos TEXT,
    rol_id INTEGER,
    activo BOOLEAN DEFAULT 1,
    FOREIGN KEY(rol_id) REFERENCES roles(id)
);

-- ==========================================
-- 2. CATÁLOGOS ACADÉMICOS (Estructura Base)
-- ==========================================

CREATE TABLE anios_lectivos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL, -- "2025-2026"
    fecha_inicio DATE,
    fecha_fin DATE,
    activo BOOLEAN DEFAULT 0,
    cerrado BOOLEAN DEFAULT 0
);

CREATE TABLE docentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cedula TEXT UNIQUE,
    apellidos TEXT NOT NULL,
    nombres TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    activo BOOLEAN DEFAULT 1
);

CREATE TABLE materias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL, -- "Matemáticas"
    area TEXT
);

CREATE TABLE cursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL, -- "Octavo EGB"
    nivel INTEGER -- 8, 9, 10...
);

CREATE TABLE paralelos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL -- "A", "B"
);

-- ==========================================
-- 3. OFERTA ACADÉMICA ANUAL (Relaciones)
-- ==========================================

-- Define el aula física/virtual para un año específico
CREATE TABLE aulas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anio_lectivo_id INTEGER NOT NULL,
    curso_id INTEGER NOT NULL,
    paralelo_id INTEGER NOT NULL,
    tutor_docente_id INTEGER, -- Tutor de este curso este año
    FOREIGN KEY(anio_lectivo_id) REFERENCES anios_lectivos(id),
    FOREIGN KEY(curso_id) REFERENCES cursos(id),
    FOREIGN KEY(paralelo_id) REFERENCES paralelos(id),
    FOREIGN KEY(tutor_docente_id) REFERENCES docentes(id),
    UNIQUE(anio_lectivo_id, curso_id, paralelo_id)
);

-- Carga Horaria: Qué profesor da qué materia en qué aula
CREATE TABLE carga_horaria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aula_id INTEGER NOT NULL,
    materia_id INTEGER NOT NULL,
    docente_id INTEGER NOT NULL,
    FOREIGN KEY(aula_id) REFERENCES aulas(id),
    FOREIGN KEY(materia_id) REFERENCES materias(id),
    FOREIGN KEY(docente_id) REFERENCES docentes(id)
);

-- ==========================================
-- 4. ESTUDIANTE (Perfil Único)
-- ==========================================

CREATE TABLE estudiantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cedula TEXT UNIQUE NOT NULL,
    apellidos TEXT NOT NULL,
    nombres TEXT NOT NULL,
    fecha_nacimiento DATE,
    genero TEXT, -- 'M' o 'F'
    nacionalidad TEXT,
    foto_perfil_path TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. HISTORIAL ACADÉMICO (Ficha Anual)
-- ==========================================

CREATE TABLE historial_academico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id INTEGER NOT NULL,
    aula_id INTEGER NOT NULL, -- Vincula Curso, Paralelo y Año
    
    -- Ubicación y Contacto del Año
    direccion_domicilio TEXT,
    croquis_path TEXT,
    telefono_contacto TEXT,
    
    -- Datos de Ingreso
    es_nuevo BOOLEAN,
    institucion_procedencia TEXT,
    ha_repetido BOOLEAN,
    
    -- Salud Física del Año
    peso REAL,
    talla REAL,
    edad_calculada INTEGER,
    tipo_sangre TEXT,
    
    FOREIGN KEY(estudiante_id) REFERENCES estudiantes(id),
    FOREIGN KEY(aula_id) REFERENCES aulas(id),
    UNIQUE(estudiante_id, aula_id)
);

-- ==========================================
-- 6. FAMILIA Y ENTORNO
-- ==========================================

CREATE TABLE familiares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id INTEGER,
    rol TEXT, -- 'PADRE', 'MADRE', 'REPRESENTANTE'
    cedula TEXT,
    nombres_completos TEXT,
    telefono TEXT,
    profesion TEXT,
    lugar_trabajo TEXT,
    nivel_instruccion TEXT,
    es_representante_legal BOOLEAN,
    documento_legal_path TEXT,
    fallecido BOOLEAN DEFAULT 0,
    FOREIGN KEY(estudiante_id) REFERENCES estudiantes(id)
);

CREATE TABLE convivientes_hogar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    historial_id INTEGER, -- Ligado al año (pueden cambiar)
    nombres_completos TEXT,
    parentesco TEXT,
    edad INTEGER,
    FOREIGN KEY(historial_id) REFERENCES historial_academico(id)
);

-- ==========================================
-- 7. MÓDULOS DECE (Salud, Género, Casos)
-- ==========================================

CREATE TABLE salud_vulnerabilidad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    historial_id INTEGER UNIQUE,
    
    -- Salud
    discapacidad BOOLEAN,
    porcentaje_discapacidad INTEGER,
    tipo_discapacidad TEXT,
    detalles_discapacidad TEXT,
    evaluacion_psicopedagogica BOOLEAN,
    archivo_evaluacion_path TEXT,
    alergias TEXT,
    cirugias TEXT,
    enfermedades TEXT,
    
    -- Genero / Maternidad / Paternidad
    situacion_genero TEXT, -- 'EMBARAZO', 'LACTANCIA', 'PATERNIDAD', 'NINGUNO'
    meses_tiempo INTEGER,
    controles_salud BOOLEAN,
    riesgo_embarazo BOOLEAN,
    nombre_pareja TEXT,
    edad_pareja INTEGER,
    
    FOREIGN KEY(historial_id) REFERENCES historial_academico(id)
);

CREATE TABLE disciplina_casos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    historial_id INTEGER,
    fecha DATE,
    tipo TEXT, -- 'DISCIPLINA' o 'VIOLENCIA'
    subtipo TEXT, -- Para violencia: 'SEXUAL', 'INTRAFAMILIAR', etc.
    descripcion_motivo TEXT,
    gravedad TEXT, -- 'LEVE', 'GRAVE', 'MUY_GRAVE'
    
    -- Gestión
    acciones_realizadas TEXT,
    resolucion TEXT,
    derivado_a TEXT, -- 'Fiscalia', 'Distrito'
    fecha_derivacion DATE, -- Para violencia
    archivo_adjunto_path TEXT,
    archivo_acta_path TEXT,
    estado TEXT, -- 'ABIERTO', 'CERRADO', 'EN_SEGUIMIENTO'
    
    -- Representantes
    notifico_representante BOOLEAN,
    firmo_acta BOOLEAN,
    motivo_no_firma TEXT,
    cumplio_medida BOOLEAN,
    
    FOREIGN KEY(historial_id) REFERENCES historial_academico(id)
);

-- ==========================================
-- 8. GESTIÓN (Citas y Capacitaciones)
-- ==========================================

CREATE TABLE citas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    historial_id INTEGER,
    fecha_cita DATETIME,
    motivo TEXT,
    entidad_destino TEXT,
    notificar_dias_antes INTEGER,
    visto BOOLEAN DEFAULT 0,
    estado TEXT DEFAULT 'PENDIENTE',
    FOREIGN KEY(historial_id) REFERENCES historial_academico(id)
);

CREATE TABLE capacitaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anio_lectivo_id INTEGER,
    tema TEXT,
    fecha DATE,
    publico_objetivo TEXT, -- Docentes, Padres
    asistentes_count INTEGER,
    archivo_evidencia_path TEXT,
    FOREIGN KEY(anio_lectivo_id) REFERENCES anios_lectivos(id)
);