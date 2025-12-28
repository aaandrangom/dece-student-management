package security

import (
	"dece/internal/domain/common"
	"time"
)

type Usuario struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	NombreUsuario  string    `gorm:"unique;not null" json:"nombre_usuario"`
	ClaveHash      string    `gorm:"not null" json:"-"`
	NombreCompleto string    `gorm:"not null" json:"nombre_completo"`
	Rol            string    `gorm:"default:dece" json:"rol"`
	Activo         bool      `gorm:"default:true" json:"activo"`
	FechaCreacion  time.Time `gorm:"autoCreateTime" json:"fecha_creacion"`
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
	Rector           Autoridad `json:"rector"`
	Subdirector      Autoridad `json:"subdirector"`
	InspectorGeneral Autoridad `json:"inspector_general"`
	ResponsableDECE  Autoridad `json:"responsable_dece"`
}

type ConfiguracionInstitucional struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	Nombre     string `json:"nombre"`
	CodigoAMIE string `json:"codigo_amie"`
	Distrito   string `json:"distrito"`
	Circuito   string `json:"circuito"`

	DetalleUbicacion common.JSONMap[DetalleUbicacion]       `gorm:"type:text" json:"detalle_ubicacion"`
	Autoridades      common.JSONMap[AutoridadesInstitucion] `gorm:"type:text" json:"autoridades"`

	FechaActualizacion time.Time `gorm:"autoUpdateTime" json:"fecha_actualizacion"`
}
