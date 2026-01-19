package reports

import (
	"dece/internal/domain/common"
	"dece/internal/domain/enrollment"
)

type FichaEstudiantilDTO struct {
	DatosPersonales DatosPersonalesDTO     `json:"datos_personales"`
	Familiares      []DatosFamiliarDTO     `json:"familiares"`
	Disciplina      []DatosDisciplinaDTO   `json:"disciplina"`
	CasosSensibles  []DatosCasoSensibleDTO `json:"casos_sensibles"`
}

type DatosPersonalesDTO struct {
	ID                uint   `json:"id"`
	Cedula            string `json:"cedula"`
	Apellidos         string `json:"apellidos"`
	Nombres           string `json:"nombres"`
	FechaNacimiento   string `json:"fecha_nacimiento"`
	GeneroNacimiento  string `json:"genero_nacimiento"`
	CorreoElectronico string `json:"correo_electronico"`
	RutaFoto          string `json:"ruta_foto"`
	CursoActual       string `json:"curso_actual"`
	Jornada           string `json:"jornada"`
	DireccionActual   string `json:"direccion_actual"`

	// JSON Columns
	InfoNacionalidad common.JSONMap[map[string]interface{}]   `json:"info_nacionalidad" gorm:"type:text"`
	DatosSalud       common.JSONMap[enrollment.DatosSalud]    `json:"datos_salud" gorm:"type:text"`
	DatosSociales    common.JSONMap[enrollment.DatosSociales] `json:"datos_sociales" gorm:"type:text"`
	Antropometria    common.JSONMap[enrollment.Antropometria] `json:"antropometria" gorm:"type:text"`
}

type DatosFamiliarDTO struct {
	NombresCompletos     string `json:"nombres_completos"`
	Parentesco           string `json:"parentesco"`
	TelefonoPersonal     string `json:"telefono_personal"`
	EsRepresentanteLegal bool   `json:"es_representante_legal"`
	ViveConEstudiante    bool   `json:"vive_con_estudiante"`
	DatosExtendidos      string `json:"datos_extendidos"` // JSON string
}

type DatosDisciplinaDTO struct {
	Fecha          string `json:"fecha"`
	Motivo         string `json:"motivo"`
	DetalleSancion string `json:"detalle_sancion"`
	RutaActa       string `json:"ruta_acta"`
	Estado         string `json:"estado"`
	PeriodoLectivo string `json:"periodo_lectivo"`
}

type DatosCasoSensibleDTO struct {
	CodigoCaso        string `json:"codigo_caso"`
	FechaDeteccion    string `json:"fecha_deteccion"`
	TipoCaso          string `json:"tipo_caso"`
	Estado            string `json:"estado"`
	EntidadDerivacion string `json:"entidad_derivacion"`
	Descripcion       string `json:"descripcion"`
}
