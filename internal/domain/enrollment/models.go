package enrollment

import (
	"dece/internal/domain/common"
	"dece/internal/domain/faculty"
	"dece/internal/domain/student"
)

type MateriaReferencia struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
}

type Antropometria struct {
	Peso       float64 `json:"peso"`
	Talla      float64 `json:"talla"`
	TipoSangre string  `json:"tipo_sangre"`
}

type HistorialAcademico struct {
	EsNuevoEstudiante   bool   `json:"es_nuevo_estudiante"`
	InstitucionAnterior string `json:"institucion_anterior"`
	ProvinciaAnterior   string `json:"provincia_anterior"`
	CantonAnterior      string `json:"canton_anterior"`

	HaRepetidoAnio      bool   `json:"ha_repetido_anio"`
	DetalleAnioRepetido string `json:"detalle_anio_repetido"`

	// Listas de objetos {id, nombre}
	MateriasFavoritas   []MateriaReferencia `json:"materias_favoritas"`
	MateriasMenosGustan []MateriaReferencia `json:"materias_menos_gustan"`
}

type DatosSalud struct {
	TieneEvalPsicopedagogica bool   `json:"tiene_eval_psicopedagogica"`
	RutaEvalPsicopedagogica  string `json:"ruta_eval_psicopedagogica"` // Path al PDF

	TieneDiscapacidad   bool   `json:"tiene_discapacidad"`
	DetalleDiscapacidad string `json:"detalle_discapacidad"`

	HaSufridoAccidente bool   `json:"ha_sufrido_accidente"`
	DetalleAccidente   string `json:"detalle_accidente"`

	TieneAlergias  bool   `json:"tiene_alergias"`
	DetalleAlergia string `json:"detalle_alergia"`

	TieneCirugias  bool   `json:"tiene_cirugias"`
	DetalleCirugia string `json:"detalle_cirugia"`

	TieneEnfermedad   bool   `json:"tiene_enfermedad"`
	DetalleEnfermedad string `json:"detalle_enfermedad"`
}

type DatosSociales struct {
	ActividadExtra    string `json:"actividad_extra"`
	PracticaActividad bool   `json:"practica_actividad"`
}

type InfoPadresPareja struct {
	NombresMadre  string `json:"nombres_madre"`
	TelefonoMadre string `json:"telefono_madre"`
	NombresPadre  string `json:"nombres_padre"`
	TelefonoPadre string `json:"telefono_padre"`
	Direccion     string `json:"direccion,omitempty"` // Opcional
}

type CondicionGenero struct {
	// =========================================================
	// SECCIÓN MUJERES: EMBARAZO
	// =========================================================
	EstaEmbarazada       bool   `json:"esta_embarazada"`
	MesesEmbarazo        int    `json:"meses_embarazo,omitempty"`
	LlevaControl         bool   `json:"lleva_control,omitempty"`
	EsAltoRiesgo         bool   `json:"es_alto_riesgo,omitempty"`
	TipoApoyoInstitucion string `json:"tipo_apoyo_institucion,omitempty"` // Si es riesgo, qué apoyo recibe
	NombrePadreBebe      string `json:"nombre_padre_bebe,omitempty"`      // Opcional
	VivenJuntosPadres    bool   `json:"viven_juntos_padres,omitempty"`    // ¿Ella y el padre viven juntos?

	// =========================================================
	// SECCIÓN MUJERES: LACTANCIA
	// =========================================================
	EstaLactando         bool   `json:"esta_lactando"`
	MesesLactancia       int    `json:"meses_lactancia,omitempty"`
	GeneroBebe           string `json:"genero_bebe,omitempty"` // "Masculino", "Femenino"
	DiasNacido           int    `json:"dias_nacido,omitempty"`
	NombrePadreLactancia string `json:"nombre_padre_lactancia,omitempty"`
	EdadPadreLactancia   int    `json:"edad_padre_lactancia,omitempty"`

	// =========================================================
	// SECCIÓN MUJERES: MATERNIDAD
	// =========================================================
	TiempoMaternidad string `json:"tiempo_maternidad,omitempty"` // Tiempo que lleva de permiso/maternidad

	// =========================================================
	// SECCIÓN HOMBRES: PATERNIDAD
	// =========================================================
	EsPadre          bool   `json:"es_padre"`
	TiempoPaternidad string `json:"tiempo_paternidad,omitempty"`
	NombrePareja     string `json:"nombre_pareja,omitempty"`
	EdadPareja       int    `json:"edad_pareja,omitempty"`
	TelefonoPareja   string `json:"telefono_pareja,omitempty"`

	ParejaEsMenorDeEdad bool              `json:"pareja_es_menor_de_edad,omitempty"`
	DetallePadresPareja *InfoPadresPareja `json:"detalle_padres_pareja,omitempty"`
}

// --- Modelo Principal ---
type Matricula struct {
	ID           uint `gorm:"primaryKey" json:"id"`
	EstudianteID uint `json:"estudiante_id"`
	CursoID      uint `json:"curso_id"`

	Estado      string `gorm:"default:'Matriculado'" json:"estado"`
	EsRepetidor bool   `json:"es_repetidor"`

	// Campos JSON usando el wrapper genérico
	Antropometria      common.JSONMap[Antropometria]      `gorm:"type:text" json:"antropometria"`
	HistorialAcademico common.JSONMap[HistorialAcademico] `gorm:"type:text" json:"historial_academico"`
	DatosSalud         common.JSONMap[DatosSalud]         `gorm:"type:text" json:"datos_salud"`
	DatosSociales      common.JSONMap[DatosSociales]      `gorm:"type:text" json:"datos_sociales"`
	CondicionGenero    common.JSONMap[CondicionGenero]    `gorm:"type:text" json:"condicion_genero"`

	DireccionActual string `json:"direccion_actual"`
	RutaCroquis     string `json:"ruta_croquis"`
	FechaRegistro   string `json:"fecha_registro"`
	// Relaciones
	Estudiante student.Estudiante `gorm:"foreignKey:EstudianteID" json:"estudiante,omitempty"`
	Curso      faculty.Curso      `gorm:"foreignKey:CursoID" json:"curso,omitempty"`
}
