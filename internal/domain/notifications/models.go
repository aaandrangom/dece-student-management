package notifications

import (
	"dece/internal/domain/common"
	"time"
)

type CitaAlertaItem struct {
	ConvocatoriaID uint   `json:"convocatoria_id"`
	FechaCita      string `json:"fecha_cita"`
	Entidad        string `json:"entidad"`
	Motivo         string `json:"motivo"`
	Estudiante     string `json:"estudiante"`
	Curso          string `json:"curso"`
}

type NotificacionMetadata struct {
	Total int              `json:"total"`
	Items []CitaAlertaItem `json:"items"`
}

type Notificacion struct {
	ID              uint   `gorm:"primaryKey" json:"id"`
	Tipo            string `gorm:"not null;uniqueIndex:idx_notif_tipo_fecha_rol_momento" json:"tipo"`
	RolDestino      string `gorm:"not null;default:admin;uniqueIndex:idx_notif_tipo_fecha_rol_momento" json:"rol_destino"`
	FechaProgramada string `gorm:"not null;uniqueIndex:idx_notif_tipo_fecha_rol_momento" json:"fecha_programada"` // YYYY-MM-DD
	Momento         string `gorm:"not null;uniqueIndex:idx_notif_tipo_fecha_rol_momento" json:"momento"`          // 00:00 | 07:00 | 17:00

	Titulo  string `gorm:"not null" json:"titulo"`
	Mensaje string `json:"mensaje"`

	Leida bool `gorm:"default:false" json:"leida"`

	Metadata common.JSONMap[NotificacionMetadata] `gorm:"type:text" json:"metadata"`

	FechaCreacion time.Time `gorm:"autoCreateTime" json:"fecha_creacion"`
}
