package security

import (
	"dece/internal/domain/common"
)

type Usuario struct {
	ID             uint   `gorm:"primaryKey" json:"id"`
	NombreUsuario  string `gorm:"unique;not null" json:"nombre_usuario"`
	ClaveHash      string `gorm:"not null" json:"-"`
	NombreCompleto string `gorm:"not null" json:"nombre_completo"`
	Rol            string `gorm:"default:dece" json:"rol"`
	Activo         bool   `gorm:"default:true" json:"activo"`

	FechaCreacion string `json:"fecha_creacion"`
}

type DetalleUbicacion struct {
	Provincia     string `json:"provincia"`
	Canton        string `json:"canton"`
	Parroquia     string `json:"parroquia"`
	BarrioRecinto string `json:"barrio_recinto"`
}

type Autoridad struct {
	Cedula    string `json:"cedula"`
	Nombres   string `json:"nombres"`
	Apellidos string `json:"apellidos"`
	Telefono  string `json:"telefono"`
	Jornada   string `json:"jornada"`
}

type AutoridadesInstitucion struct {
	Rector                Autoridad `json:"rector"`
	SubdirectorMatutina   Autoridad `json:"subdirector_matutina"`
	SubdirectorVespertina Autoridad `json:"subdirector_vespertina"`
	InspectorGeneral      Autoridad `json:"inspector_general"`
	Subinspector          Autoridad `json:"subinspector"`
	CoordinadorDECE       Autoridad `json:"coordinador_dece"`
	AnalistaDECE1         Autoridad `json:"analista_dece_1"`
	AnalistaDECE2         Autoridad `json:"analista_dece_2"`
}

type ConfiguracionInstitucional struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	Nombre     string `json:"nombre"`
	CodigoAMIE string `json:"codigo_amie"`
	Distrito   string `json:"distrito"`
	Circuito   string `json:"circuito"`

	DetalleUbicacion common.JSONMap[DetalleUbicacion]       `gorm:"type:text" json:"detalle_ubicacion"`
	Autoridades      common.JSONMap[AutoridadesInstitucion] `gorm:"type:text" json:"autoridades"`

	FechaActualizacion string `json:"fecha_actualizacion"`
}
