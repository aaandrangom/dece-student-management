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

	MateriasFavoritas   []MateriaReferencia `json:"materias_favoritas"`
	MateriasMenosGustan []MateriaReferencia `json:"materias_menos_gustan"`
}

type DatosSalud struct {
	TieneEvalPsicopedagogica bool   `json:"tiene_eval_psicopedagogica"`
	RutaEvalPsicopedagogica  string `json:"ruta_eval_psicopedagogica"`

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
	Actividades       []string `json:"actividades"`
	PracticaActividad bool     `json:"practica_actividad"`
}

type InfoPadresPareja struct {
	Nombres    string `json:"nombres"`
	Apellidos  string `json:"apellidos"`
	Cedula     string `json:"cedula"`
	Telefono   string `json:"telefono"`
	Parentesco string `json:"parentesco"`
}

type CondicionGenero struct {
	EstaEmbarazada       bool   `json:"esta_embarazada"`
	MesesEmbarazo        int    `json:"meses_embarazo,omitempty"`
	LlevaControl         bool   `json:"lleva_control,omitempty"`
	EsAltoRiesgo         bool   `json:"es_alto_riesgo,omitempty"`
	TipoApoyoInstitucion string `json:"tipo_apoyo_institucion,omitempty"`
	NombrePadreBebe      string `json:"nombre_padre_bebe,omitempty"`
	VivenJuntosPadres    bool   `json:"viven_juntos_padres,omitempty"`

	EstaLactando         bool   `json:"esta_lactando"`
	MesesLactancia       int    `json:"meses_lactancia,omitempty"`
	GeneroBebe           string `json:"genero_bebe,omitempty"`
	DiasNacido           int    `json:"dias_nacido,omitempty"`
	NombrePadreLactancia string `json:"nombre_padre_lactancia,omitempty"`
	EdadPadreLactancia   int    `json:"edad_padre_lactancia,omitempty"`

	EsMaternidad     bool   `json:"es_maternidad"`
	TiempoMaternidad string `json:"tiempo_maternidad,omitempty"`

	EsPadre          bool   `json:"es_padre"`
	TiempoPaternidad string `json:"tiempo_paternidad,omitempty"`

	ParejaEsEstudiante bool `json:"pareja_es_estudiante"`
	ParejaID           uint `json:"pareja_id,omitempty"`

	NombrePareja   string `json:"nombre_pareja,omitempty"`
	EdadPareja     int    `json:"edad_pareja,omitempty"`
	TelefonoPareja string `json:"telefono_pareja,omitempty"`

	ParejaEsMenorDeEdad bool              `json:"pareja_es_menor_de_edad,omitempty"`
	DetallePadresPareja *InfoPadresPareja `json:"detalle_padres_pareja,omitempty"`
}

type Matricula struct {
	ID           uint `gorm:"primaryKey" json:"id"`
	EstudianteID uint `json:"estudiante_id"`
	CursoID      uint `json:"curso_id"`

	Estado      string `gorm:"default:'Matriculado'" json:"estado"`
	EsRepetidor bool   `json:"es_repetidor"`

	Antropometria      common.JSONMap[Antropometria]      `gorm:"type:text" json:"antropometria"`
	HistorialAcademico common.JSONMap[HistorialAcademico] `gorm:"type:text" json:"historial_academico"`
	DatosSalud         common.JSONMap[DatosSalud]         `gorm:"type:text" json:"datos_salud"`
	DatosSociales      common.JSONMap[DatosSociales]      `gorm:"type:text" json:"datos_sociales"`
	CondicionGenero    common.JSONMap[CondicionGenero]    `gorm:"type:text" json:"condicion_genero"`

	DireccionActual    string `json:"direccion_actual"`
	RutaCroquis        string `json:"ruta_croquis"`
	RutaConsentimiento string `json:"ruta_consentimiento"`
	FechaRegistro      string `json:"fecha_registro"`

	Estudiante student.Estudiante `gorm:"foreignKey:EstudianteID" json:"estudiante,omitempty"`
	Curso      faculty.Curso      `gorm:"foreignKey:CursoID" json:"curso,omitempty"`
}

type RetiroEstudiante struct {
	ID               uint   `gorm:"primaryKey" json:"id"`
	MatriculaID      uint   `json:"matricula_id"`
	FechaRetiro      string `json:"fecha_retiro"`
	Motivo           string `json:"motivo"`
	NuevaInstitucion string `json:"nueva_institucion"`
	ProvinciaDestino string `json:"provincia_destino"`
	Observaciones    string `json:"observaciones"`

	Matricula Matricula `gorm:"foreignKey:MatriculaID" json:"matricula,omitempty"`
}
