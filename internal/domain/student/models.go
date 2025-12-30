package student

import (
	"dece/internal/domain/common"
)

type InfoNacionalidad struct {
	EsExtranjero   bool   `json:"es_extranjero"`
	PaisOrigen     string `json:"pais_origen"`
	PasaporteOrDNI string `json:"pasaporte_odni"`
}

type Estudiante struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	Cedula    string `gorm:"unique;not null" json:"cedula"`
	Apellidos string `gorm:"not null" json:"apellidos"`
	Nombres   string `gorm:"not null" json:"nombres"`

	FechaNacimiento string `json:"fecha_nacimiento"`

	GeneroNacimiento string `json:"genero_nacimiento"`

	InfoNacionalidad common.JSONMap[InfoNacionalidad] `gorm:"type:text" json:"info_nacionalidad"`
	RutaFoto         string                           `json:"ruta_foto"`

	Familiares []Familiar `gorm:"foreignKey:EstudianteID" json:"familiares"`

	FechaCreacion string `gorm:"default:CURRENT_TIMESTAMP" json:"fecha_creacion"`
}

type DatosFamiliar struct {
	NivelInstruccion string `json:"nivel_instruccion"`
	Profesion        string `json:"profesion"`
	LugarTrabajo     string `json:"lugar_trabajo"`
}

type Familiar struct {
	ID                   uint   `gorm:"primaryKey" json:"id"`
	EstudianteID         uint   `json:"estudiante_id"`
	Cedula               string `json:"cedula"`
	NombresCompletos     string `gorm:"not null" json:"nombres_completos"`
	Parentesco           string `json:"parentesco"`
	EsRepresentanteLegal bool   `json:"es_representante_legal"`
	ViveConEstudiante    bool   `json:"vive_con_estudiante"`

	DatosExtendidos common.JSONMap[DatosFamiliar] `gorm:"type:text" json:"datos_extendidos"`

	TelefonoPersonal string `json:"telefono_personal"`
	Fallecido        bool   `json:"fallecido"`
}
