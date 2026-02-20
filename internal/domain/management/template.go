package management

import "dece/internal/domain/common"

type PlantillaTags struct {
	Tags      []string          `json:"tags"`
	TagLabels map[string]string `json:"tag_labels,omitempty"`
}

type Plantilla struct {
	ID                uint                          `gorm:"primaryKey" json:"id"`
	Nombre            string                        `json:"nombre"`
	Descripcion       string                        `json:"descripcion"`
	RutaArchivo       string                        `json:"ruta_archivo"`
	Tags              common.JSONMap[PlantillaTags] `gorm:"type:text" json:"tags"`
	IncluyeFirma      bool                          `json:"incluye_firma" gorm:"default:false"`
	FechaCreacion     string                        `json:"fecha_creacion"`
	FechaModificacion string                        `json:"fecha_modificacion"`
}
